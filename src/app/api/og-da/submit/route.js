/**
 * 0G DA Blob Submission API Route
 * Handles submission of data blobs to 0G DA network via DA Client node
 * Production-ready implementation with real gRPC client
 */

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { TREASURY_CONFIG } from '@/config/treasury.js';
import { 
  getCurrentDANetworkConfig,
  OG_DA_BLOB_CONFIG,
  validateBlobSize 
} from '../../../config/ogDA.js';
import ogDAClient from '../../../services/OGDAClient.js';

/**
 * POST /api/og-da/submit
 * Submit a data blob to 0G DA
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { data, options = {} } = body;

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Data is required',
      }, { status: 400 });
    }

    // Validate blob size
    try {
      validateBlobSize(data);
    } catch (sizeError) {
      return NextResponse.json({
        success: false,
        error: sizeError.message,
      }, { status: 400 });
    }

    const networkConfig = getCurrentDANetworkConfig();
    
    // Initialize provider and wallet for balance check
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = new ethers.Wallet(TREASURY_CONFIG.PRIVATE_KEY, provider);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    if (balance === 0n) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient balance for DA submission',
      }, { status: 400 });
    }

    console.log('📦 0G DA: Preparing blob submission...');
    console.log(`   Blob size: ${new TextEncoder().encode(data).length} bytes`);
    console.log(`   DA Client URL: ${networkConfig.daClientUrl}`);

    // Submit blob via gRPC to DA Client
    const customQuorumNumbers = options.customQuorumNumbers || [];
    const disperseResult = await ogDAClient.disperseBlob(data, customQuorumNumbers);

    // Get blob status to retrieve additional details
    let blobStatus = null;
    try {
      blobStatus = await ogDAClient.getBlobStatus(disperseResult.requestId);
      console.log(`📊 Blob status: ${blobStatus.status}`);
    } catch (statusError) {
      console.warn('⚠️ Could not get blob status:', statusError.message);
      // Continue even if status check fails
    }

    // Calculate data root and blob hash for reference
    const dataBytes = new TextEncoder().encode(data);
    const dataRoot = ethers.keccak256(dataBytes);
    const blobHash = ethers.keccak256(ethers.toUtf8Bytes(disperseResult.requestId));

    return NextResponse.json({
      success: true,
      requestId: disperseResult.requestId,
      blobHash: blobHash,
      dataRoot: dataRoot,
      result: disperseResult.result,
      blobSize: disperseResult.blobSize,
      status: blobStatus?.status || 'pending',
      statusInfo: blobStatus?.info || null,
      daClientUrl: networkConfig.daClientUrl,
    });

  } catch (error) {
    console.error('❌ 0G DA submission error:', error);
    
    // Check if it's a connection error
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Failed to connect')) {
      return NextResponse.json({
        success: false,
        error: 'Cannot connect to DA Client node. Please ensure the DA Client is running and accessible.',
        details: error.message,
        daClientUrl: getCurrentDANetworkConfig().daClientUrl,
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to submit blob to 0G DA',
    }, { status: 500 });
  }
}

