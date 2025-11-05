import { NextResponse } from 'next/server';
import ogContractLogger from '@/services/OGContractLogger.js';

export async function POST(request) {
  try {
    const gameData = await request.json();
    
    console.log('📝 0G CONTRACT API: Received game data:', {
      gameId: gameData.gameId,
      gameType: gameData.gameType,
      userAddress: gameData.userAddress
    });

    // Validate input
    if (!gameData.gameId || !gameData.gameType || !gameData.userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, gameType, userAddress' },
        { status: 400 }
      );
    }

    // Log to contract
    const result = await ogContractLogger.logGameResult(gameData);
    
    if (result.success) {
      console.log('✅ 0G CONTRACT API: Game logged successfully:', result.transactionHash);
      return NextResponse.json(result);
    } else {
      console.error('❌ 0G CONTRACT API: Failed to log game:', result.error);
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error('❌ 0G CONTRACT API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      transactionHash: null,
      explorerUrl: null,
      network: '0g-mainnet'
    }, { status: 500 });
  }
}

// GET endpoint to check contract status and stats
export async function GET() {
  try {
    const stats = await ogContractLogger.getLoggerStats();
    const networkConfig = ogContractLogger.getNetworkConfig();
    
    return NextResponse.json({
      success: true,
      stats: stats,
      network: networkConfig,
      contractExplorerUrl: ogContractLogger.getContractExplorerUrl(),
      status: 'ready'
    });
    
  } catch (error) {
    console.error('❌ 0G CONTRACT API: Status check failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      status: 'error'
    }, { status: 500 });
  }
}

// Ensure Node.js runtime and no caching for this route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;