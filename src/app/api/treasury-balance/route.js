import { NextResponse } from 'next/server';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { requireTreasuryPrivateKey, getTreasuryPrivateKeyOrNull } from '@/lib/treasuryPrivate.js';
import PYTH_ENTROPY_CONFIG from '@/config/pythEntropy.js';

export async function GET() {
  try {
    if (!getTreasuryPrivateKeyOrNull()) {
      return NextResponse.json(
        { success: false, error: 'Treasury private key not configured on server' },
        { status: 503 }
      );
    }

    const pk = requireTreasuryPrivateKey();
    const ogRpcUrl =
      process.env.NEXT_PUBLIC_0G_GALILEO_RPC ||
      process.env.NEXT_PUBLIC_0G_MAINNET_RPC ||
      'https://evmrpc-testnet.0g.ai';
    const ogProvider = new JsonRpcProvider(ogRpcUrl);
    const ogWallet = new Wallet(pk, ogProvider);
    const ogBalanceFmt = ethers.formatEther(await ogProvider.getBalance(ogWallet.address));

    const entropyKey =
      process.env.NEXT_PUBLIC_ENTROPY_NETWORK ||
      process.env.NEXT_PUBLIC_CASINO_ENTROPY_NETWORK ||
      PYTH_ENTROPY_CONFIG.DEFAULT_NETWORK;
    const entropyConfig = PYTH_ENTROPY_CONFIG.getNetworkConfig(entropyKey);
    let oracleBalanceFmt = null;
    let oracleNetwork = null;
    if (entropyConfig?.rpcUrl) {
      const oracleProvider = new JsonRpcProvider(entropyConfig.rpcUrl);
      const oracleWallet = new Wallet(pk, oracleProvider);
      oracleBalanceFmt = ethers.formatEther(await oracleProvider.getBalance(oracleWallet.address));
      oracleNetwork = {
        name: entropyConfig.name,
        chainId: entropyConfig.chainId,
        rpcUrl: entropyConfig.rpcUrl,
      };
    }

    return NextResponse.json({
      success: true,
      treasury: {
        address: ogWallet.address,
        og: {
          balance: ogBalanceFmt,
          rpcUrl: ogRpcUrl,
        },
        entropyOracle: oracleNetwork
          ? { balance: oracleBalanceFmt, ...oracleNetwork }
          : null,
      },
      entropy: {
        contractAddress: PYTH_ENTROPY_CONFIG.getEntropyContract(entropyKey),
      },
    });
  } catch (error) {
    console.error('Treasury balance check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check treasury balance', details: error.message },
      { status: 500 }
    );
  }
}
