import { defineChain, parseEther } from 'viem';
import {
  TREASURY_CONFIG,
  OG_MAINNET,
  OG_GALILEO_TESTNET,
  OG_SUPPORTED_CHAIN_IDS,
  getOgNetworkByChainId,
  isValidTreasuryAddress,
} from '@/config/treasury';

let cachedTreasuryAddress = null;

/**
 * Resolve treasury `to` address in the browser:
 * env-inlined config first, then GET /api/treasury-address.
 */
export async function resolveTreasuryAddressForClient() {
  const fromConfig = (TREASURY_CONFIG.ADDRESS || '').trim();
  if (fromConfig && isValidTreasuryAddress(fromConfig)) return fromConfig;
  if (cachedTreasuryAddress && isValidTreasuryAddress(cachedTreasuryAddress)) return cachedTreasuryAddress;

  const res = await fetch('/api/treasury-address', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load treasury address from server.');
  const data = await res.json();
  const addr = (data?.address || '').trim();
  if (!addr || !isValidTreasuryAddress(addr)) {
    throw new Error('Treasury address is not configured. Set NEXT_PUBLIC_TREASURY_ADDRESS in .env and restart.');
  }
  cachedTreasuryAddress = addr;
  return addr;
}

function buildViemChain(network) {
  return defineChain({
    id: network.CHAIN_ID,
    name: network.CHAIN_NAME,
    nativeCurrency: { name: 'OG', symbol: 'OG', decimals: 18 },
    rpcUrls: { default: { http: [network.RPC_URL] } },
    blockExplorers: { default: { name: 'Explorer', url: network.EXPLORER_URL } },
    testnet: network.CHAIN_ID === OG_GALILEO_TESTNET.CHAIN_ID,
  });
}

function rpcErrorCode(error) {
  return (
    error?.code ??
    error?.cause?.code ??
    error?.data?.originalError?.code ??
    undefined
  );
}

/**
 * Ensure wallet is on one of the two supported 0G chains.
 * - If already on mainnet or testnet → do nothing (keep user's chain).
 * - If on a different chain → switch to 0G Mainnet (preferred), falling back to adding it.
 */
export async function ensureOgChain(walletClient) {
  if (!walletClient) throw new Error('Wallet is not ready');

  const currentChainId = await walletClient.getChainId();
  if (OG_SUPPORTED_CHAIN_IDS.includes(currentChainId)) {
    // Already on a supported 0G chain — respect user's choice
    return currentChainId;
  }

  // Try switching to mainnet first
  const target = buildViemChain(OG_MAINNET);
  try {
    await walletClient.switchChain({ id: target.id });
    return target.id;
  } catch (switchError) {
    if (rpcErrorCode(switchError) === 4902) {
      // Chain not in wallet yet — add it, then switch
      await walletClient.addChain({ chain: target });
      await walletClient.switchChain({ id: target.id });
      return target.id;
    }
    throw switchError;
  }
}

export async function sendTreasuryNativeDeposit(walletClient, { account, amount, amountOg }) {
  if (!walletClient) throw new Error('Wallet is not ready');

  const treasuryAddress = await resolveTreasuryAddressForClient();

  const rawAmount = amount ?? amountOg;
  const amount_ = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount);
  if (!amount_ || amount_ <= 0 || !Number.isFinite(amount_)) {
    throw new Error(`Invalid deposit amount: ${rawAmount}`);
  }

  // Switch to an OG chain if needed, get the active chain ID after switch
  const activeChainId = await ensureOgChain(walletClient);
  const network = getOgNetworkByChainId(activeChainId) ?? OG_MAINNET;
  const chain = buildViemChain(network);

  const gasHex = TREASURY_CONFIG.GAS.DEPOSIT_LIMIT;
  const gas =
    typeof gasHex === 'string' && gasHex.startsWith('0x')
      ? BigInt(gasHex)
      : BigInt(Number.parseInt(String(gasHex), 10));

  return walletClient.sendTransaction({
    account,
    chain,
    to: treasuryAddress,
    value: parseEther(String(amount_)),
    gas,
  });
}
