/**
 * 0G Data Availability (DA) Service
 * Service for submitting and retrieving data blobs from 0G DA network
 * 
 * Note: This service requires a 0G DA Client node running (gRPC on port 51001)
 * For production, set up DA Client node as per documentation
 */

import { 
  getCurrentDANetworkConfig,
  OG_DA_BLOB_CONFIG,
  OG_DA_GAME_HISTORY_CONFIG,
  validateBlobSize 
} from '../config/ogDA.js';
import { TREASURY_CONFIG } from '../config/treasury.js';
import { ethers } from 'ethers';
import ogDAClient from './OGDAClient.js';

class OGDAService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.isInitialized = false;
    this.daClientUrl = null;
  }

  /**
   * Initialize the 0G DA service
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      const networkConfig = getCurrentDANetworkConfig();
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      
      // Initialize wallet (for contract interactions)
      if (TREASURY_CONFIG.PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(TREASURY_CONFIG.PRIVATE_KEY, this.provider);
      }
      
      // DA Client URL (gRPC endpoint)
      this.daClientUrl = networkConfig.daClientUrl;
      
      this.isInitialized = true;
      console.log('✅ 0G DA Service initialized');
      console.log(`📍 DA Client URL: ${this.daClientUrl}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize 0G DA Service:', error);
      throw error;
    }
  }

  /**
   * Submit data blob to 0G DA
   * @param {string|Buffer|Object} data - Data to submit (will be JSON stringified if object)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Submission result with blob hash
   */
  async submitBlob(data, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Prepare data
      let blobData;
      if (typeof data === 'string') {
        blobData = data;
      } else if (Buffer.isBuffer(data)) {
        blobData = data.toString('utf-8');
      } else {
        blobData = JSON.stringify(data);
      }

      // Validate blob size
      const blobSize = validateBlobSize(blobData);
      console.log(`📦 Submitting blob of size: ${blobSize} bytes`);

      // For now, we'll use a simple HTTP API approach
      // In production, you'd use gRPC client to DA Client node
      // This is a placeholder that will be enhanced with actual DA Client integration
      
      const response = await this.submitBlobViaAPI(blobData, options);
      
      return {
        success: true,
        blobHash: response.blobHash,
        dataRoot: response.dataRoot,
        erasureCommitment: response.erasureCommitment,
        epoch: response.epoch,
        quorumId: response.quorumId,
        transactionHash: response.transactionHash,
        blockNumber: response.blockNumber,
        blobSize,
      };
    } catch (error) {
      console.error('❌ Failed to submit blob to 0G DA:', error);
      throw error;
    }
  }

  /**
   * Submit blob via API route (server-side DA Client)
   * @param {string} blobData - Data as string
   * @param {Object} options - Options
   * @returns {Promise<Object>} Submission result
   */
  async submitBlobViaAPI(blobData, options = {}) {
    const response = await fetch('/api/og-da/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: blobData,
        options: options,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to submit blob');
    }

    return result;
  }

  /**
   * Retrieve blob from 0G DA
   * @param {string} blobHash - Blob hash or data root
   * @returns {Promise<Object>} Retrieved blob data
   */
  async retrieveBlob(blobHash) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(`/api/og-da/retrieve?hash=${blobHash}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to retrieve blob');
      }

      return {
        success: true,
        data: result.data,
        blobHash: result.blobHash,
        verified: result.verified,
      };
    } catch (error) {
      console.error('❌ Failed to retrieve blob from 0G DA:', error);
      throw error;
    }
  }

  /**
   * Submit game history batch to 0G DA
   * Optimized batch processing with automatic chunking
   * @param {Array} gameResults - Array of game results
   * @param {Object} options - Batch options
   * @returns {Promise<Object>} Submission result
   */
  async submitGameHistoryBatch(gameResults, options = {}) {
    if (!Array.isArray(gameResults) || gameResults.length === 0) {
      throw new Error('Game results array is required');
    }

    const {
      batchSize = OG_DA_GAME_HISTORY_CONFIG.BATCH_SIZE,
      compress = true,
      parallel = false,
    } = options;

    // If batch is small enough, submit directly
    const batchDataString = JSON.stringify({
      type: 'game_history_batch',
      timestamp: Date.now(),
      games: gameResults,
      totalGames: gameResults.length,
      version: '1.0',
    });

    const batchSizeBytes = new TextEncoder().encode(batchDataString).length;
    
    // Check if we need to chunk
    if (batchSizeBytes <= OG_DA_BLOB_CONFIG.RECOMMENDED_BATCH_SIZE && gameResults.length <= batchSize) {
      return await this.submitBlob(batchDataString, {
        compress,
        metadata: {
          batchType: 'game_history',
          gameCount: gameResults.length,
        },
      });
    }

    // Chunk large batches
    console.log(`📦 0G DA: Chunking ${gameResults.length} games into batches...`);
    
    const chunks = [];
    for (let i = 0; i < gameResults.length; i += batchSize) {
      chunks.push(gameResults.slice(i, i + batchSize));
    }

    console.log(`📦 Created ${chunks.length} chunks`);

    const results = [];
    
    if (parallel) {
      // Submit chunks in parallel (with concurrency limit)
      const concurrency = 3;
      for (let i = 0; i < chunks.length; i += concurrency) {
        const batch = chunks.slice(i, i + concurrency);
        const batchPromises = batch.map((chunk, idx) => {
          const chunkData = {
            type: 'game_history_batch',
            timestamp: Date.now(),
            games: chunk,
            totalGames: chunk.length,
            chunkIndex: i + idx,
            totalChunks: chunks.length,
            version: '1.0',
          };
          return this.submitBlob(JSON.stringify(chunkData), {
            compress,
            metadata: {
              batchType: 'game_history',
              gameCount: chunk.length,
              chunkIndex: i + idx,
            },
          });
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
      }
    } else {
      // Submit chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkData = {
          type: 'game_history_batch',
          timestamp: Date.now(),
          games: chunk,
          totalGames: chunk.length,
          chunkIndex: i,
          totalChunks: chunks.length,
          version: '1.0',
        };
        
        try {
          const result = await this.submitBlob(JSON.stringify(chunkData), {
            compress,
            metadata: {
              batchType: 'game_history',
              gameCount: chunk.length,
              chunkIndex: i,
            },
          });
          results.push({ status: 'fulfilled', value: result });
        } catch (error) {
          results.push({ status: 'rejected', reason: error });
        }
      }
    }

    // Aggregate results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    const blobHashes = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value.blobHash);

    return {
      success: failed === 0,
      totalChunks: chunks.length,
      successfulChunks: successful,
      failedChunks: failed,
      blobHashes: blobHashes,
      totalGames: gameResults.length,
      results: results,
    };
  }

  /**
   * Submit single game result to 0G DA
   * @param {Object} gameResult - Single game result
   * @returns {Promise<Object>} Submission result
   */
  async submitGameResult(gameResult) {
    const gameData = {
      type: 'game_result',
      timestamp: Date.now(),
      game: gameResult,
      version: '1.0',
    };

    return await this.submitBlob(gameData, {
      compress: false,
      metadata: {
        gameType: gameResult.gameType,
        gameId: gameResult.gameId,
      },
    });
  }

  /**
   * Check if DA Client is available
   * @returns {Promise<boolean>} Availability status
   */
  async checkDAClientAvailability() {
    try {
      const response = await fetch('/api/og-da/status');
      const result = await response.json();
      return result.success && result.available === true;
    } catch (error) {
      console.error('❌ DA Client availability check failed:', error);
      return false;
    }
  }

  /**
   * Get blob price from DA contract
   * @returns {Promise<bigint>} Blob price in wei
   */
  async getBlobPrice() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // TODO: Query DA contract for current BLOB_PRICE
      // For now, return 0 (free on testnet)
      return 0n;
    } catch (error) {
      console.error('❌ Failed to get blob price:', error);
      return 0n;
    }
  }
}

// Export singleton instance
export default new OGDAService();

