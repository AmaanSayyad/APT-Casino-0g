import { ethers } from 'ethers';
import { getTreasuryPrivateKeyOrNull } from '@/lib/treasuryPrivate.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Environment (server-side only) — defaults target 0G EVM; override with CASINO_SESSION_RPC if needed.
const RPC_URL =
  process.env.CASINO_SESSION_RPC ||
  process.env.NEXT_PUBLIC_0G_MAINNET_RPC ||
  process.env.NEXT_PUBLIC_0G_GALILEO_RPC ||
  'https://evmrpc.0g.ai';
const CASINO_ADDRESS =
  process.env.NEXT_PUBLIC_CASINO_SESSION_CONTRACT ||
  process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS ||
  '';

function resolveSessionSignerKey() {
  const dedicated = process.env.CASINO_WALLET_PRIVATE_KEY?.trim();
  if (dedicated) return dedicated;
  return getTreasuryPrivateKeyOrNull();
}

// Minimal ABI with createGameSession and minBet (channel id is opaque bytes32 on-chain)
const ABI = [
  "function createGameSession(bytes32 sessionId, uint8 gameType, bytes32 channelId) external payable",
  "function minBet() view returns (uint256)"
];

// Map game type to enum
const GAME_ENUM = {
  MINES: 0,
  PLINKO: 1,
  ROULETTE: 2,
  WHEEL: 3,
};

export async function POST(request) {
  try {
    const sessionKey = resolveSessionSignerKey();
    if (!CASINO_ADDRESS || !sessionKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Casino wallet or contract not configured' }), { status: 400 });
    }

    const body = await request.json();
    const { sessionId, gameType, channelId, valueOg } = body || {};

    if (!sessionId || !gameType || !channelId) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing sessionId/gameType/channelId' }), { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(sessionKey, provider);
    const contract = new ethers.Contract(CASINO_ADDRESS, ABI, wallet);

    // Use hashed bytes32 to avoid out-of-bounds errors from long strings
    const sessionBytes = ethers.keccak256(ethers.toUtf8Bytes(String(sessionId)));
    const channelBytes = ethers.keccak256(ethers.toUtf8Bytes(String(channelId)));
    const gameEnum = GAME_ENUM[String(gameType).toUpperCase()];
    if (gameEnum === undefined) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid gameType' }), { status: 400 });
    }

    // Ensure at least minBet value is sent
    let minBetWei = 0n;
    try {
      minBetWei = await contract.minBet();
    } catch {}

    let sendValue = 0n;
    if (valueOg !== undefined && valueOg !== null) {
      try { sendValue = ethers.parseEther(String(valueOg)); } catch {}
    }
    if (sendValue < minBetWei) sendValue = minBetWei;

    const tx = await contract.createGameSession(sessionBytes, gameEnum, channelBytes, {
      value: sendValue,
    });
    const receipt = await tx.wait();

    return new Response(JSON.stringify({ ok: true, txHash: tx.hash, blockNumber: receipt.blockNumber }), { status: 200 });
  } catch (err) {
    const message = err?.reason || err?.shortMessage || err?.message || String(err);
    // If session already exists, treat as idempotent success to avoid spamming errors
    if (message && message.toLowerCase().includes('session already exists')) {
      return new Response(JSON.stringify({ ok: true, warning: 'Session already exists' }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 });
  }
}


