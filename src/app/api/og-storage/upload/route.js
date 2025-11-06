/**
 * 0G Storage Upload API Route
 * Handles file uploads to 0G Storage network
 * Production-ready implementation using TypeScript SDK
 */

import { NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { ZgFile, Indexer } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { TREASURY_CONFIG } from '@/config/treasury.js';
import { 
  getCurrentStorageNetworkConfig,
  OG_STORAGE_SETTINGS,
  validateFileSize 
} from '@/config/ogStorage.js';

// Initialize indexer (singleton)
let indexer = null;
let signer = null;
let isInitialized = false;

async function initializeStorage() {
  if (isInitialized && indexer && signer) {
    return { indexer, signer };
  }

  try {
    const networkConfig = getCurrentStorageNetworkConfig();
    
    // Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    signer = new ethers.Wallet(TREASURY_CONFIG.PRIVATE_KEY, provider);
    
    // Initialize indexer
    indexer = new Indexer(networkConfig.indexerRpc);
    
    isInitialized = true;
    console.log('✅ 0G Storage initialized');
    console.log(`📍 Indexer RPC: ${networkConfig.indexerRpc}`);
    
    return { indexer, signer };
  } catch (error) {
    console.error('❌ Failed to initialize 0G Storage:', error);
    throw error;
  }
}

/**
 * POST /api/og-storage/upload
 * Upload a file to 0G Storage
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const filePath = formData.get('filePath');
    const path = formData.get('path') || '';
    const verifyProof = formData.get('verifyProof') === 'true';
    const segmentNumber = parseInt(formData.get('segmentNumber') || OG_STORAGE_SETTINGS.DEFAULT_SEGMENT_NUMBER);
    const replicas = parseInt(formData.get('replicas') || OG_STORAGE_SETTINGS.DEFAULT_REPLICAS);

    // Initialize storage
    const { indexer: indexerClient, signer: signerWallet } = await initializeStorage();
    const networkConfig = getCurrentStorageNetworkConfig();

    let tempFilePath = null;
    let fileToUpload = null;

    try {
      // Handle file upload
      if (file instanceof File) {
        // Save uploaded file to temp directory
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Validate file size
        validateFileSize(buffer.length);
        
        tempFilePath = join(tmpdir(), `upload_${Date.now()}_${file.name}`);
        await writeFile(tempFilePath, buffer);
        fileToUpload = tempFilePath;
      } else if (filePath) {
        // Use provided file path
        fileToUpload = filePath;
      } else {
        return NextResponse.json({
          success: false,
          error: 'No file provided. Send file as multipart/form-data or provide filePath.',
        }, { status: 400 });
      }

      console.log('📤 0G Storage: Uploading file...');
      console.log(`   File: ${fileToUpload}`);
      console.log(`   Path: ${path}`);

      // Create ZgFile from file path
      const zgFile = await ZgFile.fromFilePath(fileToUpload);
      
      // Generate Merkle tree for verification
      const [tree, treeErr] = await zgFile.merkleTree();
      if (treeErr !== null) {
        throw new Error(`Error generating Merkle tree: ${treeErr}`);
      }
      
      const rootHash = tree?.rootHash();
      console.log(`   Root Hash: ${rootHash}`);

      // Upload to network
      const [txHash, uploadErr] = await indexerClient.upload(
        zgFile,
        networkConfig.rpcUrl,
        signerWallet
      );
      
      if (uploadErr !== null) {
        throw new Error(`Upload error: ${uploadErr}`);
      }

      // Get file size
      const stats = require('fs').statSync(fileToUpload);
      const fileSize = stats.size;

      console.log('✅ 0G Storage: Upload successful');
      console.log(`   Transaction: ${txHash}`);
      console.log(`   Root Hash: ${rootHash}`);
      console.log(`   File Size: ${fileSize} bytes`);

      // Clean up temp file
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup temp file:', cleanupError);
        }
      }

      // Close file
      await zgFile.close();

      return NextResponse.json({
        success: true,
        rootHash: rootHash,
        txHash: txHash,
        fileSize: fileSize,
        path: path,
        network: networkConfig.networkName,
      });

    } catch (error) {
      // Clean up temp file on error
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup temp file on error:', cleanupError);
        }
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ 0G Storage upload error:', error);
    
    // Check for specific error types
    if (error.message?.includes('size exceeds')) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 400 });
    }

    if (error.message?.includes('private key') || error.message?.includes('TREASURY')) {
      return NextResponse.json({
        success: false,
        error: 'Treasury private key not configured. Set TREASURY_PRIVATE_KEY in environment variables.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to upload file to 0G Storage',
    }, { status: 500 });
  }
}

