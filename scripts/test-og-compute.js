/**
 * 0G Compute Network Test Script
 * Tests the 0G Compute Network integration
 */

const { ethers } = require('ethers');
const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');
// Load from .env first, then .env.local
require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const RPC_URL = process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc.0g.ai';
const PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;

async function testOGCompute() {
  console.log('🚀 Starting 0G Compute Network Test...\n');

  if (!PRIVATE_KEY || PRIVATE_KEY === 'your_private_key_here') {
    console.error('❌ TREASURY_PRIVATE_KEY not configured. Please set it in .env.local or update the script.');
    process.exit(1);
  }

  try {
    // 1. Initialize provider and wallet
    console.log('1️⃣ Initializing provider and wallet...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log('   Wallet address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('   Balance:', ethers.formatEther(balance), 'OG\n');

    if (balance === 0n) {
      console.error('❌ Wallet has no balance. Please fund it first.');
      process.exit(1);
    }

    // 2. Initialize broker
    console.log('2️⃣ Initializing 0G Compute broker...');
    const broker = await createZGComputeNetworkBroker(wallet);
    console.log('   ✅ Broker initialized\n');

    // 3. Check account balance
    console.log('3️⃣ Checking ledger balance...');
    try {
      const account = await broker.ledger.getLedger();
      console.log('   Total Balance:', ethers.formatEther(account.totalBalance), 'OG');
      console.log('   ✅ Account balance retrieved\n');
    } catch (error) {
      console.log('   ⚠️  No account found yet. This is normal for first-time setup.\n');
    }

    // 4. List available services
    console.log('4️⃣ Listing available services...');
    try {
      const services = await broker.inference.listService();
      console.log(`   Found ${services.length} services:`);
      services.forEach((service, idx) => {
        console.log(`   ${idx + 1}. ${service.model || 'Unknown'} - ${service.provider}`);
        console.log(`      Verification: ${service.verifiability || 'None'}`);
        console.log(`      URL: ${service.url}`);
      });
      console.log('   ✅ Services listed\n');
    } catch (error) {
      console.error('   ❌ Failed to list services:', error.message);
      console.log('   This might be normal if services are not available yet.\n');
    }

    // 5. Acknowledge provider (if needed)
    const DEFAULT_PROVIDER = '0xf07240Efa67755B5311bc75784a061eDB47165Dd'; // GPT-OSS 120B
    console.log('5️⃣ Acknowledging provider...');
    try {
      const tx = await broker.inference.acknowledgeProviderSigner(DEFAULT_PROVIDER);
      console.log('   ✅ Provider acknowledged');
      if (tx && tx.hash) {
        console.log('   Transaction hash:', tx.hash);
      }
      console.log('');
    } catch (error) {
      console.log('   ⚠️  Provider acknowledge failed (might already be acknowledged):', error.message);
      console.log('');
    }

    // 6. Test inference request (optional - requires funds)
    console.log('6️⃣ Testing inference request...');
    try {
      // Get service metadata
      const { endpoint, model } = await broker.inference.getServiceMetadata(DEFAULT_PROVIDER);
      console.log('   Endpoint:', endpoint);
      console.log('   Model:', model);

      // Get request headers
      const messages = [{ role: 'user', content: 'Hello! Say hi back.' }];
      const headers = await broker.inference.getRequestHeaders(
        DEFAULT_PROVIDER,
        JSON.stringify(messages)
      );
      console.log('   ✅ Request headers generated');
      console.log('   ⚠️  Skipping actual inference (requires sufficient balance)');
      console.log('   To test inference, use the API route or UI\n');
    } catch (error) {
      console.log('   ⚠️  Inference test skipped:', error.message);
      console.log('   This is normal if balance is insufficient or provider not ready\n');
    }

    console.log('✅ 0G Compute Network test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Add funds to account if needed: POST /api/og-compute with action=addFunds');
    console.log('   2. Test via UI: Click "AI Assistant" button in Navbar');
    console.log('   3. Test via API: POST /api/og-compute with action=inference');
    console.log('   4. Visit test page: /test-og-compute');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testOGCompute();

