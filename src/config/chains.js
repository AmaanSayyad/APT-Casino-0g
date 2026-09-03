/**
 * Custom Chain Definitions
 * Defines custom chains not included in wagmi/chains
 */

import { defineChain } from 'viem';
import { OG_MAINNET, OG_TESTNET } from './ogNetwork';

// 0G Galileo Testnet Chain Definition
export const ogGalileo = defineChain({
  id: OG_TESTNET.chainId,
  name: OG_TESTNET.name,
  nativeCurrency: OG_TESTNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [OG_TESTNET.rpcUrl],
    },
    public: {
      http: [OG_TESTNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Galileo Explorer',
      url: OG_TESTNET.explorerUrl,
    },
  },
  testnet: true,
});

// 0G Mainnet (Aristotle) — Wave 3 required chain
export const ogMainnet = defineChain({
  id: OG_MAINNET.chainId,
  name: OG_MAINNET.name,
  nativeCurrency: OG_MAINNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [OG_MAINNET.rpcUrl],
    },
    public: {
      http: [OG_MAINNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Chain Explorer',
      url: OG_MAINNET.explorerUrl,
    },
  },
  testnet: false,
});

export default {
  ogGalileo,
  ogMainnet,
};