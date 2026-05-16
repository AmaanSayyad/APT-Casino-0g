/**
 * Custom Chain Definitions
 * Both 0G networks so users can connect from either Mainnet or Galileo Testnet.
 */

import { defineChain } from 'viem';

// 0G Mainnet (chain ID 16661 / 0x4115)
export const ogMainnet = defineChain({
  id: 16661,
  name: '0G Mainnet',
  nativeCurrency: { decimals: 18, name: 'OG', symbol: 'OG' },
  rpcUrls: {
    default: { http: ['https://evmrpc.0g.ai'] },
    public:  { http: ['https://evmrpc.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Explorer', url: 'https://chainscan.0g.ai' },
  },
  testnet: false,
});

// 0G Galileo Testnet (chain ID 16602 / 0x40da)
export const ogGalileoTestnet = defineChain({
  id: 16602,
  name: '0G-Galileo-Testnet',
  nativeCurrency: { decimals: 18, name: 'OG', symbol: '0G' },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
    public:  { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Galileo Explorer', url: 'https://chainscan-galileo.0g.ai' },
  },
  testnet: true,
});

// Legacy alias kept so existing imports of `ogGalileo` don't break
export const ogGalileo = ogMainnet;

export const OG_SUPPORTED_CHAIN_IDS = [ogMainnet.id, ogGalileoTestnet.id]; // [16661, 16602]

export default { ogMainnet, ogGalileoTestnet, ogGalileo };
