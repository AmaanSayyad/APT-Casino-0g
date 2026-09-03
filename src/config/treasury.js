// Public treasury / chain settings only (safe for client bundles).
// Server signing: getTreasuryPrivateKey() returns empty in the browser.

function reqEnv(name, publicFallbackNames = []) {
  const v = process.env[name] || publicFallbackNames.map((n) => process.env[n]).find(Boolean);
  return (v && String(v).trim()) || '';
}

export const OG_MAINNET = {
  CHAIN_ID: 16661,
  CHAIN_ID_HEX: '0x4115',
  CHAIN_NAME: '0G Mainnet',
  RPC_URL: 'https://evmrpc.0g.ai',
  EXPLORER_URL: 'https://chainscan.0g.ai',
};

export const OG_GALILEO_TESTNET = {
  CHAIN_ID: 16602,
  CHAIN_ID_HEX: '0x40da',
  CHAIN_NAME: '0G-Galileo-Testnet',
  RPC_URL: 'https://evmrpc-testnet.0g.ai',
  EXPLORER_URL: 'https://chainscan-galileo.0g.ai',
};

export const OG_SUPPORTED_CHAIN_IDS = [OG_MAINNET.CHAIN_ID, OG_GALILEO_TESTNET.CHAIN_ID];

export function getOgNetworkByChainId(chainId) {
  if (chainId === OG_MAINNET.CHAIN_ID) return OG_MAINNET;
  if (chainId === OG_GALILEO_TESTNET.CHAIN_ID) return OG_GALILEO_TESTNET;
  return null;
}

export const TREASURY_CONFIG = {
  ADDRESS: reqEnv('NEXT_PUBLIC_TREASURY_ADDRESS', ['TREASURY_ADDRESS']),

  NETWORK: {
    ...OG_MAINNET,
    CHAIN_ID_DECIMAL: OG_MAINNET.CHAIN_ID,
  },

  GAS: {
    DEPOSIT_LIMIT: process.env.GAS_LIMIT_DEPOSIT
      ? '0x' + parseInt(process.env.GAS_LIMIT_DEPOSIT, 10).toString(16)
      : '0x5208',
    WITHDRAW_LIMIT: process.env.GAS_LIMIT_WITHDRAW
      ? '0x' + parseInt(process.env.GAS_LIMIT_WITHDRAW, 10).toString(16)
      : '0x186A0',
  },

  LIMITS: {
    MIN_DEPOSIT: parseFloat(process.env.MIN_DEPOSIT || '0.001'),
    MAX_DEPOSIT: parseFloat(process.env.MAX_DEPOSIT || '100'),
  },
};

export const getTreasuryPrivateKey = () => {
  if (typeof window !== 'undefined') return '';
  return process.env.TREASURY_PRIVATE_KEY || '';
};

export const isValidTreasuryAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

export const getTreasuryInfo = () => ({
  address: TREASURY_CONFIG.ADDRESS,
  network: TREASURY_CONFIG.NETWORK.CHAIN_NAME,
  chainId: TREASURY_CONFIG.NETWORK.CHAIN_ID,
});
