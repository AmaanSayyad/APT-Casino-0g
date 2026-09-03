import { NextResponse } from 'next/server';
import { getOgChainConfig, getGameLoggerAddress, OG_MAINNET } from '@/config/ogNetwork.js';
import ogContractLogger from '@/services/OGContractLogger.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const chain = getOgChainConfig();
  const contractAddress = getGameLoggerAddress();

  let stats = null;
  let statsError = null;
  if (contractAddress) {
    try {
      stats = await ogContractLogger.getLoggerStats();
    } catch (error) {
      statsError = error.message;
    }
  }

  return NextResponse.json({
    success: true,
    wave: 3,
    program: '0G Bridge by AKINDO',
    project: {
      name: 'APT-Casino',
      oneLiner: 'Provably fair GameFi casino on 0G Mainnet with Compute, Storage, and DA.',
      liveUrl: 'https://apt-casino-0g-gamma.vercel.app',
      demoVideo: 'https://youtu.be/1QGwBnbokOw',
    },
    chain: {
      name: chain.name,
      chainId: chain.chainId,
      rpcUrl: chain.rpcUrl,
      explorerUrl: chain.explorerUrl,
      requiredMainnetChainId: OG_MAINNET.chainId,
      isMainnet: chain.chainId === OG_MAINNET.chainId,
    },
    contract: {
      name: 'GameLogger',
      address: contractAddress,
      explorerUrl: contractAddress
        ? `${chain.explorerUrl}/address/${contractAddress}`
        : null,
      stats,
      statsError,
    },
    treasury: {
      address: process.env.TREASURY_ADDRESS || null,
    },
    modules: [
      {
        name: '0G Chain',
        status: chain.chainId === OG_MAINNET.chainId ? 'mainnet' : 'testnet',
        proof: 'GameLogger contract + on-chain game logs',
      },
      {
        name: '0G Compute',
        status: process.env.NEXT_PUBLIC_0G_COMPUTE_NETWORK || 'testnet',
        proof: 'AI Assistant + Mines strategy inference via @0glabs/0g-serving-broker',
      },
      {
        name: '0G Storage',
        status: chain.chainId === OG_MAINNET.chainId ? 'mainnet' : 'testnet',
        proof: 'Game history backups and profile blobs via @0glabs/0g-ts-sdk',
      },
      {
        name: '0G DA',
        status: 'testnet-allowed',
        proof: 'Game result blobs submitted through /api/og-da/submit',
      },
    ],
  });
}
