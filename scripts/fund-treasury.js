const { AptosAccount, AptosClient, FaucetClient } = require('aptos');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const APTOS_NODE_URL = process.env.NEXT_PUBLIC_APTOS_NETWORK === 'mainnet' 
  ? 'https://fullnode.mainnet.aptoslabs.com/v1'
  : 'https://fullnode.testnet.aptoslabs.com/v1';

const FAUCET_URL = 'https://faucet.testnet.aptoslabs.com';

async function fundTreasury() {
  try {
    console.log('🏦 Funding Treasury Wallet...');
    
    const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
    if (!TREASURY_PRIVATE_KEY) {
      throw new Error('TREASURY_PRIVATE_KEY is required');
    }
    
    console.log('🔑 Private key found:', TREASURY_PRIVATE_KEY.slice(0, 10) + '...');
    
    // Create treasury account from private key
    const treasuryAccount = new AptosAccount(
      new Uint8Array(Buffer.from(TREASURY_PRIVATE_KEY.slice(2), 'hex'))
    );
    
    console.log('📍 Treasury Address:', treasuryAccount.address().hex());
    
    const client = new AptosClient(APTOS_NODE_URL);
    const faucetClient = new FaucetClient(APTOS_NODE_URL, FAUCET_URL);
    
    // Check current balance
    const resources = await client.getAccountResources(treasuryAccount.address());
    const aptCoinResource = resources.find(r => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
    const currentBalance = aptCoinResource ? parseInt(aptCoinResource.data.coin.value) : 0;
    
    console.log('💰 Current Balance:', (currentBalance / 100000000).toFixed(4), 'APT');
    
    if (process.env.NEXT_PUBLIC_APTOS_NETWORK === 'testnet') {
      // Fund from faucet (testnet only)
      console.log('🚰 Requesting funds from faucet...');
      await faucetClient.fundAccount(treasuryAccount.address(), 100000000); // 1 APT
      
      // Check new balance
      const newResources = await client.getAccountResources(treasuryAccount.address());
      const newAptCoinResource = newResources.find(r => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
      const newBalance = newAptCoinResource ? parseInt(newAptCoinResource.data.coin.value) : 0;
      
      console.log('✅ New Balance:', (newBalance / 100000000).toFixed(4), 'APT');
      console.log('🎉 Treasury funded successfully!');
    } else {
      console.log('⚠️  Mainnet detected. Please fund the treasury manually.');
      console.log('📍 Send APT to:', treasuryAccount.address().hex());
    }
    
  } catch (error) {
    console.error('❌ Error funding treasury:', error);
  }
}

fundTreasury();