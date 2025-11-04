/**
 * 0G Storage Configuration
 * Configuration for 0G Storage network integration
 */

// 0G Storage Network Configuration
export const OG_STORAGE_CONFIG = {
  // Testnet configuration
  testnet: {
    rpcUrl: process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai',
    indexerRpc: process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai',
    networkName: '0G Testnet',
    chainId: 16602,
  },
  
  // Mainnet configuration
  mainnet: {
    rpcUrl: process.env.NEXT_PUBLIC_0G_MAINNET_RPC_URL || 'https://evmrpc.0g.ai',
    indexerRpc: process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER_RPC || 'https://indexer-storage-turbo.0g.ai',
    networkName: '0G Mainnet',
    chainId: 16601,
  },
};

// Storage Configuration
export const OG_STORAGE_SETTINGS = {
  // Default segment number for node selection
  DEFAULT_SEGMENT_NUMBER: 1,
  
  // Default number of replicas
  DEFAULT_REPLICAS: 3,
  
  // Maximum file size (in bytes) - 0G supports large files
  MAX_FILE_SIZE: 10 * 1024 * 1024 * 1024, // 10 GB
  
  // Recommended chunk size for large uploads
  RECOMMENDED_CHUNK_SIZE: 10 * 1024 * 1024, // 10 MB
  
  // Upload timeout (in milliseconds)
  UPLOAD_TIMEOUT: 300000, // 5 minutes
  
  // Download timeout (in milliseconds)
  DOWNLOAD_TIMEOUT: 300000, // 5 minutes
  
  // Enable Merkle proof verification by default
  DEFAULT_VERIFY_PROOF: true,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
};

// Storage Paths for Different Data Types
export const OG_STORAGE_PATHS = {
  // Game assets
  GAME_ASSETS: 'game-assets',
  GAME_IMAGES: 'game-assets/images',
  GAME_SOUNDS: 'game-assets/sounds',
  GAME_ANIMATIONS: 'game-assets/animations',
  
  // User data
  USER_PROFILES: 'user-profiles',
  USER_AVATARS: 'user-profiles/avatars',
  USER_SETTINGS: 'user-profiles/settings',
  
  // Tournament data
  TOURNAMENTS: 'tournaments',
  TOURNAMENT_LEADERBOARDS: 'tournaments/leaderboards',
  TOURNAMENT_RESULTS: 'tournaments/results',
  
  // Game history backups
  GAME_HISTORY_BACKUPS: 'game-history/backups',
  GAME_HISTORY_ARCHIVES: 'game-history/archives',
  
  // Analytics data
  ANALYTICS: 'analytics',
  ANALYTICS_REPORTS: 'analytics/reports',
  
  // KV Storage streams
  KV_STREAMS: {
    USER_STATE: 1,
    GAME_STATE: 2,
    TOURNAMENT_STATE: 3,
  },
};

// Get current network config
export const getCurrentStorageNetworkConfig = () => {
  const isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'MAINNET';
  return isMainnet 
    ? OG_STORAGE_CONFIG.mainnet 
    : OG_STORAGE_CONFIG.testnet;
};

// Helper to build storage path
export const buildStoragePath = (category, filename) => {
  return `${category}/${filename}`;
};

// Helper to validate file size
export const validateFileSize = (size) => {
  if (size > OG_STORAGE_SETTINGS.MAX_FILE_SIZE) {
    throw new Error(`File size ${size} bytes exceeds maximum ${OG_STORAGE_SETTINGS.MAX_FILE_SIZE} bytes`);
  }
  return true;
};

export default OG_STORAGE_CONFIG;

