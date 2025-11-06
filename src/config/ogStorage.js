/**
 * 0G Storage Configuration
 */

export const OG_STORAGE_CONFIG = {
  // 0G Storage Network endpoints
  rpcUrl: process.env.NEXT_PUBLIC_0G_MAINNET_RPC || 'https://evmrpc.0g.ai',
  storageUrl: process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER || 'https://indexer-storage-turbo.0g.ai',
  
  // Network configuration
  chainId: 16661,
  networkName: '0G Mainnet',
  
  // Storage specific settings
  maxFileSize: 10 * 1024 * 1024, // 10MB max
  timeout: 60000, // 60 seconds
  retries: 3,
  
  // Storage nodes
  storageNodes: [
    'https://indexer-storage-turbo.0g.ai'
  ],
  
  // File settings
  supportedTypes: [
    'application/json',
    'text/plain',
    'image/jpeg',
    'image/png',
    'application/pdf'
  ]
};

export default OG_STORAGE_CONFIG;