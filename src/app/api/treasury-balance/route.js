import { NextResponse } from 'next/server';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { TREASURY_CONFIG, getTreasuryPrivateKey } from '@/config/treasury.js';
import PYTH_ENTROPY_CONFIG from '@/config/pythEntropy.js';

export async function GET() {
  try {
    // Check balance on 0G Network (for deposit/withdraw)
    const ogRpcUrl = TREASURY_CONFIG.NETWORK.RPC_URL;
    const ogProvider = new JsonRpcProvider(ogRpcUrl);
    
    // Also check Arbitrum Sepolia (for entropy operations)
    const network = process.env.NEXT_PUBLIC_NETWORK || 'arbitrum-sepolia';
    const networkConfig = PYTH_ENTROPY_CONFIG.getNetworkConfig(network);
    const arbProvider = new JsonRpcProvider(networkConfig.rpcUrl);
    
    // Create treasury wallets for both networks
    const ogTreasuryWallet = new Wallet(getTreasuryPrivateKey(), ogProvider);
    const arbTreasuryWallet = new Wallet(getTreasuryPrivateKey(), arbProvider);
    
    // Get treasury balances
    const ogBalance = await ogProvider.getBalance(ogTreasuryWallet.address);
    const arbBalance = await arbProvider.getBalance(arbTreasuryWallet.address);
    
    const ogBalanceInOg = ethers.formatEther(ogBalance);
    const arbBalanceInEth = ethers.formatEther(arbBalance);
    
    // Get entropy contract address
    const entropyContractAddress = PYTH_ENTROPY_CONFIG.getEntropyContract(network);
    
    return NextResponse.json({
      success: true,
      treasury: {
        address: ogTreasuryWallet.address,
        ogNetwork: {
          balance: ogBalanceInOg,
          balanceWei: ogBalance.toString(),
          network: TREASURY_CONFIG.NETWORK.CHAIN_NAME,
          chainId: TREASURY_CONFIG.NETWORK.CHAIN_ID,
          rpcUrl: ogRpcUrl
        },
        arbitrumSepolia: {
          balance: arbBalanceInEth,
          balanceWei: arbBalance.toString(),
          network: networkConfig.name,
          chainId: networkConfig.chainId,
          rpcUrl: networkConfig.rpcUrl
        }
      },
      entropy: {
        contractAddress: entropyContractAddress,
        requiredFee: "0.001" // ETH on Arbitrum Sepolia
      }
    });
    
  } catch (error) {
    console.error('❌ Treasury balance check failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check treasury balance',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
