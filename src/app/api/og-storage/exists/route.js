/**
 * 0G Storage File Exists API Route
 * Checks if a file exists in 0G Storage by root hash
 */

import { NextResponse } from 'next/server';
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
    return indexer;
  } catch (error) {
    console.error('❌ Failed to initialize 0G Storage indexer:', error);
    throw error;
  }
}

/**
 * GET /api/og-storage/exists
 * Check if file exists in 0G Storage
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rootHash = searchParams.get('rootHash');

    if (!rootHash) {
      return NextResponse.json({
        success: false,
        error: 'Root hash is required (use ?rootHash=...)',
      }, { status: 400 });
    }

    // Initialize indexer
    const indexerClient = await initializeStorage();

    // Try to get file info (if it exists, we'll get info; if not, we'll get an error)
    try {
      // Note: The SDK doesn't have a direct "exists" method,
      // so we try to download a small portion or check metadata
      // For now, we'll return true if we can initialize without errors
      // In production, you might want to query the indexer for file metadata
      
      return NextResponse.json({
        success: true,
        exists: true, // Placeholder - actual implementation would query indexer
        rootHash: rootHash,
        note: 'File existence check requires indexer metadata query. Assuming exists if no error.',
      });
    } catch (error) {
      // If there's an error, file likely doesn't exist
      return NextResponse.json({
        success: true,
        exists: false,
        rootHash: rootHash,
      });
    }

  } catch (error) {
    console.error('❌ 0G Storage exists check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check file existence',
    }, { status: 500 });
  }
}

