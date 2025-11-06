#!/usr/bin/env node

/**
 * Test script to verify 0G Mainnet configuration
 */

require('dotenv').config();

console.log('🧪 Testing 0G Mainnet Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('NEXT_PUBLIC_0G_RPC_URL:', process.env.NEXT_PUBLIC_0G_RPC_URL);
console.log('NEXT_PUBLIC_0G_GALILEO_RPC:', process.env.NEXT_PUBLIC_0G_GALILEO_RPC);
console.log('NEXT_PUBLIC_0G_GALILEO_CHAIN_ID:', process.env.NEXT_PUBLIC_0G_GALILEO_CHAIN_ID);
console.log('NEXT_PUBLIC_DEFAULT_NETWORK:', process.env.NEXT_PUBLIC_DEFAULT_NETWORK);
console.log('NEXT_PUBLIC_SUPPORTED_NETWORKS:', process.env.NEXT_PUBLIC_SUPPORTED_NETWORKS);
console.log('NEXT_PUBLIC_CHAIN_ID:', process.env.NEXT_PUBLIC_CHAIN_ID);

// Check if all URLs point to mainnet
const mainnetUrls = [
  process.env.NEXT_PUBLIC_0G_RPC_URL,
  process.env.NEXT_PUBLIC_0G_GALILEO_RPC,
  process.env.NEXT_PUBLIC_0G_MAINNET_RPC
];

console.log('\n🔍 URL Analysis:');
mainnetUrls.forEach((url, index) => {
  if (url) {
    const isMainnet = url.includes('evmrpc.0g.ai') && !url.includes('testnet');
    console.log(`URL ${index + 1}: ${url} - ${isMainnet ? '✅ Mainnet' : '❌ Not Mainnet'}`);
  }
});

// Check chain IDs
console.log('\n🔗 Chain ID Analysis:');
const chainIds = [
  { name: 'NEXT_PUBLIC_CHAIN_ID', value: process.env.NEXT_PUBLIC_CHAIN_ID },
  { name: 'NEXT_PUBLIC_0G_GALILEO_CHAIN_ID', value: process.env.NEXT_PUBLIC_0G_GALILEO_CHAIN_ID }
];

chainIds.forEach(({ name, value }) => {
  if (value) {
    const decimalValue = parseInt(value, 16);
    const isMainnet = decimalValue === 16661;
    console.log(`${name}: ${value} (${decimalValue}) - ${isMainnet ? '✅ Mainnet' : '❌ Not Mainnet'}`);
  }
});

// Check network names
console.log('\n🌐 Network Configuration:');
const networks = [
  { name: 'DEFAULT_NETWORK', value: process.env.NEXT_PUBLIC_DEFAULT_NETWORK },
  { name: 'SUPPORTED_NETWORKS', value: process.env.NEXT_PUBLIC_SUPPORTED_NETWORKS }
];

networks.forEach(({ name, value }) => {
  if (value) {
    const isMainnet = value.includes('mainnet') || value === '0g-mainnet';
    console.log(`${name}: ${value} - ${isMainnet ? '✅ Mainnet' : '❌ Not Mainnet'}`);
  }
});

console.log('\n🎯 Summary:');
console.log('All configurations should point to 0G Mainnet (Chain ID: 16661, RPC: https://evmrpc.0g.ai)');
console.log('If you see any ❌ marks above, those configurations need to be updated.');