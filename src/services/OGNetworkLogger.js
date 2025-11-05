/**
 * 0G Network Logger Service
 * Logs game results to 0G Network using treasury wallet
 */

import { ethers } from 'ethers';
import { TREASURY_CONFIG } from '../config/treasury.js';

class OGNetworkLogger {
  constructor() {
    this.provider = null;
    this.treasuryWallet = null;
    this.isInitialized = false;
    
    // 0G Network configuration - MAINNET
    this.networkConfig = {
      chainId: 16661,
      name: '0G-Mainnet',
      rpcUrl: process.env.NEXT_PUBLIC_0G_MAINNET_RPC || 'https://evmrpc.0g.ai',
      explorerUrl: process.env.NEXT_PUBLIC_0G_MAINNET_EXPLORER || 'https://chainscan.0g.ai'
    };
  }

  /**
   * Initialize the 0G Network logger
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('🔮 0G LOGGER: Initializing...');
      
      // Create provider for 0G Network
      this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
      
      // Create treasury wallet
      if (TREASURY_CONFIG.PRIVATE_KEY) {
        this.treasuryWallet = new ethers.Wallet(TREASURY_CONFIG.PRIVATE_KEY, this.provider);
        console.log('🏦 0G LOGGER: Treasury wallet initialized');
        console.log(`📍 Treasury address: ${this.treasuryWallet.address}`);
      } else {
        throw new Error('Treasury private key not found');
      }

      this.isInitialized = true;
      console.log('✅ 0G LOGGER: Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ 0G LOGGER: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Log game result to 0G Network
   * @param {Object} gameResult - Game result data
   * @returns {Promise<Object>} Transaction result
   */
  async logGameResult(gameResult) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📝 0G LOGGER: Logging game result...', {
        gameType: gameResult.gameType,
        userAddress: gameResult.userAddress,
        gameId: gameResult.gameId
      });

      // Create game result data to log
      const logData = {
        gameId: gameResult.gameId || `game_${Date.now()}`,
        gameType: gameResult.gameType,
        userAddress: gameResult.userAddress,
        betAmount: gameResult.betAmount || '0',
        payoutAmount: gameResult.payoutAmount || '0',
        isWin: gameResult.isWin || false,
        gameConfig: gameResult.gameConfig || {},
        resultData: gameResult.resultData || {},
        entropyProof: gameResult.entropyProof || {},
        timestamp: Date.now(),
        blockNumber: null // Will be filled after transaction
      };

      // Convert data to hex string for transaction data
      const dataString = JSON.stringify(logData);
      const dataHex = ethers.hexlify(ethers.toUtf8Bytes(dataString));

      // Build and send transaction with robust gas/nonce handling
      const fromAddress = this.treasuryWallet.address;
      // Estimate gas for data transaction
      let gasLimit;
      try {
        gasLimit = await this.provider.estimateGas({ from: fromAddress, to: fromAddress, data: dataHex });
      } catch (_) {
        gasLimit = 100000n; // fallback
      }

      // Get fee data and nonce
      const feeData = await this.provider.getFeeData();
      const nonce = await this.provider.getTransactionCount(fromAddress, 'latest');
      const network = await this.provider.getNetwork();

      const txRequestBase = {
        to: fromAddress,
        value: 0,
        data: dataHex,
        gasLimit,
        nonce,
        chainId: Number(network.chainId)
      };

      let tx;
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // EIP-1559 style
        tx = await this.treasuryWallet.sendTransaction({
          ...txRequestBase,
          type: 2,
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        });
      } else {
        // Legacy gas price fallback
        const legacyGasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');
        tx = await this.treasuryWallet.sendTransaction({
          ...txRequestBase,
          type: 0,
          gasPrice: legacyGasPrice
        });
      }

      console.log('📤 0G LOGGER: Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      console.log('✅ 0G LOGGER: Game result logged successfully');
      console.log(`🔗 Transaction: ${tx.hash}`);
      console.log(`📦 Block: ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `${this.networkConfig.explorerUrl}/tx/${tx.hash}`,
        logData: logData,
        network: '0g-mainnet'
      };

    } catch (error) {
      console.error('❌ 0G LOGGER: Failed to log game result:', error);
      
      // Return fallback result
      return {
        success: false,
        error: error.message,
        transactionHash: null,
        blockNumber: null,
        explorerUrl: null,
        logData: null,
        network: '0g-mainnet'
      };
    }
  }

  /**
   * Log multiple game results in batch
   * @param {Array} gameResults - Array of game results
   * @returns {Promise<Array>} Array of transaction results
   */
  async logGameResultsBatch(gameResults) {
    console.log(`📝 0G LOGGER: Logging batch of ${gameResults.length} game results...`);
    
    const results = [];
    
    for (let i = 0; i < gameResults.length; i++) {
      const gameResult = gameResults[i];
      console.log(`📝 0G LOGGER: Logging game ${i + 1}/${gameResults.length}...`);
      
      try {
        const result = await this.logGameResult(gameResult);
        results.push(result);
        
        // Small delay between transactions to avoid nonce issues
        if (i < gameResults.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ 0G LOGGER: Error logging game ${i + 1}:`, error);
        results.push({
          success: false,
          error: error.message,
          gameResult: gameResult
        });
      }
    }
    
    console.log(`✅ 0G LOGGER: Batch logging completed - ${results.length} results`);
    return results;
  }

  /**
   * Get transaction details from 0G Network
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionDetails(txHash) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!tx || !receipt) {
        throw new Error('Transaction not found');
      }

      // Decode data if it exists
      let decodedData = null;
      if (tx.data && tx.data !== '0x') {
        try {
          const dataString = ethers.toUtf8String(tx.data);
          decodedData = JSON.parse(dataString);
        } catch (error) {
          console.warn('Could not decode transaction data:', error);
        }
      }

      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        timestamp: null, // Would need to fetch block for timestamp
        decodedData: decodedData,
        explorerUrl: `${this.networkConfig.explorerUrl}/tx/${txHash}`
      };

    } catch (error) {
      console.error('❌ 0G LOGGER: Failed to get transaction details:', error);
      throw error;
    }
  }

  /**
   * Get network configuration
   * @returns {Object} Network configuration
   */
  getNetworkConfig() {
    return this.networkConfig;
  }

  /**
   * Get explorer URL for transaction
   * @param {string} txHash - Transaction hash
   * @returns {string} Explorer URL
   */
  getExplorerUrl(txHash) {
    return `${this.networkConfig.explorerUrl}/tx/${txHash}`;
  }
}

// Create singleton instance
const ogNetworkLogger = new OGNetworkLogger();

export default ogNetworkLogger;