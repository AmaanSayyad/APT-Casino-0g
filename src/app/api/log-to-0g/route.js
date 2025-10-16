import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { TREASURY_CONFIG } from '@/config/treasury.js';

export async function POST(request) {
  try {
    const gameData = await request.json();
    
    console.log('📝 0G LOGGER API: Received game data:', {
      gameId: gameData.gameId,
      gameType: gameData.gameType,
      userAddress: gameData.userAddress
    });

    // Validate input
    if (!gameData.gameId || !gameData.gameType || !gameData.userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, gameType, userAddress' },
        { status: 400 }
      );
    }

    // 0G Network configuration
    const ogRpcUrl = process.env.NEXT_PUBLIC_0G_GALILEO_RPC || 'https://evmrpc-testnet.0g.ai';
    const ogExplorerUrl = process.env.NEXT_PUBLIC_0G_GALILEO_EXPLORER || 'https://chainscan-galileo.0g.ai';
    
    // Create provider and wallet for 0G Network
    console.log('🔧 0G LOGGER API: Connecting to 0G Network...');
    console.log('🔧 RPC URL:', ogRpcUrl);
    
    const provider = new ethers.JsonRpcProvider(ogRpcUrl);
    const treasuryWallet = new ethers.Wallet(TREASURY_CONFIG.PRIVATE_KEY, provider);
    
    console.log('🏦 0G LOGGER API: Treasury wallet:', treasuryWallet.address);
    
    // Test network connection
    try {
      const network = await provider.getNetwork();
      console.log('🌐 0G LOGGER API: Connected to network:', {
        name: network.name,
        chainId: Number(network.chainId)
      });
    } catch (networkError) {
      console.error('❌ 0G LOGGER API: Network connection failed:', networkError);
      return NextResponse.json({
        success: false,
        error: `Failed to connect to 0G Network: ${networkError.message}`,
        transactionHash: null,
        explorerUrl: null,
        network: '0g-galileo-testnet'
      });
    }

    // Check treasury balance
    let balance;
    try {
      balance = await provider.getBalance(treasuryWallet.address);
      console.log(`💰 0G LOGGER API: Treasury balance: ${ethers.formatEther(balance)} OG`);
      
      if (balance === 0n) {
        console.warn('⚠️ 0G LOGGER API: Treasury has no balance on 0G Network');
        return NextResponse.json({
          success: false,
          error: 'Treasury wallet has no balance on 0G Network',
          transactionHash: null,
          explorerUrl: null,
          network: '0g-galileo-testnet'
        });
      }
    } catch (balanceError) {
      console.error('❌ 0G LOGGER API: Failed to check balance:', balanceError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check treasury balance on 0G Network',
        transactionHash: null,
        explorerUrl: null,
        network: '0g-galileo-testnet'
      });
    }

    // Create log data
    const logData = {
      gameId: gameData.gameId,
      gameType: gameData.gameType,
      userAddress: gameData.userAddress,
      betAmount: gameData.betAmount || '0',
      payoutAmount: gameData.payoutAmount || '0',
      isWin: gameData.isWin || false,
      gameConfig: gameData.gameConfig || {},
      resultData: gameData.resultData || {},
      entropyProof: gameData.entropyProof || {},
      timestamp: Date.now(),
      source: 'APT Casino 0G Logger'
    };

    // Convert data to hex string for transaction data
    const dataString = JSON.stringify(logData);
    const dataHex = ethers.hexlify(ethers.toUtf8Bytes(dataString));

    console.log('📤 0G LOGGER API: Preparing transaction...');
    console.log('📋 Transaction params:', {
      to: treasuryWallet.address,
      value: 0,
      dataLength: dataHex.length,
      gasLimit: 100000
    });

    // Send transaction with game data
    let tx;
    try {
      tx = await treasuryWallet.sendTransaction({
        to: treasuryWallet.address, // Send to self to log data
        value: 0, // No value transfer, just data logging
        data: dataHex,
        gasLimit: 100000 // Sufficient gas for data transaction
      });
      
      console.log('📤 0G LOGGER API: Transaction sent successfully:', tx.hash);
    } catch (txError) {
      console.error('❌ 0G LOGGER API: Transaction failed:', txError);
      return NextResponse.json({
        success: false,
        error: `Transaction failed: ${txError.message}`,
        transactionHash: null,
        explorerUrl: null,
        network: '0g-galileo-testnet'
      });
    }

    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log('✅ 0G LOGGER API: Game result logged successfully');
    console.log(`🔗 Transaction: ${tx.hash}`);
    console.log(`📦 Block: ${receipt.blockNumber}`);

    return NextResponse.json({
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${ogExplorerUrl}/tx/${tx.hash}`,
      logData: logData,
      network: '0g-galileo-testnet',
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (error) {
    console.error('❌ 0G LOGGER API: Failed to log game result:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      transactionHash: null,
      explorerUrl: null,
      network: '0g-galileo-testnet'
    }, { status: 500 });
  }
}

// GET endpoint to check 0G Network status
export async function GET() {
  try {
    const ogRpcUrl = process.env.NEXT_PUBLIC_0G_GALILEO_RPC || 'https://evmrpc-testnet.0g.ai';
    const provider = new ethers.JsonRpcProvider(ogRpcUrl);
    const treasuryWallet = new ethers.Wallet(TREASURY_CONFIG.PRIVATE_KEY, provider);
    
    // Check balance
    const balance = await provider.getBalance(treasuryWallet.address);
    const balanceInOg = ethers.formatEther(balance);
    
    // Get network info
    const network = await provider.getNetwork();
    
    return NextResponse.json({
      success: true,
      treasury: {
        address: treasuryWallet.address,
        balance: balanceInOg,
        balanceWei: balance.toString()
      },
      network: {
        name: '0G Galileo Testnet',
        chainId: Number(network.chainId),
        rpcUrl: ogRpcUrl
      },
      status: 'ready'
    });
    
  } catch (error) {
    console.error('❌ 0G LOGGER API: Status check failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      status: 'error'
    }, { status: 500 });
  }
}