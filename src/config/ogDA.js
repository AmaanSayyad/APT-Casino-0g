/**
 * 0G Data Availability Configuration
 */

export const OG_DA_CONFIG = {
  // 0G DA Network endpoints
  rpcUrl: process.env.NEXT_PUBLIC_0G_MAINNET_RPC || 'https://evmrpc.0g.ai',
  storageUrl: process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER || 'https://indexer-storage-turbo.0g.ai',
  
  // Network configuration
  chainId: 16661,
  networkName: '0G Mainnet',
  
  // DA specific settings
  maxDataSize: 1024 * 1024, // 1MB max
  timeout: 30000, // 30 seconds
  retries: 3,
  
  // Storage settings
  storageNodes: [
    'https://indexer-storage-turbo.0g.ai'
  ]
};

// Get current DA network configuration
export const getCurrentDANetworkConfig = () => {
  const network = process.env.NEXT_PUBLIC_NETWORK || process.env.NEXT_PUBLIC_DEFAULT_NETWORK;
  const isMainnet = network === '0g-mainnet' || network === 'mainnet';
  
  return {
    ...OG_DA_CONFIG,
    rpcUrl: isMainnet 
      ? (process.env.NEXT_PUBLIC_0G_MAINNET_RPC || 'https://evmrpc.0g.ai')
      : (process.env.NEXT_PUBLIC_0G_GALILEO_RPC || 'https://evmrpc-testnet.0g.ai'),
    chainId: isMainnet ? 16661 : 16602,
    networkName: isMainnet ? '0G Mainnet' : '0G Testnet'
  };
};

// Validate blob size
export const validateBlobSize = (data) => {
  const size = typeof data === 'string' ? new Blob([data]).size : data.length;
  return size <= OG_DA_CONFIG.maxDataSize;
};

export default OG_DA_CONFIG;