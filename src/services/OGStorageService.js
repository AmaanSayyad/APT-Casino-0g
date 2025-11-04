/**
 * 0G Storage Service
 * Service layer for 0G Storage operations
 * Handles file upload, download, and key-value storage
 * 
 * Note: This service requires server-side API routes for operations
 * that need private keys (upload). Browser-side operations use API routes.
 */

import { 
  getCurrentStorageNetworkConfig,
  OG_STORAGE_SETTINGS,
  OG_STORAGE_PATHS,
  buildStoragePath,
  validateFileSize 
} from '../config/ogStorage.js';

class OGStorageService {
  constructor() {
    this.isInitialized = false;
    this.networkConfig = null;
  }

  /**
   * Initialize the storage service
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      this.networkConfig = getCurrentStorageNetworkConfig();
      this.isInitialized = true;
      console.log('✅ 0G Storage Service initialized');
      console.log(`📍 Indexer RPC: ${this.networkConfig.indexerRpc}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize 0G Storage Service:', error);
      throw error;
    }
  }

  /**
   * Upload file to 0G Storage
   * @param {File|Buffer|string} file - File to upload (File object, Buffer, or file path)
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result with root hash
   */
  async uploadFile(file, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      path = null,
      verifyProof = OG_STORAGE_SETTINGS.DEFAULT_VERIFY_PROOF,
      segmentNumber = OG_STORAGE_SETTINGS.DEFAULT_SEGMENT_NUMBER,
      replicas = OG_STORAGE_SETTINGS.DEFAULT_REPLICAS,
    } = options;

    // Validate file size if it's a File object
    if (file instanceof File) {
      validateFileSize(file.size);
    }

    try {
      // Use API route for upload (requires private key)
      const formData = new FormData();
      
      if (file instanceof File) {
        formData.append('file', file);
      } else if (Buffer.isBuffer(file)) {
        formData.append('file', new Blob([file]));
      } else if (typeof file === 'string') {
        // File path - handled server-side
        formData.append('filePath', file);
      } else {
        throw new Error('Invalid file type. Expected File, Buffer, or file path string.');
      }

      formData.append('path', path || '');
      formData.append('verifyProof', verifyProof.toString());
      formData.append('segmentNumber', segmentNumber.toString());
      formData.append('replicas', replicas.toString());

      const response = await fetch('/api/og-storage/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload file');
      }

      return {
        success: true,
        rootHash: result.rootHash,
        txHash: result.txHash,
        fileSize: result.fileSize,
        path: result.path,
      };
    } catch (error) {
      console.error('❌ Failed to upload file to 0G Storage:', error);
      throw error;
    }
  }

  /**
   * Download file from 0G Storage
   * @param {string} rootHash - File root hash (Merkle root)
   * @param {Object} options - Download options
   * @returns {Promise<Blob>} Downloaded file as Blob
   */
  async downloadFile(rootHash, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      verifyProof = OG_STORAGE_SETTINGS.DEFAULT_VERIFY_PROOF,
      outputPath = null,
    } = options;

    try {
      const response = await fetch(
        `/api/og-storage/download?rootHash=${rootHash}&verifyProof=${verifyProof}${outputPath ? `&outputPath=${outputPath}` : ''}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download file');
      }

      // Return as Blob
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('❌ Failed to download file from 0G Storage:', error);
      throw error;
    }
  }

  /**
   * Upload game asset
   * @param {File|Buffer} asset - Asset file
   * @param {string} assetType - Type of asset (images, sounds, animations)
   * @param {string} filename - Asset filename
   * @returns {Promise<Object>} Upload result
   */
  async uploadGameAsset(asset, assetType, filename) {
    const path = buildStoragePath(OG_STORAGE_PATHS[`GAME_${assetType.toUpperCase()}`] || OG_STORAGE_PATHS.GAME_ASSETS, filename);
    return await this.uploadFile(asset, { path });
  }

  /**
   * Upload user avatar
   * @param {File|Buffer} avatar - Avatar image
   * @param {string} userId - User ID or address
   * @returns {Promise<Object>} Upload result
   */
  async uploadUserAvatar(avatar, userId) {
    const filename = `avatar_${userId}_${Date.now()}.png`;
    const path = buildStoragePath(OG_STORAGE_PATHS.USER_AVATARS, filename);
    return await this.uploadFile(avatar, { path });
  }

  /**
   * Store value in Key-Value storage
   * @param {number} streamId - Stream ID for KV storage
   * @param {string} key - Key
   * @param {string|Object} value - Value to store
   * @returns {Promise<Object>} Storage result
   */
  async storeKV(streamId, key, value) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const valueString = typeof value === 'string' ? value : JSON.stringify(value);

      const response = await fetch('/api/og-storage/kv/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          key,
          value: valueString,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to store KV value');
      }

      return {
        success: true,
        txHash: result.txHash,
        streamId,
        key,
      };
    } catch (error) {
      console.error('❌ Failed to store KV value:', error);
      throw error;
    }
  }

  /**
   * Retrieve value from Key-Value storage
   * @param {number} streamId - Stream ID for KV storage
   * @param {string} key - Key
   * @returns {Promise<string|Object>} Retrieved value
   */
  async getKV(streamId, key) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(
        `/api/og-storage/kv/get?streamId=${streamId}&key=${encodeURIComponent(key)}`
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get KV value');
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(result.value);
      } catch {
        return result.value;
      }
    } catch (error) {
      console.error('❌ Failed to get KV value:', error);
      throw error;
    }
  }

  /**
   * Store user profile data in KV
   * @param {string} userAddress - User wallet address
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Storage result
   */
  async storeUserProfile(userAddress, profileData) {
    const streamId = OG_STORAGE_PATHS.KV_STREAMS.USER_STATE;
    const key = `profile_${userAddress.toLowerCase()}`;
    return await this.storeKV(streamId, key, profileData);
  }

  /**
   * Get user profile data from KV
   * @param {string} userAddress - User wallet address
   * @returns {Promise<Object>} Profile data
   */
  async getUserProfile(userAddress) {
    const streamId = OG_STORAGE_PATHS.KV_STREAMS.USER_STATE;
    const key = `profile_${userAddress.toLowerCase()}`;
    return await this.getKV(streamId, key);
  }

  /**
   * Upload tournament data
   * @param {Object} tournamentData - Tournament data
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Object>} Upload result
   */
  async uploadTournamentData(tournamentData, tournamentId) {
    const dataString = JSON.stringify(tournamentData);
    const filename = `tournament_${tournamentId}_${Date.now()}.json`;
    const path = buildStoragePath(OG_STORAGE_PATHS.TOURNAMENTS, filename);
    
    // Create Blob from JSON string
    const blob = new Blob([dataString], { type: 'application/json' });
    return await this.uploadFile(blob, { path });
  }

  /**
   * Upload game history backup
   * @param {Array} gameHistory - Game history array
   * @param {string} backupId - Backup identifier
   * @returns {Promise<Object>} Upload result
   */
  async uploadGameHistoryBackup(gameHistory, backupId) {
    const dataString = JSON.stringify({
      type: 'game_history_backup',
      timestamp: Date.now(),
      backupId,
      games: gameHistory,
      totalGames: gameHistory.length,
      version: '1.0',
    });
    
    const filename = `backup_${backupId}_${Date.now()}.json`;
    const path = buildStoragePath(OG_STORAGE_PATHS.GAME_HISTORY_BACKUPS, filename);
    
    const blob = new Blob([dataString], { type: 'application/json' });
    return await this.uploadFile(blob, { path });
  }

  /**
   * Check if file exists (by root hash)
   * @param {string} rootHash - File root hash
   * @returns {Promise<boolean>} Whether file exists
   */
  async fileExists(rootHash) {
    try {
      const response = await fetch(`/api/og-storage/exists?rootHash=${rootHash}`);
      const result = await response.json();
      return result.exists === true;
    } catch (error) {
      console.error('❌ Failed to check file existence:', error);
      return false;
    }
  }

  /**
   * Get file info
   * @param {string} rootHash - File root hash
   * @returns {Promise<Object>} File information
   */
  async getFileInfo(rootHash) {
    try {
      const response = await fetch(`/api/og-storage/info?rootHash=${rootHash}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get file info');
      }
      
      return result.info;
    } catch (error) {
      console.error('❌ Failed to get file info:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new OGStorageService();

