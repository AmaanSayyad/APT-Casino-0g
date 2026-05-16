/**
 * Setup 0G Compute Network Account
 * Creates account and adds initial funds
 */

const { ethers } = require('ethers');
const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');
// Load from .env first, then .env.local
require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const RPC_URL = process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc.0g.ai';
const PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
const INITIAL_AMOUNT = process.argv[2] || '0.1'; // Amount in OG tokens

async function setupAccount() {
  console.log('🚀 Setting up 0G Compute Network Account...\n');

  try {
    // Initialize provider and wallet
    console.log('1️⃣ Initializing wallet...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log('   Address:', wallet.address);
    
    const balance = await provider.getBalance(wallet.address);
    console.log('   Balance:', ethers.formatEther(balance), 'OG');
    
    if (balance === 0n) {
      console.error('❌ Wallet has no balance. Please fund it first.');
      process.exit(1);
    }

    // Initialize broker
    console.log('\n2️⃣ Initializing broker...');
    const broker = await createZGComputeNetworkBroker(wallet);
    console.log('   ✅ Broker initialized');

    // Check if account exists
    console.log('\n3️⃣ Checking account status...');
    try {
      const account = await broker.ledger.getLedger();
      console.log('   ✅ Account exists');
      console.log('   Current balance:', ethers.formatEther(account.totalBalance), 'OG');
    } catch (error) {
      console.log('   ℹ️  Account does not exist yet. Will create it.');
    }

    // Create account and add funds
    console.log(`\n4️⃣ Creating account and adding ${INITIAL_AMOUNT} OG...`);
    const amount = parseFloat(INITIAL_AMOUNT);
    const tx = await broker.ledger.addLedger(amount);
    
    console.log('   ✅ Transaction sent!');
    if (tx && tx.hash) {
      console.log('   Transaction hash:', tx.hash);
      console.log('   Waiting for confirmation...');
      
      // Wait for transaction confirmation
      if (tx.wait) {
        const receipt = await tx.wait();
        console.log('   ✅ Transaction confirmed in block:', receipt.blockNumber);
      }
    }

    // Verify account
    console.log('\n5️⃣ Verifying account...');
    const account = await broker.ledger.getLedger();
    console.log('   ✅ Account verified');
    console.log('   Total balance:', ethers.formatEther(account.totalBalance), 'OG');

    // Acknowledge default provider
    console.log('\n6️⃣ Acknowledging default provider...');
    const DEFAULT_PROVIDER = '0xf07240Efa67755B5311bc75784a061eDB47165Dd';
    try {
      const ackTx = await broker.inference.acknowledgeProviderSigner(DEFAULT_PROVIDER);
      console.log('   ✅ Provider acknowledged');
      if (ackTx && ackTx.hash) {
        console.log('   Transaction hash:', ackTx.hash);
      }
    } catch (error) {
      console.log('   ⚠️  Provider acknowledge failed:', error.message);
      console.log('   This might be normal if already acknowledged.');
    }

    console.log('\n✅ Account setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   - Test via UI: Click "AI Assistant" button in Navbar');
    console.log('   - Test via API: POST /api/og-compute with action=inference');
    console.log('   - Visit test page: /test-og-compute');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

setupAccount();

