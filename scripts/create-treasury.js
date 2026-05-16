const { ethers } = require('ethers');

// Generate a new random wallet for the casino treasury
const treasuryWallet = ethers.Wallet.createRandom();

console.log('🎰 Casino Treasury Wallet Created!');
console.log('=====================================');
console.log('Address:', treasuryWallet.address);
console.log('Private Key:', treasuryWallet.privateKey);
console.log('Mnemonic:', treasuryWallet.mnemonic.phrase);
console.log('=====================================');
console.log('');
console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('1. Save this private key securely');
console.log('2. Never share or commit it to git');
console.log('3. Use only for development/testing');
console.log('4. Fund this wallet with native 0G (Galileo / mainnet) for deployment and fees');
console.log('');
console.log('🔗 Explorer: https://chainscan.0g.ai');
console.log('');
console.log('📝 Next steps:');
console.log('1. Copy the address above');
console.log('2. Fund via your usual 0G testnet faucet or bridge');
console.log('3. Set TREASURY_ADDRESS (and TREASURY_PRIVATE_KEY) in .env');
console.log('4. Deploy contracts with npm run deploy:*');
console.log('5. Test deposit/withdraw for your game flow');
