/**
 * Custom Chain Definitions
 * Defines custom chains not included in wagmi/chains
 */

import { defineChain } from 'viem';

// 0G Mainnet Chain Definition
export const ogGalileo = defineChain({
  id: 16661,
  name: '0G Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OG',
    symbol: 'OG',
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc.0g.ai'],
    },
    public: {
      http: ['https://evmrpc.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Mainnet Explorer',
      url: 'https://chainscan.0g.ai',
    },
  },
  testnet: false,
});

export default {
  ogGalileo,
};