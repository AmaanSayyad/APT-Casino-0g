/**
 * 0G Mainnet Configuration
 * Configuration for 0G Mainnet with OG token
 */

// 0G Mainnet Chain Configuration
export const OG_GALILEO_CONFIG = {
  chainId: 16661,
  name: '0G Mainnet',
  network: '0g-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OG',
    symbol: 'OG',
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_0G_MAINNET_RPC || 'https://evmrpc.0g.ai',
        'https://evmrpc.0g.ai'
      ],
    },
    public: {
      http: [
        'https://evmrpc.0g.ai'
      ],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Mainnet Explorer',
      url: process.env.NEXT_PUBLIC_0G_MAINNET_EXPLORER || 'https://chainscan.0g.ai',
    },
  },
  testnet: false,
};

// 0G Mainnet Tokens
export const OG_GALILEO_TOKENS = {
  OG: {
    symbol: 'OG',
    name: 'OG Token',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    isNative: true,
    icon: '🔮',
    website: 'https://0g.ai'
  }
};

// Casino configuration for 0G Mainnet
export const OG_GALILEO_CASINO_CONFIG = {
  // Deposit/Withdraw settings
  minDeposit: '0.001', // 0.001 OG
  maxDeposit: '100',   // 100 OG
  minWithdraw: '0.001', // 0.001 OG
  maxWithdraw: '100',   // 100 OG
  
  // Game settings (same as Arbitrum for consistency)
  games: {
    MINES: {
      minBet: '0.001',
      maxBet: '1.0',
      minMines: 1,
      maxMines: 24,
      defaultMines: 3,
      gridSize: 25
    },
    ROULETTE: {
      minBet: '0.001',
      maxBet: '1.0',
      houseEdge: 0.027
    },
    PLINKO: {
      minBet: '0.001',
      maxBet: '1.0',
      rows: [8, 12, 16],
      defaultRows: 12
    },
    WHEEL: {
      minBet: '0.001',
      maxBet: '1.0',
      segments: [2, 10, 20, 40, 50]
    }
  }
};

// Network switching helper for 0G Mainnet
export const switchToOGGalileo = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    // Try to switch to 0G Mainnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x4115' }], // 16661 in hex
    });
  } catch (switchError) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x4115',
          chainName: '0G Mainnet',
          nativeCurrency: {
            name: 'OG',
            symbol: 'OG',
            decimals: 18,
          },
          rpcUrls: ['https://evmrpc.0g.ai'],
          blockExplorerUrls: ['https://chainscan.0g.ai'],
        }],
      });
    } else {
      throw switchError;
    }
  }
};

export default OG_GALILEO_CONFIG;