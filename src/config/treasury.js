import { getOgChainConfig } from './ogNetwork';

const chain = getOgChainConfig();

export const TREASURY_CONFIG = {
  ADDRESS:
    process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
    process.env.TREASURY_ADDRESS ||
    '',

  NETWORK: {
    CHAIN_ID: chain.chainIdHex,
    CHAIN_NAME: chain.name,
    RPC_URL: chain.rpcUrl,
    EXPLORER_URL: chain.explorerUrl,
    CHAIN_ID_DECIMAL: chain.chainId,
  },

  GAS: {
    DEPOSIT_LIMIT: process.env.GAS_LIMIT_DEPOSIT
      ? '0x' + parseInt(process.env.GAS_LIMIT_DEPOSIT, 10).toString(16)
      : '0x5208',
    WITHDRAW_LIMIT: process.env.GAS_LIMIT_WITHDRAW
      ? '0x' + parseInt(process.env.GAS_LIMIT_WITHDRAW, 10).toString(16)
      : '0x186A0',
  },

  LIMITS: {
    MIN_DEPOSIT: parseFloat(process.env.MIN_DEPOSIT) || 0.001,
    MAX_DEPOSIT: parseFloat(process.env.MAX_DEPOSIT) || 100,
  },
};

export const getTreasuryPrivateKey = () => {
  if (typeof window !== 'undefined') return '';
  return process.env.TREASURY_PRIVATE_KEY || '';
};

export const isValidTreasuryAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const getTreasuryInfo = () => {
  return {
    address: TREASURY_CONFIG.ADDRESS,
    network: TREASURY_CONFIG.NETWORK.CHAIN_NAME,
    chainId: TREASURY_CONFIG.NETWORK.CHAIN_ID,
  };
};
