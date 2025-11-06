/**
 * 0G Storage File Info API Route
 * Gets file information from 0G Storage by root hash
 */

import { NextResponse } from 'next/server';
import { Indexer } from '@0glabs/0g-ts-sdk';
import OG_STORAGE_CONFIG from '@/config/ogStorage.js';

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
 * GET /api/og-storage/info
 * Get file information from 0G Storage
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
    const networkConfig = getCurrentStorageNetworkConfig();

    // Note: The SDK may not have direct file info methods
    // This is a placeholder that can be extended with actual indexer queries
    // For now, return basic info structure
    
    return NextResponse.json({
      success: true,
      info: {
        rootHash: rootHash,
        network: networkConfig.networkName,
        indexerRpc: networkConfig.indexerRpc,
        note: 'File info requires indexer metadata query. Basic info returned.',
      },
    });

  } catch (error) {
    console.error('❌ 0G Storage info error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get file info',
    }, { status: 500 });
  }
}

