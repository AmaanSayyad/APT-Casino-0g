/**
 * Custom Chain Definitions
 * Defines custom chains not included in wagmi/chains
 */

import { defineChain } from 'viem';

// 0G Galileo Testnet Chain Definition
export const ogGalileo = defineChain({
  id: 16602,
  name: '0G-Galileo-Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OG',
    symbol: 'OG',
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc-testnet.0g.ai'],
    },
    public: {
      http: ['https://evmrpc-testnet.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Galileo Explorer',
      url: 'https://chainscan-galileo.0g.ai',
    },
  },
  testnet: true,
});

export default {
  ogGalileo,
};