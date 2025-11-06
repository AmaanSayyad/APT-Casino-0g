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

export default OG_DA_CONFIG;