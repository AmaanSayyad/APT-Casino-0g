/**
 * 0G DA Blob Retrieval API Route
 * Handles retrieval of data blobs from 0G DA network
 * Production-ready implementation with real gRPC client
 */

import { NextResponse } from 'next/server';
import OG_DA_CONFIG from '@/config/ogDA.js';
import ogDAClient from '@/services/OGDAClient.js';

/**
 * GET /api/og-da/retrieve
 * Retrieve a blob from 0G DA
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchHeaderHash = searchParams.get('hash') || searchParams.get('batchHeaderHash');
    const blobIndex = parseInt(searchParams.get('blobIndex') || '0', 10);

    if (!batchHeaderHash) {
      return NextResponse.json({
        success: false,
        error: 'Batch header hash is required (use ?hash= or ?batchHeaderHash=)',
      }, { status: 400 });
    }

    console.log('📦 0G DA: Retrieving blob...');
    console.log(`   Batch Header Hash: ${batchHeaderHash}`);
    console.log(`   Blob Index: ${blobIndex}`);

    // Retrieve blob via gRPC
    const blobData = await ogDAClient.retrieveBlob(batchHeaderHash, blobIndex);

    // Convert buffer to string or return as base64
    const dataString = blobData.toString('utf-8');
    
    // Try to parse as JSON if it looks like JSON
    let parsedData = null;
    try {
      parsedData = JSON.parse(dataString);
    } catch {
      // Not JSON, keep as string
    }

    return NextResponse.json({
      success: true,
      batchHeaderHash: batchHeaderHash,
      blobIndex: blobIndex,
      data: parsedData || dataString,
      dataSize: blobData.length,
      format: parsedData ? 'json' : 'string',
    });

  } catch (error) {
    console.error('❌ 0G DA retrieval error:', error);
    
    // Check if it's a connection error
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Failed to connect')) {
      return NextResponse.json({
        success: false,
        error: 'Cannot connect to DA Client node. Please ensure the DA Client is running and accessible.',
        details: error.message,
      }, { status: 503 });
    }

    // Check if blob not found
    if (error.message?.includes('not found') || error.code === 5) {
      return NextResponse.json({
        success: false,
        error: 'Blob not found. The batch header hash may be incorrect or the blob may not be available yet.',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to retrieve blob from 0G DA',
    }, { status: 500 });
  }
}

