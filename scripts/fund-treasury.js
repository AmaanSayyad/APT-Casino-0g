/**
 * Fund the treasury wallet on 0G EVM (native OG).
 * Requires TREASURY_PRIVATE_KEY. Optional FUNDER_PRIVATE_KEY sends OG when balance is low.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { ethers } = require('ethers');

const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
const OG_RPC =
  process.env.NEXT_PUBLIC_0G_MAINNET_RPC ||
  process.env.NEXT_PUBLIC_0G_GALILEO_RPC ||
  'https://evmrpc.0g.ai';

async function fundTreasury() {
  try {
    if (!TREASURY_PRIVATE_KEY) {
      console.error('❌ Set TREASURY_PRIVATE_KEY in .env');
      process.exit(1);
    }

    console.log('🏦 0G treasury funding check');
    const provider = new ethers.JsonRpcProvider(OG_RPC);
    const treasuryWallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);
    console.log('📍 Treasury:', treasuryWallet.address);
    console.log('🌐 RPC:', OG_RPC);

    const currentBalance = await provider.getBalance(treasuryWallet.address);
    const minRequired = ethers.parseEther(process.env.MIN_TREASURY_BALANCE_OG || '0.01');
    console.log(`💰 Balance: ${ethers.formatEther(currentBalance)} OG`);

    if (currentBalance >= minRequired) {
      console.log('✅ Treasury already meets minimum balance');
      return;
    }

    console.log(`⚠️ Below minimum (${ethers.formatEther(minRequired)} OG). Fund this address manually or set FUNDER_PRIVATE_KEY.`);

    if (process.env.FUNDER_PRIVATE_KEY) {
      const funder = new ethers.Wallet(process.env.FUNDER_PRIVATE_KEY, provider);
      const funderBal = await provider.getBalance(funder.address);
      const shortfall = minRequired - currentBalance;
      if (funderBal < shortfall + ethers.parseEther('0.001')) {
        console.error('❌ Funder balance too low');
        return;
      }
      console.log(`📤 Sending ${ethers.formatEther(shortfall)} OG from funder...`);
      const tx = await funder.sendTransaction({ to: treasuryWallet.address, value: shortfall });
      await tx.wait();
      console.log('✅ Funded. TX:', tx.hash);
    }
  } catch (e) {
    console.error('❌ Error:', e.message || e);
    process.exit(1);
  }
}

fundTreasury();
