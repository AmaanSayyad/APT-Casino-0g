/**
 * 0G Network Contract Logger Service
 * Logs game results to 0G Network using GameLogger smart contract
 */

import { ethers } from 'ethers';
import { TREASURY_CONFIG } from '../config/treasury.js';

// GameLogger contract ABI (only the functions we need)
const GAME_LOGGER_ABI = [
  "function logGame(string gameId, string gameType, address userAddress, uint256 betAmount, uint256 payoutAmount, bool isWin, string gameConfig, string resultData, string entropyProof) external",
  "function getGameLog(string gameId) external view returns (tuple(string gameId, string gameType, address userAddress, uint256 betAmount, uint256 payoutAmount, bool isWin, string gameConfig, string resultData, string entropyProof, uint256 timestamp, uint256 blockNumber))",
  "function getLoggerStats() external view returns (uint256 totalLogs, uint256 totalGasUsed, address lastLogger, uint256 averageGasPerLog)",
  "function getUserLogCount(address user) external view returns (uint256)",
  "function getGameTypeLogCount(string gameType) external view returns (uint256)",
  "event GameLogged(string indexed gameId, string indexed gameType, address indexed userAddress, uint256 betAmount, uint256 payoutAmount, bool isWin, uint256 timestamp)"
];

class OGContractLogger {
  constructor() {
    this.provider = null;
    this.treasuryWallet = null;
    this.contract = null;
    this.isInitialized = false;
    
    // 0G Network configuration - MAINNET
    this.networkConfig = {
      chainId: 16661,
      name: '0G-Mainnet',
      rpcUrl: process.env.NEXT_PUBLIC_0G_MAINNET_RPC || 'https://evmrpc.0g.ai',
      explorerUrl: process.env.NEXT_PUBLIC_0G_MAINNET_EXPLORER || 'https://chainscan.0g.ai'
    };
    
    // Contract address (mainnet will be set after deployment)
    this.contractAddress = process.env.NEXT_PUBLIC_GAME_LOGGER_CONTRACT_MAINNET || null;
  }

  /**
   * Initialize the 0G Contract logger
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('🔮 0G CONTRACT LOGGER: Initializing...');
      
      if (!this.contractAddress) {
        throw new Error('GameLogger contract address not configured');
      }
      
      // Create provider for 0G Network
      this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
      
      // Create treasury wallet
      if (TREASURY_CONFIG.PRIVATE_KEY) {
        this.treasuryWallet = new ethers.Wallet(TREASURY_CONFIG.PRIVATE_KEY, this.provider);
        console.log('🏦 0G CONTRACT LOGGER: Treasury wallet initialized');
        console.log(`📍 Treasury address: ${this.treasuryWallet.address}`);
      } else {
        throw new Error('Treasury private key not found');
      }

      // Create contract instance
      this.contract = new ethers.Contract(
        this.contractAddress,
        GAME_LOGGER_ABI,
        this.treasuryWallet
      );
      
      console.log('📋 0G CONTRACT LOGGER: Contract initialized at', this.contractAddress);

      this.isInitialized = true;
      console.log('✅ 0G CONTRACT LOGGER: Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ 0G CONTRACT LOGGER: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Log game result to 0G Network using smart contract
   * @param {Object} gameResult - Game result data
   * @returns {Promise<Object>} Transaction result
   */
  async logGameResult(gameResult) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📝 0G CONTRACT LOGGER: Logging game result...', {
        gameType: gameResult.gameType,
        userAddress: gameResult.userAddress,
        gameId: gameResult.gameId,
        betAmount: gameResult.betAmount,
        payoutAmount: gameResult.payoutAmount
      });

      // Prepare contract parameters
      const gameId = gameResult.gameId || `game_${Date.now()}`;
      const gameType = gameResult.gameType || 'UNKNOWN';
      const userAddress = gameResult.userAddress || ethers.ZeroAddress;
      
      // Convert bet amounts to wei (they come as strings representing ether amounts)
      let betAmount, payoutAmount;
      try {
        const betEther = parseFloat(gameResult.betAmount) || 0;
        const payoutEther = parseFloat(gameResult.payoutAmount) || 0;
        
        // If amounts are very small, treat them as already in wei
        if (betEther < 1e-15) {
          betAmount = BigInt(Math.floor(betEther * 1e18));
        } else {
          betAmount = ethers.parseEther(betEther.toString());
        }
        
        if (payoutEther < 1e-15) {
          payoutAmount = BigInt(Math.floor(payoutEther * 1e18));
        } else {
          payoutAmount = ethers.parseEther(payoutEther.toString());
        }
      } catch (error) {
        console.warn('⚠️ Amount parsing failed, using 0:', error);
        betAmount = BigInt(0);
        payoutAmount = BigInt(0);
      }
      const isWin = gameResult.isWin || false;
      const gameConfig = JSON.stringify(gameResult.gameConfig || {});
      const resultData = JSON.stringify(gameResult.resultData || {});
      const entropyProof = JSON.stringify(gameResult.entropyProof || {});

      console.log('📤 0G CONTRACT LOGGER: Calling contract with params:', {
        gameId,
        gameType,
        userAddress,
        betAmount: betAmount.toString(),
        payoutAmount: payoutAmount.toString(),
        isWin
      });

      // Call contract function
      const tx = await this.contract.logGame(
        gameId,
        gameType,
        userAddress,
        betAmount,
        payoutAmount,
        isWin,
        gameConfig,
        resultData,
        entropyProof
      );

      console.log('📤 0G CONTRACT LOGGER: Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      console.log('✅ 0G CONTRACT LOGGER: Game result logged successfully');
      console.log(`🔗 Transaction: ${tx.hash}`);
      console.log(`📦 Block: ${receipt.blockNumber}`);
      console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);

      // Parse events
      const gameLoggedEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'GameLogged';
        } catch {
          return false;
        }
      });

      let eventData = null;
      if (gameLoggedEvent) {
        const parsed = this.contract.interface.parseLog(gameLoggedEvent);
        eventData = {
          gameId: parsed.args.gameId,
          gameType: parsed.args.gameType,
          userAddress: parsed.args.userAddress,
          betAmount: parsed.args.betAmount.toString(),
          payoutAmount: parsed.args.payoutAmount.toString(),
          isWin: parsed.args.isWin,
          timestamp: parsed.args.timestamp.toString()
        };
        console.log('📊 0G CONTRACT LOGGER: Event data:', eventData);
      }

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl: `${this.networkConfig.explorerUrl}/tx/${tx.hash}`,
        contractAddress: this.contractAddress,
        eventData: eventData,
        network: '0g-mainnet'
      };

    } catch (error) {
      console.error('❌ 0G CONTRACT LOGGER: Failed to log game result:', error);
      
      // Return fallback result
      return {
        success: false,
        error: error.message,
        transactionHash: null,
        blockNumber: null,
        explorerUrl: null,
        contractAddress: this.contractAddress,
        network: '0g-mainnet'
      };
    }
  }

  /**
   * Get game log from contract
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Game log data
   */
  async getGameLog(gameId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const gameLog = await this.contract.getGameLog(gameId);
      
      return {
        gameId: gameLog.gameId,
        gameType: gameLog.gameType,
        userAddress: gameLog.userAddress,
        betAmount: gameLog.betAmount.toString(),
        payoutAmount: gameLog.payoutAmount.toString(),
        isWin: gameLog.isWin,
        gameConfig: JSON.parse(gameLog.gameConfig),
        resultData: JSON.parse(gameLog.resultData),
        entropyProof: JSON.parse(gameLog.entropyProof),
        timestamp: gameLog.timestamp.toString(),
        blockNumber: gameLog.blockNumber.toString()
      };

    } catch (error) {
      console.error('❌ 0G CONTRACT LOGGER: Failed to get game log:', error);
      throw error;
    }
  }

  /**
   * Get logger statistics from contract
   * @returns {Promise<Object>} Logger statistics
   */
  async getLoggerStats() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const [totalLogs, totalGasUsed, lastLogger, averageGasPerLog] = await this.contract.getLoggerStats();
      
      return {
        totalLogs: totalLogs.toString(),
        totalGasUsed: totalGasUsed.toString(),
        lastLogger: lastLogger,
        averageGasPerLog: averageGasPerLog.toString(),
        contractAddress: this.contractAddress
      };

    } catch (error) {
      console.error('❌ 0G CONTRACT LOGGER: Failed to get logger stats:', error);
      throw error;
    }
  }

  /**
   * Get user's log count
   * @param {string} userAddress - User address
   * @returns {Promise<string>} User log count
   */
  async getUserLogCount(userAddress) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const count = await this.contract.getUserLogCount(userAddress);
      return count.toString();

    } catch (error) {
      console.error('❌ 0G CONTRACT LOGGER: Failed to get user log count:', error);
      throw error;
    }
  }

  /**
   * Get game type log count
   * @param {string} gameType - Game type
   * @returns {Promise<string>} Game type log count
   */
  async getGameTypeLogCount(gameType) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const count = await this.contract.getGameTypeLogCount(gameType);
      return count.toString();

    } catch (error) {
      console.error('❌ 0G CONTRACT LOGGER: Failed to get game type log count:', error);
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

  /**
   * Get contract explorer URL
   * @returns {string} Contract explorer URL
   */
  getContractExplorerUrl() {
    return `${this.networkConfig.explorerUrl}/address/${this.contractAddress}`;
  }
}

// Create singleton instance
const ogContractLogger = new OGContractLogger();

export default ogContractLogger;