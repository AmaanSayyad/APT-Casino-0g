/**
 * 0G Compute Network API Route
 * Server-side API for 0G Compute Network operations
 */

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import OpenAI from 'openai';
import { TREASURY_CONFIG } from '../../../config/treasury.js';
import { 
  getCurrentNetworkConfig,
  DEFAULT_PROVIDER,
  OG_COMPUTE_PROVIDERS 
} from '../../../config/ogComputeNetwork.js';

// Initialize broker (singleton pattern)
let broker = null;
let isBrokerInitialized = false;

async function getBroker() {
  if (isBrokerInitialized && broker) {
    return broker;
  }

  try {
    const networkConfig = getCurrentNetworkConfig();
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    
    // Use treasury wallet for server-side operations
    const privateKey = TREASURY_CONFIG.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('TREASURY_PRIVATE_KEY not configured');
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    broker = await createZGComputeNetworkBroker(wallet);
    isBrokerInitialized = true;
    
    console.log('✅ 0G Compute broker initialized on server');
    return broker;
  } catch (error) {
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

    const brokerInstance = await getBroker();

    switch (action) {
      case 'balance':
        const account = await brokerInstance.ledger.getLedger();
        return NextResponse.json({
          success: true,
          balance: ethers.formatEther(account.totalBalance),
          raw: {
            totalBalance: account.totalBalance.toString(),
          },
        });

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
              error: `Insufficient balance. Current balance: ${balance.toFixed(4)} OG. Minimum required: ${MIN_BALANCE} OG. Please add funds first.`,
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

      case 'addFunds': {
        const amount = body.amount || 0.1;
        
        // addLedger creates account if it doesn't exist and adds funds
        const tx = await brokerInstance.ledger.addLedger(amount);

        return NextResponse.json({
          success: true,
          transaction: tx,
          amount,
          message: 'Funds added successfully. Account created if it did not exist.',
        });
      }
      
      case 'createAccount': {
        // Explicitly create account with initial deposit
        const amount = body.amount || 0.01;
        const tx = await brokerInstance.ledger.addLedger(amount);

        return NextResponse.json({
          success: true,
          transaction: tx,
          amount,
          message: 'Account created successfully.',
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

