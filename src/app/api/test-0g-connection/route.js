import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { requireTreasuryPrivateKey } from '@/lib/treasuryPrivate.js';

export async function GET() {
  try {
    console.log('🧪 Testing 0G Network connection...');
    
    const ogRpcUrl = process.env.NEXT_PUBLIC_0G_GALILEO_RPC || 'https://evmrpc.0g.ai';
    console.log('🔧 RPC URL:', ogRpcUrl);
    
    // Test 1: Create provider
    const provider = new ethers.JsonRpcProvider(ogRpcUrl);
    console.log('✅ Provider created');
    
    // Test 2: Get network info
    let networkInfo;
    try {
      networkInfo = await provider.getNetwork();
      console.log('✅ Network info:', {
        name: networkInfo.name,
        chainId: Number(networkInfo.chainId)
      });
    } catch (error) {
      console.error('❌ Network info failed:', error);
      return NextResponse.json({
        success: false,
        error: `Network connection failed: ${error.message}`,
        step: 'network_info'
      });
    }
    
    // Test 3: Create treasury wallet
    let treasuryWallet;
    try {
      treasuryWallet = new ethers.Wallet(requireTreasuryPrivateKey(), provider);
      console.log('✅ Treasury wallet created:', treasuryWallet.address);
    } catch (error) {
      console.error('❌ Wallet creation failed:', error);
      return NextResponse.json({
        success: false,
        error: `Wallet creation failed: ${error.message}`,
        step: 'wallet_creation'
      });
    }
    
    // Test 4: Get balance
    let balance;
    try {
      balance = await provider.getBalance(treasuryWallet.address);
      console.log('✅ Balance retrieved:', ethers.formatEther(balance), 'OG');
    } catch (error) {
      console.error('❌ Balance check failed:', error);
      return NextResponse.json({
        success: false,
        error: `Balance check failed: ${error.message}`,
        step: 'balance_check'
      });
    }
    
    // Test 5: Get gas price
    let gasPrice;
    try {
      gasPrice = await provider.getFeeData();
      console.log('✅ Gas price retrieved:', {
        gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') + ' gwei' : 'null',
        maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') + ' gwei' : 'null'
      });
    } catch (error) {
      console.error('❌ Gas price check failed:', error);
      return NextResponse.json({
        success: false,
        error: `Gas price check failed: ${error.message}`,
        step: 'gas_price_check'
      });
    }
    
    // Test 6: Estimate gas for a simple transaction
    let gasEstimate;
    try {
      gasEstimate = await provider.estimateGas({
        to: treasuryWallet.address,
        value: 0,
        data: '0x'
      });
      console.log('✅ Gas estimate:', gasEstimate.toString());
    } catch (error) {
      console.error('❌ Gas estimation failed:', error);
      return NextResponse.json({
        success: false,
        error: `Gas estimation failed: ${error.message}`,
        step: 'gas_estimation'
      });
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        provider: '✅ Created',
        network: `✅ Connected (Chain ID: ${Number(networkInfo.chainId)})`,
        wallet: `✅ Created (${treasuryWallet.address})`,
        balance: `✅ ${ethers.formatEther(balance)} OG`,
        gasPrice: gasPrice.gasPrice ? `✅ ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei` : '⚠️ No gas price',
        gasEstimate: `✅ ${gasEstimate.toString()} gas`
      },
      canSendTransaction: balance > 0n,
      recommendations: balance === 0n ? ['Treasury wallet needs OG tokens for gas fees'] : []
    });
    
  } catch (error) {
    console.error('❌ 0G Network test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      step: 'general_error'
    }, { status: 500 });
  }
}