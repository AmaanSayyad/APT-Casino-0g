/**
 * 0G Storage Key-Value Store API Route
 * Handles storing key-value data in 0G Storage KV layer
 * Production-ready implementation using TypeScript SDK
 */

import { NextResponse } from 'next/server';
import { Indexer, Batcher, KvClient } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { TREASURY_CONFIG } from '../../../config/treasury.js';
import { getCurrentStorageNetworkConfig } from '../../../config/ogStorage.js';

// Initialize clients (singletons)
let indexer = null;
let signer = null;
let flowContract = null;
let isInitialized = false;

async function initializeStorage() {
  if (isInitialized && indexer && signer) {
    return { indexer, signer, flowContract };
  }

  try {
    const networkConfig = getCurrentStorageNetworkConfig();
    
    // Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    signer = new ethers.Wallet(TREASURY_CONFIG.PRIVATE_KEY, provider);
    
    // Initialize indexer
    indexer = new Indexer(networkConfig.indexerRpc);
    
    // Flow contract address (get from environment or use default)
    // Note: This should be the actual flow contract address on 0G network
    flowContract = process.env.NEXT_PUBLIC_0G_FLOW_CONTRACT || '0x0000000000000000000000000000000000000000';
    
    isInitialized = true;
    console.log('✅ 0G Storage KV initialized');
    
    return { indexer, signer, flowContract };
  } catch (error) {
    console.error('❌ Failed to initialize 0G Storage KV:', error);
    throw error;
  }
}

/**
 * POST /api/og-storage/kv/store
 * Store key-value data in 0G Storage KV layer
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { streamId, key, value } = body;

    if (!streamId || !key || value === undefined) {
      return NextResponse.json({
        success: false,
        error: 'streamId, key, and value are required',
      }, { status: 400 });
    }

    console.log('💾 0G Storage KV: Storing data...');
    console.log(`   Stream ID: ${streamId}`);
    console.log(`   Key: ${key}`);

    // Initialize storage
    const { indexer: indexerClient, signer: signerWallet, flowContract: contract } = await initializeStorage();
    const networkConfig = getCurrentStorageNetworkConfig();

    // Select nodes
    const [nodes, nodeErr] = await indexerClient.selectNodes(streamId);
    if (nodeErr !== null) {
      throw new Error(`Error selecting nodes: ${nodeErr}`);
    }

    // Create batcher
    const batcher = new Batcher(streamId, nodes, contract, networkConfig.rpcUrl);

    // Convert key and value to bytes
    const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
    const valueBytes = Uint8Array.from(Buffer.from(value, 'utf-8'));
    
    // Set data in batcher
    batcher.streamDataBuilder.set(streamId, keyBytes, valueBytes);

    // Execute batch
    const [txHash, batchErr] = await batcher.exec();
    if (batchErr !== null) {
      throw new Error(`Batch execution error: ${batchErr}`);
    }

    console.log('✅ 0G Storage KV: Storage successful');
    console.log(`   Transaction: ${txHash}`);

    return NextResponse.json({
      success: true,
      txHash: txHash,
      streamId: streamId,
      key: key,
      network: networkConfig.networkName,
    });

  } catch (error) {
    console.error('❌ 0G Storage KV store error:', error);
    
    if (error.message?.includes('private key') || error.message?.includes('TREASURY')) {
      return NextResponse.json({
        success: false,
        error: 'Treasury private key not configured. Set TREASURY_PRIVATE_KEY in environment variables.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to store KV value in 0G Storage',
    }, { status: 500 });
  }
}

