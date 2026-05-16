/**
 * 0G Storage Key-Value Get API Route
 * Handles retrieving key-value data from 0G Storage KV layer
 * Production-ready implementation using TypeScript SDK
 */

import { NextResponse } from 'next/server';
import { KvClient } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

// KV Client endpoint (this should be configurable)
const KV_CLIENT_ENDPOINT = process.env.NEXT_PUBLIC_0G_KV_CLIENT_ENDPOINT || 'http://3.101.147.150:6789';

// Initialize KV client (singleton)
let kvClient = null;

function getKVClient() {
  if (!kvClient) {
    kvClient = new KvClient(KV_CLIENT_ENDPOINT);
  }
  return kvClient;
}

/**
 * GET /api/og-storage/kv/get
 * Retrieve key-value data from 0G Storage KV layer
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('streamId');
    const key = searchParams.get('key');

    if (!streamId || !key) {
      return NextResponse.json({
        success: false,
        error: 'streamId and key are required (use ?streamId=...&key=...)',
      }, { status: 400 });
    }

    console.log('🔍 0G Storage KV: Retrieving data...');
    console.log(`   Stream ID: ${streamId}`);
    console.log(`   Key: ${key}`);

    // Get KV client
    const client = getKVClient();

    // Convert key to bytes and encode
    const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
    const encodedKey = ethers.encodeBase64(keyBytes);

    // Get value
    const value = await client.getValue(streamId, encodedKey);

    if (!value) {
      return NextResponse.json({
        success: false,
        error: 'Key not found',
      }, { status: 404 });
    }

    console.log('✅ 0G Storage KV: Retrieval successful');

    return NextResponse.json({
      success: true,
      streamId: streamId,
      key: key,
      value: value,
    });

  } catch (error) {
    console.error('❌ 0G Storage KV get error:', error);
    
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      return NextResponse.json({
        success: false,
        error: 'Key not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get KV value from 0G Storage',
    }, { status: 500 });
  }
}

