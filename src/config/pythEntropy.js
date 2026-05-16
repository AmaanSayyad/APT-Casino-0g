/**
 * Pyth Entropy — RPC and contracts for the chain where entropy requests are settled.
 * Use NEXT_PUBLIC_ORACLE_* env vars (no chain-specific naming in .env).
 * Internal keys: entropy-testnet, entropy-mainnet. Legacy aliases still resolve.
 */

const DEFAULT_ENTROPY_NETWORK = 'entropy-testnet';

const LEGACY_KEY_TO_KEY = {
  'arbitrum-sepolia': 'entropy-testnet',
  'arbitrum-one': 'entropy-mainnet',
};

export function normalizeEntropyNetworkKey(network) {
  if (network == null || network === '') return DEFAULT_ENTROPY_NETWORK;
  const s = String(network);
  return LEGACY_KEY_TO_KEY[s] || s;
}

export const PYTH_ENTROPY_CONFIG = {
  NETWORKS: {
    'entropy-testnet': {
      chainId: Number(process.env.NEXT_PUBLIC_ORACLE_CHAIN_ID || 421614),
      name: 'Entropy oracle (testnet)',
      rpcUrl:
        process.env.NEXT_PUBLIC_ORACLE_RPC_URL ||
        'https://sepolia-rollup.arbitrum.io/rpc',
      entropyContract:
        process.env.NEXT_PUBLIC_PYTH_ENTROPY_CONTRACT ||
        '0x549ebba8036ab746611b4ffa1423eb0a4df61440',
      entropyProvider:
        process.env.NEXT_PUBLIC_PYTH_ENTROPY_PROVIDER ||
        '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344',
      explorerUrl:
        process.env.NEXT_PUBLIC_ORACLE_TX_EXPLORER || 'https://sepolia.arbiscan.io',
      entropyExplorerUrl: 'https://entropy-explorer.pyth.network',
    },
    'entropy-mainnet': {
      chainId: Number(process.env.NEXT_PUBLIC_ORACLE_MAINNET_CHAIN_ID || 42161),
      name: 'Entropy oracle (mainnet)',
      rpcUrl:
        process.env.NEXT_PUBLIC_ORACLE_MAINNET_RPC_URL || 'https://arb1.arbitrum.io/rpc',
      entropyContract: '0x0000000000000000000000000000000000000000',
      explorerUrl:
        process.env.NEXT_PUBLIC_ORACLE_MAINNET_TX_EXPLORER || 'https://arbiscan.io',
      entropyExplorerUrl: 'https://entropy-explorer.pyth.network',
    },
  },

  DEFAULT_NETWORK: DEFAULT_ENTROPY_NETWORK,

  GAME_TYPES: {
    MINES: 0,
    PLINKO: 1,
    ROULETTE: 2,
    WHEEL: 3,
  },

  REQUEST_CONFIG: {
    gasLimit: 500000,
    maxGasPrice: '1000000000',
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
  },

  EXPLORER_CONFIG: {
    baseUrl: 'https://entropy-explorer.pyth.network',
    supportedChains: ['entropy-testnet', 'entropy-mainnet'],
    transactionLinkFormat: 'https://entropy-explorer.pyth.network/tx/{txHash}',
  },

  getNetworkConfig(network) {
    if (typeof network === 'number') {
      const networkEntry = Object.entries(this.NETWORKS).find(
        ([_, config]) => config.chainId === network
      );
      return networkEntry ? networkEntry[1] : null;
    }
    const key = normalizeEntropyNetworkKey(network);
    return this.NETWORKS[key] || this.NETWORKS[DEFAULT_ENTROPY_NETWORK];
  },

  getEntropyContract(network) {
    const config = this.getNetworkConfig(network);
    return config?.entropyContract || '0x0000000000000000000000000000000000000000';
  },

  getExplorerUrl(txHash, network) {
    const config = this.getNetworkConfig(network);
    return `${config.explorerUrl}/tx/${txHash}`;
  },

  getEntropyExplorerUrl(txHash) {
    return `https://entropy-explorer.pyth.network/tx/${txHash}`;
  },

  isNetworkSupported(network) {
    const key = normalizeEntropyNetworkKey(network);
    return key in this.NETWORKS;
  },

  getSupportedNetworks() {
    return Object.keys(this.NETWORKS);
  },
};

export default PYTH_ENTROPY_CONFIG;
