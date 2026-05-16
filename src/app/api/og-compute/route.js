/**
 * 0G Compute Network API Route
 * Server-side API for 0G Compute Network operations
 */

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import OpenAI from 'openai';
import { requireTreasuryPrivateKey } from '@/lib/treasuryPrivate.js';
import { 
  getCurrentNetworkConfig,
  DEFAULT_PROVIDER,
  OG_COMPUTE_PROVIDERS 
} from '../../../config/ogComputeNetwork.js';

// Broker singleton — reset on failure so stale testnet instance doesn't persist
let broker = null;
let isBrokerInitialized = false;
let lastNetworkRpc = null;

async function getBroker() {
  const networkConfig = getCurrentNetworkConfig();

  // Re-init if network changed or not yet initialized
  if (isBrokerInitialized && broker && lastNetworkRpc === networkConfig.rpcUrl) {
    return broker;
  }

  // Reset stale instance
  broker = null;
  isBrokerInitialized = false;

  try {
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const privateKey = requireTreasuryPrivateKey();
    const wallet = new ethers.Wallet(privateKey, provider);
    broker = await createZGComputeNetworkBroker(wallet);
    isBrokerInitialized = true;
    lastNetworkRpc = networkConfig.rpcUrl;
    console.log(`✅ 0G Compute broker initialized — ${networkConfig.networkName} (${networkConfig.rpcUrl})`);
    return broker;
  } catch (error) {
    broker = null;
    isBrokerInitialized = false;
    console.error('❌ Failed to initialize 0G Compute broker:', error);
    throw error;
  }
}

/**
 * GET /api/og-compute
 * Get account balance and service information
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // walletBalance doesn't need the broker
    if (action === 'walletBalance') {
      const networkConfig = getCurrentNetworkConfig();
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const privateKey = requireTreasuryPrivateKey();
      const wallet = new ethers.Wallet(privateKey, provider);
      const raw = await provider.getBalance(wallet.address);
      return NextResponse.json({
        success: true,
        address: wallet.address,
        balance: ethers.formatEther(raw),
        network: networkConfig.networkName,
      });
    }

    const brokerInstance = await getBroker();

    switch (action) {
      case 'balance': {
        const account = await brokerInstance.ledger.getLedger();
        return NextResponse.json({
          success: true,
          balance: ethers.formatEther(account.totalBalance),
          raw: {
            totalBalance: account.totalBalance.toString(),
          },
        });
      }

      case 'services':
        const services = await brokerInstance.inference.listService();
        return NextResponse.json({
          success: true,
          services: services.map(service => ({
            provider: service.provider,
            serviceType: service.serviceType,
            url: service.url,
            inputPrice: service.inputPrice.toString(),
            outputPrice: service.outputPrice.toString(),
            model: service.model,
            verifiability: service.verifiability,
          })),
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "balance" or "services"',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ 0G Compute API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * POST /api/og-compute
 * Handle AI inference requests
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, providerAddress, messages, options } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required',
      }, { status: 400 });
    }

    const brokerInstance = await getBroker();
    const targetProvider = providerAddress || DEFAULT_PROVIDER.address;

    switch (action) {
      case 'inference': {
        if (!messages || !Array.isArray(messages)) {
          return NextResponse.json({
            success: false,
            error: 'Messages array is required',
          }, { status: 400 });
        }

        // Check balance before proceeding
        try {
          const account = await brokerInstance.ledger.getLedger();
          const balance = parseFloat(ethers.formatEther(account.totalBalance));
          
          // Minimum required balance for inference (0.5 OG to be safe)
          const MIN_BALANCE = 0.5;
          
          if (balance < MIN_BALANCE) {
            return NextResponse.json({
              success: false,
              error: `Insufficient balance. Current balance: ${balance.toFixed(4)} OG. Minimum required: ${MIN_BALANCE} OG. Please contact administrator for account funding.`,
              currentBalance: balance,
              requiredBalance: MIN_BALANCE,
            }, { status: 400 });
          }
        } catch (balanceError) {
          console.warn('⚠️ Could not check balance:', balanceError);
          // Continue anyway, let the provider handle it
        }

        // Get service metadata
        const { endpoint, model } = await brokerInstance.inference.getServiceMetadata(
          targetProvider
        );

        // Get request headers
        const headers = await brokerInstance.inference.getRequestHeaders(
          targetProvider,
          JSON.stringify(messages)
        );

        // Create OpenAI client
        const openai = new OpenAI({
          baseURL: endpoint,
          apiKey: '',
          defaultHeaders: headers,
        });

        // Send request
        const completion = await openai.chat.completions.create(
          {
            messages: messages,
            model: model,
            ...(options || {}),
          },
        );

        const response = {
          content: completion.choices[0].message.content,
          chatID: completion.id,
          model: completion.model,
          usage: completion.usage,
        };

        // Verify response if possible
        try {
          if (completion.id) {
            const isValid = await brokerInstance.inference.processResponse(
              targetProvider,
              response.content,
              response.chatID
            );
            response.verified = isValid;
          }
        } catch (verifyError) {
          console.warn('⚠️ Response verification failed:', verifyError);
          response.verified = false;
        }

        return NextResponse.json({
          success: true,
          response,
        });
      }

      case 'acknowledge': {
        if (!providerAddress) {
          return NextResponse.json({
            success: false,
            error: 'Provider address is required',
          }, { status: 400 });
        }

        const tx = await brokerInstance.inference.acknowledgeProviderSigner(
          providerAddress
        );

        return NextResponse.json({
          success: true,
          transaction: tx,
          providerAddress,
        });
      }

      case 'addFunds':
      case 'createAccount': {
        const amount = body.amount || 1;
        // depositFund adds to an existing ledger; addLedger creates a new one.
        // Account already exists, so always use depositFund.
        try {
          await brokerInstance.ledger.depositFund(amount);
        } catch (depositErr) {
          // If depositFund fails because the account doesn't exist yet, create it.
          if (depositErr?.message?.includes('not exist') || depositErr?.message?.includes('not found')) {
            await brokerInstance.ledger.addLedger(amount);
          } else {
            throw depositErr;
          }
        }

        return NextResponse.json({
          success: true,
          amount,
          message: `Successfully deposited ${amount} OG into AI compute ledger.`,
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ 0G Compute API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      details: error.stack,
    }, { status: 500 });
  }
}

