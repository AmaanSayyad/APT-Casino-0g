/**
 * 0G DA Service Status API Route
 * Checks DA Client node availability
 * Production-ready implementation with real connection test
 */

import { NextResponse } from 'next/server';
import { getCurrentDANetworkConfig } from '../../../config/ogDA.js';
import ogDAClient from '../../../services/OGDAClient.js';

/**
 * GET /api/og-da/status
 * Check DA Client node status
 */
export async function GET() {
  try {
    const networkConfig = getCurrentDANetworkConfig();
    
    // Check if DA Client URL is configured
    if (!networkConfig.daClientUrl || networkConfig.daClientUrl === 'http://localhost:51001') {
      return NextResponse.json({
        success: true,
        available: false,
        daClientUrl: networkConfig.daClientUrl || 'not configured',
        network: networkConfig.networkName,
        chainId: networkConfig.chainId,
        error: 'DA Client node not configured. Set NEXT_PUBLIC_0G_DA_CLIENT_URL environment variable.',
        note: 'DA Client node setup required. See documentation for setup instructions.',
      });
    }

    // Test actual connection to DA Client
    let isAvailable = false;
    let error = null;
    let connectionTest = null;
    
    try {
      // Try to initialize and test connection
      await ogDAClient.initialize();
      connectionTest = await ogDAClient.testConnection();
      isAvailable = true;
    } catch (checkError) {
      error = checkError.message;
      isAvailable = false;
      
      // Check if it's a connection refused error
      if (checkError.message?.includes('ECONNREFUSED')) {
        error = `Cannot connect to DA Client at ${networkConfig.daClientUrl}. Ensure the DA Client node is running.`;
      }
    }
    
    return NextResponse.json({
      success: true,
      available: isAvailable,
      daClientUrl: networkConfig.daClientUrl,
      network: networkConfig.networkName,
      chainId: networkConfig.chainId,
      connectionTest: connectionTest ? 'passed' : 'failed',
      error: error,
      note: isAvailable 
        ? 'DA Client node is connected and ready' 
        : 'DA Client node connection failed. Check that the node is running and accessible.',
    });

  } catch (error) {
    console.error('❌ 0G DA status check error:', error);
    return NextResponse.json({
      success: false,
      available: false,
      error: error.message || 'Failed to check DA status',
    }, { status: 500 });
  }
}

