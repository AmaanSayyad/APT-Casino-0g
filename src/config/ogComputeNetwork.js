/**
 * 0G Compute Network Configuration
 * Configuration for 0G Compute Network AI services integration
 */

// 0G Network RPC URLs
export const OG_COMPUTE_NETWORK_CONFIG = {
  // Testnet configuration
  testnet: {
    rpcUrl: process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai',
    networkName: '0G Testnet',
    chainId: 16602,
  },
  
  // Mainnet configuration
  mainnet: {
    rpcUrl: process.env.NEXT_PUBLIC_0G_MAINNET_RPC_URL || 'https://evmrpc.0g.ai',
    networkName: '0G Mainnet',
    chainId: 16601,
  },
};

// Official 0G Compute Network Providers
export const OG_COMPUTE_PROVIDERS = {
  // Official providers from 0G documentation
  GPT_OSS_120B: {
    address: '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
    model: 'gpt-oss-120b',
    name: 'GPT-OSS 120B',
    description: 'State-of-the-art 70B parameter model for general AI tasks',
    verification: 'TEE (TeeML)',
  },
  
  DEEPSEEK_R1_70B: {
    address: '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3',
    model: 'deepseek-r1-70b',
    name: 'DeepSeek R1 70B',
    description: 'Advanced reasoning model optimized for complex problem solving',
    verification: 'TEE (TeeML)',
  },
};

// Default provider (can be changed based on use case)
export const DEFAULT_PROVIDER = OG_COMPUTE_PROVIDERS.GPT_OSS_120B;

// Account management settings
export const OG_COMPUTE_ACCOUNT_CONFIG = {
  // Minimum balance to maintain (in OG tokens)
  minBalance: 0.01,
  
  // Default deposit amount (in OG tokens)
  defaultDeposit: 0.5, // Increased to 0.5 OG for inference
  
  // Low balance threshold (in OG tokens)
  lowBalanceThreshold: 0.1, // Increased to 0.1 OG
  
  // Minimum balance required for inference (provider response reservation)
  minInferenceBalance: 0.5, // ~0.4 OG + buffer
};

// Service settings
export const OG_COMPUTE_SERVICE_CONFIG = {
  // Request timeout (in milliseconds)
  requestTimeout: 30000,
  
  // Maximum retries for failed requests
  maxRetries: 3,
  
  // Retry delay (in milliseconds)
  retryDelay: 1000,
  
  // Enable response verification
  enableVerification: true,
};

// Get current network config (testnet or mainnet)
export const getCurrentNetworkConfig = () => {
  const isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'MAINNET';
  return isMainnet 
    ? OG_COMPUTE_NETWORK_CONFIG.mainnet 
    : OG_COMPUTE_NETWORK_CONFIG.testnet;
};

// Helper to get provider by address
export const getProviderByAddress = (address) => {
  return Object.values(OG_COMPUTE_PROVIDERS).find(
    provider => provider.address.toLowerCase() === address.toLowerCase()
  );
};

export default OG_COMPUTE_NETWORK_CONFIG;

