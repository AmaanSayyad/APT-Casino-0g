require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { ethers } = require('hardhat');

async function testEntropyIntegration() {
  console.log('🧪 Testing Pyth Entropy Integration (oracle / settlement RPC)...');

  try {
    const oracleRpc =
      process.env.NEXT_PUBLIC_ORACLE_RPC_URL ||
      'https://sepolia-rollup.arbitrum.io/rpc';
    const provider = new ethers.JsonRpcProvider(oracleRpc);
    console.log('✅ Provider connected');

    const pythEntropyAddress =
      process.env.NEXT_PUBLIC_PYTH_ENTROPY_CONTRACT ||
      '0x549ebba8036ab746611b4ffa1423eb0a4df61440';
    const pythProviderAddress =
      process.env.NEXT_PUBLIC_PYTH_ENTROPY_PROVIDER ||
      '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344';

    const txExplorerBase =
      (process.env.NEXT_PUBLIC_ORACLE_TX_EXPLORER || 'https://sepolia.arbiscan.io').replace(/\/$/, '');
    const entropyExplorer = (process.env.NEXT_PUBLIC_ENTROPY_EXPLORER_URL || 'https://entropy-explorer.pyth.network').replace(/\/$/, '');
    
    console.log(`🔍 Pyth Entropy Contract: ${pythEntropyAddress}`);
    console.log(`🔍 Pyth Provider: ${pythProviderAddress}`);
    
    // Create contract instance
    const contractABI = [
      "function requestV2(uint32 gasLimit) external payable returns (uint64)",
      "function getRandomValue(bytes32 requestId) external view returns (bytes32)",
      "function isRequestFulfilled(bytes32 requestId) external view returns (bool)",
      "function getRequest(bytes32 requestId) external view returns (bool, bytes32, uint64, uint256)",
      "function getFeeV2(uint32 gasLimit) external view returns (uint256)",
      "function getFeeV2() external view returns (uint256)",
      "function getProvider() external view returns (address)",
      "event RandomnessRequested(bytes32 indexed requestId, address indexed provider, bytes32 userRandomNumber, uint64 sequenceNumber, address requester)",
      "event RandomnessFulfilled(bytes32 indexed requestId, bytes32 randomValue)"
    ];
    
    const contract = new ethers.Contract(pythEntropyAddress, contractABI, provider);
    console.log('✅ Contract instance created');
    
    // Test basic contract methods
    try {
      const fee = await contract.getFeeV2(200000);
      console.log(`✅ Fee for 200k gas: ${ethers.formatEther(fee)} ETH`);
    } catch (error) {
      console.error('❌ Failed to get fee:', error.message);
    }
    
    // Check if we have a wallet to sign transactions
    const privateKey = process.env.TREASURY_PRIVATE_KEY;
    if (!privateKey) {
      console.log('⚠️ No private key found, cannot test transaction');
      return;
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`✅ Wallet address: ${wallet.address}`);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther("0.001")) {
      console.log('⚠️ Insufficient balance for testing');
      return;
    }
    
    // Create contract with signer
    const contractWithSigner = contract.connect(wallet);
    
    // Test a small transaction
    console.log('🧪 Testing entropy request...');
    const customGasLimit = 200000;
    const fee = await contractWithSigner.getFeeV2(customGasLimit);
    console.log(`💰 Required fee: ${ethers.formatEther(fee)} ETH`);
    
    // Make the request
    const tx = await contractWithSigner.requestV2(customGasLimit, {
      value: fee,
      gasLimit: 500000
    });
    
    console.log(`📤 Transaction sent: ${tx.hash}`);
    console.log(`🔗 Tx explorer: ${txExplorerBase}/tx/${tx.hash}`);
    console.log(`🔗 Entropy explorer search: ${entropyExplorer}/?search=${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Extract request ID from logs
    const eventSignature = ethers.id("RandomnessRequested(bytes32,address,address,uint64)");
    const log = receipt.logs.find(log => log.topics[0] === eventSignature);
    
    if (log) {
      const requestId = log.topics[1];
      console.log(`🎯 Request ID: ${requestId}`);
      
      // Check if request is fulfilled
      const isFulfilled = await contract.isRequestFulfilled(requestId);
      console.log(`✅ Request fulfilled: ${isFulfilled}`);
      
      if (isFulfilled) {
        const randomValue = await contract.getRandomValue(requestId);
        console.log(`🎲 Random value: ${randomValue}`);
      }
    } else {
      console.log('⚠️ No RandomnessRequested event found in logs');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEntropyIntegration().catch(console.error);
