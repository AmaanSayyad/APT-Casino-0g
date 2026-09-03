import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getTreasuryPrivateKey } from '@/config/treasury.js';
import { getOgChainConfig } from '@/config/ogNetwork.js';

export async function POST(request) {
  try {
    // Validate server-side config
    if (!getTreasuryPrivateKey() || getTreasuryPrivateKey().length < 10) {
      return NextResponse.json({ success: false, error: 'Treasury private key missing on server' }, { status: 503 });
    }
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
    const chain = getOgChainConfig();
    const ogRpcUrl = chain.rpcUrl;
    const ogExplorerUrl = chain.explorerUrl;
    
    // Create provider and wallet for 0G Network
    console.log('🔧 0G LOGGER API: Connecting to 0G Network...');
    console.log('🔧 RPC URL:', ogRpcUrl);
    
    const provider = new ethers.JsonRpcProvider(ogRpcUrl);
    const treasuryWallet = new ethers.Wallet(getTreasuryPrivateKey(), provider);
    
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
        network: getOgChainConfig().network
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
          network: getOgChainConfig().network
        });
      }
    } catch (balanceError) {
      console.error('❌ 0G LOGGER API: Failed to check balance:', balanceError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check treasury balance on 0G Network',
        transactionHash: null,
        explorerUrl: null,
        network: getOgChainConfig().network
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

    // Build and send transaction with robust gas/nonce handling
    let tx;
    try {
      const fromAddress = treasuryWallet.address;
      // Estimate gas for data transaction
      let gasLimit;
      try {
        gasLimit = await provider.estimateGas({ from: fromAddress, to: fromAddress, data: dataHex });
      } catch (_) {
        gasLimit = 100000n; // fallback
      }

      // Get fee data and nonce
      const feeData = await provider.getFeeData();
      const nonce = await provider.getTransactionCount(fromAddress, 'latest');
      const network = await provider.getNetwork();

      const txRequestBase = {
        to: fromAddress,
        value: 0,
        data: dataHex,
        gasLimit,
        nonce,
        chainId: Number(network.chainId)
      };

      let txRequest;
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // EIP-1559 style
        txRequest = {
          ...txRequestBase,
          type: 2,
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        };
      } else {
        // Legacy gas price fallback
        const legacyGasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');
        txRequest = {
          ...txRequestBase,
          type: 0,
          gasPrice: legacyGasPrice
        };
      }

      tx = await treasuryWallet.sendTransaction(txRequest);
      console.log('📤 0G LOGGER API: Transaction sent successfully:', tx.hash);
    } catch (txError) {
      console.error('❌ 0G LOGGER API: Transaction failed:', txError);
      return NextResponse.json({
        success: false,
        error: `Transaction failed: ${txError.message}`,
        transactionHash: null,
        explorerUrl: null,
        network: getOgChainConfig().network
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
      network: getOgChainConfig().network,
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (error) {
    console.error('❌ 0G LOGGER API: Failed to log game result:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      transactionHash: null,
      explorerUrl: null,
      network: getOgChainConfig().network
    }, { status: 500 });
  }
}

// GET endpoint to check 0G Network status
export async function GET() {
  try {
    if (!getTreasuryPrivateKey() || getTreasuryPrivateKey().length < 10) {
      return NextResponse.json({ success: false, error: 'Treasury private key missing on server', status: 'error' }, { status: 503 });
    }
    const chain = getOgChainConfig();
    const ogRpcUrl = chain.rpcUrl;
    const provider = new ethers.JsonRpcProvider(ogRpcUrl);
    const treasuryWallet = new ethers.Wallet(getTreasuryPrivateKey(), provider);
    
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
        name: chain.name,
        chainId: Number(network.chainId),
        rpcUrl: ogRpcUrl,
        explorerUrl: chain.explorerUrl
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

// Ensure Node.js runtime and no caching for this route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;