/**
 * Canonical 0G network config.
 * Wave 3 requires 0G Chain on mainnet (chain ID 16661).
 * Compute and DA may remain on testnet.
 */

const MAINNET_ALIASES = new Set([
  'MAINNET',
  '0g-mainnet',
  'og-mainnet',
  '0G_MAINNET',
  '0G-MAINNET',
]);

export const isOgMainnet = () => {
  const network = process.env.NEXT_PUBLIC_NETWORK || '';
  const chain = process.env.NEXT_PUBLIC_0G_CHAIN || '';
  return MAINNET_ALIASES.has(network) || chain === 'mainnet';
};

export const OG_MAINNET = {
  chainId: 16661,
  chainIdHex: '0x4115',
  name: '0G Mainnet',
  network: '0g-mainnet',
  nativeCurrency: {
    name: '0G',
    symbol: '0G',
    decimals: 18,
  },
  rpcUrl: process.env.NEXT_PUBLIC_0G_MAINNET_RPC_URL || 'https://evmrpc.0g.ai',
  explorerUrl: process.env.NEXT_PUBLIC_0G_MAINNET_EXPLORER || 'https://chainscan.0g.ai',
  storageIndexer:
    process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER_MAINNET ||
    'https://indexer-storage-turbo.0g.ai',
};

export const OG_TESTNET = {
  chainId: 16602,
  chainIdHex: '0x40da',
  name: '0G-Galileo-Testnet',
  network: 'og-galileo-testnet',
  nativeCurrency: {
    name: 'OG',
    symbol: 'OG',
    decimals: 18,
  },
  rpcUrl: process.env.NEXT_PUBLIC_0G_GALILEO_RPC || 'https://evmrpc-testnet.0g.ai',
  explorerUrl:
    process.env.NEXT_PUBLIC_0G_GALILEO_EXPLORER || 'https://chainscan-galileo.0g.ai',
  storageIndexer:
    process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER_RPC ||
    'https://indexer-storage-testnet-turbo.0g.ai',
};

export const getOgChainConfig = () => (isOgMainnet() ? OG_MAINNET : OG_TESTNET);

export const getGameLoggerAddress = () =>
  process.env.NEXT_PUBLIC_GAME_LOGGER_CONTRACT || null;

export default {
  isOgMainnet,
  OG_MAINNET,
  OG_TESTNET,
  getOgChainConfig,
  getGameLoggerAddress,
};
