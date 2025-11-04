/**
 * 0G Data Availability (DA) Configuration
 * Configuration for 0G DA blob submission and retrieval
 */

// 0G DA Network Configuration
export const OG_DA_CONFIG = {
  // Testnet configuration
  testnet: {
    rpcUrl: process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai',
    daClientUrl: process.env.NEXT_PUBLIC_0G_DA_CLIENT_URL || 'http://localhost:51001',
    entranceContract: '0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9',
    networkName: '0G Testnet',
    chainId: 16602,
  },
  
  // Mainnet configuration
  mainnet: {
    rpcUrl: process.env.NEXT_PUBLIC_0G_MAINNET_RPC_URL || 'https://evmrpc.0g.ai',
    daClientUrl: process.env.NEXT_PUBLIC_0G_DA_CLIENT_URL || 'http://localhost:51001',
    entranceContract: '0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9', // Update with mainnet address
    networkName: '0G Mainnet',
    chainId: 16601,
  },
};

// DA Blob Configuration
export const OG_DA_BLOB_CONFIG = {
  // Maximum blob size (in bytes)
  MAX_BLOB_SIZE: 32505852, // ~32 MB
  
  // Recommended blob size for batch submissions
  RECOMMENDED_BATCH_SIZE: 1000000, // ~1 MB
  
  // Minimum blob size (in bytes)
  MIN_BLOB_SIZE: 1,
  
  // Timeout for blob submission (in milliseconds)
  SUBMISSION_TIMEOUT: 60000, // 60 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
};

// DA Fee Configuration
export const OG_DA_FEE_CONFIG = {
  // Blob price (in OG tokens) - will be fetched from contract
  BLOB_PRICE: 0, // Dynamic, fetched from DA contract
  
  // Estimated gas for submission (in wei)
  ESTIMATED_GAS: 2000000n,
};

// Game History DA Configuration
export const OG_DA_GAME_HISTORY_CONFIG = {
  // Batch size for game history (number of games per blob)
  BATCH_SIZE: 100, // 100 games per blob
  
  // Enable automatic DA submission for game results
  AUTO_SUBMIT: true,
  
  // Compression enabled
  COMPRESSION_ENABLED: true,
};

// Get current network config
export const getCurrentDANetworkConfig = () => {
  const isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'MAINNET';
  return isMainnet 
    ? OG_DA_CONFIG.mainnet 
    : OG_DA_CONFIG.testnet;
};

// Helper to validate blob size
export const validateBlobSize = (data) => {
  const size = typeof data === 'string' 
    ? new TextEncoder().encode(data).length 
    : Buffer.isBuffer(data) 
      ? data.length 
      : JSON.stringify(data).length;
  
  if (size > OG_DA_BLOB_CONFIG.MAX_BLOB_SIZE) {
    throw new Error(`Blob size ${size} bytes exceeds maximum ${OG_DA_BLOB_CONFIG.MAX_BLOB_SIZE} bytes`);
  }
  
  return size;
};

export default OG_DA_CONFIG;

