require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

const DEPLOYER_KEY = process.env.TREASURY_PRIVATE_KEY
  ? [process.env.TREASURY_PRIVATE_KEY.replace(/^0x/, '')]
  : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    '0g-galileo': {
      url: process.env.NEXT_PUBLIC_0G_GALILEO_RPC || 'https://evmrpc-testnet.0g.ai',
      accounts: DEPLOYER_KEY,
      chainId: 16602,
      gasPrice: 3000000000,
      gas: 8000000,
      type: 0,
    },
    '0g-mainnet': {
      url: process.env.NEXT_PUBLIC_0G_MAINNET_RPC_URL || 'https://evmrpc.0g.ai',
      accounts: DEPLOYER_KEY,
      chainId: 16661,
      gasPrice: 4000000000,
      gas: 8000000,
      type: 0,
    },
  },
  etherscan: {
    apiKey: {
      '0g-galileo': 'no-api-key-needed',
      '0g-mainnet': 'no-api-key-needed',
    },
    customChains: [
      {
        network: '0g-galileo',
        chainId: 16602,
        urls: {
          apiURL: 'https://chainscan-galileo.0g.ai/api',
          browserURL: 'https://chainscan-galileo.0g.ai',
        },
      },
      {
        network: '0g-mainnet',
        chainId: 16661,
        urls: {
          apiURL: 'https://chainscan.0g.ai/api',
          browserURL: 'https://chainscan.0g.ai',
        },
      },
    ],
  },
};
