import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { requireTreasuryPrivateKey } from '@/lib/treasuryPrivate.js';

const MAINNET_CHAIN_ID  = 16661; // 0x4115
const TESTNET_CHAIN_ID  = 16602; // 0x40da

function getNetworkForChainId(chainId) {
  const id = chainId ? parseInt(String(chainId), 10) : null;
  if (id === TESTNET_CHAIN_ID) {
    return {
      rpc:      process.env.NEXT_PUBLIC_0G_GALILEO_RPC     || 'https://evmrpc-testnet.0g.ai',
      explorer: process.env.NEXT_PUBLIC_0G_GALILEO_EXPLORER || 'https://chainscan-galileo.0g.ai',
      name:     '0G-Galileo-Testnet',
    };
  }
  // Default → mainnet
  return {
    rpc:      process.env.NEXT_PUBLIC_0G_MAINNET_RPC      || 'https://evmrpc.0g.ai',
    explorer: process.env.NEXT_PUBLIC_0G_MAINNET_EXPLORER  || 'https://chainscan.0g.ai',
    name:     '0G-Mainnet',
  };
}

export async function POST(request) {
  try {
    const privateKey = requireTreasuryPrivateKey();

    const { userAddress, amount, chainId } = await request.json();
    const network = getNetworkForChainId(chainId);
    const provider = new ethers.JsonRpcProvider(network.rpc);
    const treasuryWallet = new ethers.Wallet(privateKey, provider);

    console.log(`💸 Withdraw on ${network.name} (chainId=${chainId ?? 'not sent, defaulting to mainnet'})`)

    if (!userAddress || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let treasuryBalance = 0n;
    try {
      treasuryBalance = await provider.getBalance(treasuryWallet.address);
    } catch (balanceError) {
      console.warn('Could not check treasury balance:', balanceError.message);
    }

    const amountWei = ethers.parseEther(amount.toString());
    if (treasuryBalance < amountWei) {
      return NextResponse.json(
        {
          error: `Insufficient treasury funds. Available: ${ethers.formatEther(treasuryBalance)} OG, Requested: ${amount} OG`,
        },
        { status: 400 }
      );
    }

    let formattedUserAddress;
    if (typeof userAddress === 'object' && userAddress.data) {
      const bytes = Object.values(userAddress.data);
      formattedUserAddress = '0x' + bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
    } else if (typeof userAddress === 'string') {
      formattedUserAddress = userAddress.startsWith('0x') ? userAddress : `0x${userAddress}`;
    } else {
      throw new Error(`Invalid userAddress format: ${typeof userAddress}`);
    }

    const tx = await treasuryWallet.sendTransaction({
      to: formattedUserAddress,
      value: amountWei,
      gasLimit: process.env.GAS_LIMIT_WITHDRAW ? parseInt(process.env.GAS_LIMIT_WITHDRAW, 10) : 100000,
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactionHash: tx.hash,
        explorerUrl: `${network.explorer}/tx/${tx.hash}`,
        network: network.name,
        amount,
        userAddress,
        treasuryAddress: treasuryWallet.address,
        status: 'pending',
        message: 'Transaction sent successfully. Check the block explorer for confirmation.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Withdraw API error:', error);
    const errorMessage = error?.message || 'Unknown error occurred';
    const safeErrorMessage = typeof errorMessage === 'string' ? errorMessage : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: `Withdrawal failed: ${safeErrorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId');
    const network = getNetworkForChainId(chainId);

    const privateKey = requireTreasuryPrivateKey();
    const provider = new ethers.JsonRpcProvider(network.rpc);
    const treasuryWallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(treasuryWallet.address);

    return NextResponse.json({
      treasuryAddress: treasuryWallet.address,
      balance: ethers.formatEther(balance),
      balanceWei: balance.toString(),
      network: network.name,
    });
  } catch (error) {
    console.error('Treasury balance check error:', error);
    return NextResponse.json(
      { error: 'Failed to check treasury balance: ' + (error.message || String(error)) },
      { status: 500 }
    );
  }
}
