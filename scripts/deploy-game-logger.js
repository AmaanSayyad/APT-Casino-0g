const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Deploying GameLogger contract to 0G Network...');
  
  // Get the contract factory
  const GameLogger = await ethers.getContractFactory('GameLogger');
  
  // Deploy the contract
  console.log('📦 Deploying contract...');
  const gameLogger = await GameLogger.deploy();
  
  // Wait for deployment
  await gameLogger.waitForDeployment();
  
  const contractAddress = await gameLogger.getAddress();
  console.log('✅ GameLogger deployed to:', contractAddress);
  
  // Get deployment transaction
  const deployTx = gameLogger.deploymentTransaction();
  console.log('📋 Deployment transaction:', deployTx.hash);
  
  // Wait for a few confirmations
  console.log('⏳ Waiting for confirmations...');
  await deployTx.wait(2);
  
  // Get contract info
  const [owner, deployedBlock, currentBlock, totalLogs] = await gameLogger.getContractInfo();
  console.log('📊 Contract Info:');
  console.log('  Owner:', owner);
  console.log('  Current Block:', currentBlock.toString());
  console.log('  Total Logs:', totalLogs.toString());
  
  // Test logging a game
  console.log('🧪 Testing game logging...');
  const testTx = await gameLogger.logGame(
    'test_game_1',
    'ROULETTE',
    owner, // Use deployer as test user
    ethers.parseEther('0.001'), // 0.001 OG bet
    ethers.parseEther('0.002'), // 0.002 OG payout
    true, // isWin
    '{"betType":"straight","number":17}', // gameConfig
    '{"winningNumber":17,"color":"black"}', // resultData
    '{"requestId":"0x123","transactionHash":"0x456"}' // entropyProof
  );
  
  await testTx.wait();
  console.log('✅ Test game logged successfully!');
  
  // Get updated stats
  const [newTotalLogs, totalGasUsed, lastLogger, avgGas] = await gameLogger.getLoggerStats();
  console.log('📈 Updated Stats:');
  console.log('  Total Logs:', newTotalLogs.toString());
  console.log('  Total Gas Used:', totalGasUsed.toString());
  console.log('  Average Gas per Log:', avgGas.toString());
  console.log('  Last Logger:', lastLogger);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deploymentTx: deployTx.hash,
    owner: owner,
    network: '0g-galileo-testnet',
    deployedAt: new Date().toISOString(),
    abi: GameLogger.interface.formatJson()
  };
  
  console.log('\n🎯 Deployment Summary:');
  console.log('Contract Address:', contractAddress);
  console.log('Network: 0G Galileo Testnet');
  console.log('Explorer:', `https://chainscan-galileo.0g.ai/address/${contractAddress}`);
  
  return deploymentInfo;
}

main()
  .then((info) => {
    console.log('\n✅ Deployment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });