/**
 * 0G Storage Download API Route
 * Handles file downloads from 0G Storage network
 * Production-ready implementation using TypeScript SDK
 */

import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { Indexer } from '@0glabs/0g-ts-sdk';
import { getCurrentStorageNetworkConfig } from '../../../config/ogStorage.js';

// Initialize indexer (singleton)
let indexer = null;
let isInitialized = false;

async function initializeStorage() {
  if (isInitialized && indexer) {
    return indexer;
  }

  try {
    const networkConfig = getCurrentStorageNetworkConfig();
    indexer = new Indexer(networkConfig.indexerRpc);
    isInitialized = true;
    console.log('✅ 0G Storage indexer initialized');
    return indexer;
  } catch (error) {
    console.error('❌ Failed to initialize 0G Storage indexer:', error);
    throw error;
  }
}

/**
 * GET /api/og-storage/download
 * Download a file from 0G Storage
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rootHash = searchParams.get('rootHash');
    const verifyProof = searchParams.get('verifyProof') === 'true';
    const outputPath = searchParams.get('outputPath');

    if (!rootHash) {
      return NextResponse.json({
        success: false,
        error: 'Root hash is required (use ?rootHash=...)',
      }, { status: 400 });
    }

    console.log('📥 0G Storage: Downloading file...');
    console.log(`   Root Hash: ${rootHash}`);
    console.log(`   Verify Proof: ${verifyProof}`);

    // Initialize indexer
    const indexerClient = await initializeStorage();

    // Determine output path
    const downloadPath = outputPath || join(tmpdir(), `download_${Date.now()}_${rootHash.substring(0, 16)}`);

    // Download file
    const downloadErr = await indexerClient.download(rootHash, downloadPath, verifyProof);
    
    if (downloadErr !== null) {
      throw new Error(`Download error: ${downloadErr}`);
    }

    // Read downloaded file
    const fileBuffer = await require('fs').promises.readFile(downloadPath);
    
    // Clean up temp file if we created it
    if (!outputPath) {
      try {
        await unlink(downloadPath);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp file:', cleanupError);
      }
    }

    console.log('✅ 0G Storage: Download successful');
    console.log(`   File Size: ${fileBuffer.length} bytes`);

    // Return file as response
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="file_${rootHash.substring(0, 16)}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ 0G Storage download error:', error);
    
    // Check if file not found
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      return NextResponse.json({
        success: false,
        error: 'File not found. The root hash may be incorrect or the file may not be available yet.',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to download file from 0G Storage',
    }, { status: 500 });
  }
}

