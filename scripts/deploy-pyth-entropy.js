const hre = require("hardhat");
const { ethers } = hre;

/**
 * Pyth Entropy consumer must be deployed on the same chain as the Entropy contract.
 * Set PYTH_ENTROPY_ADDRESS (and optionally PYTH_PROVIDER_ADDRESS) in .env for 0G and other networks.
 */
function resolvePythEntropyAddress(chainId) {
  const fromEnv = process.env.PYTH_ENTROPY_ADDRESS;
  if (fromEnv) return fromEnv;
  const id = Number(chainId);
  // Historical Pyth Entropy deployment — only valid when Hardhat network chainId matches.
  if (id === 421614) return "0x549ebba8036ab746611b4ffa1423eb0a4df61440";
  return null;
}

async function main() {
  console.log("🚀 Deploying Pyth Entropy Casino Contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const net = await ethers.provider.getNetwork();
  const networkName = hre.network.name;
  console.log("Network:", networkName, "Chain ID:", net.chainId);

  const pythEntropyAddress = resolvePythEntropyAddress(net.chainId);
  if (!pythEntropyAddress || pythEntropyAddress === "0x0000000000000000000000000000000000000000") {
    console.log("❌ Set PYTH_ENTROPY_ADDRESS in .env for this chain, or use a network whose chainId matches your Entropy deployment.");
    console.log("   Current chainId:", net.chainId.toString());
    return;
  }

  console.log("Pyth Entropy address:", pythEntropyAddress);

  // Treasury address from config
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  console.log("Treasury address:", treasuryAddress);

  const pythProviderAddress =
    process.env.PYTH_PROVIDER_ADDRESS ||
    process.env.NEXT_PUBLIC_PYTH_ENTROPY_PROVIDER ||
    pythEntropyAddress;
  console.log("Pyth Provider address:", pythProviderAddress);

  // Deploy the contract
  const CasinoEntropyConsumer = await ethers.getContractFactory("CasinoEntropyConsumer");
  const casinoContract = await CasinoEntropyConsumer.deploy(
    pythEntropyAddress,
    pythProviderAddress,
    treasuryAddress
  );

  await casinoContract.waitForDeployment();

  const contractAddress = await casinoContract.getAddress();
  console.log("✅ CasinoEntropyConsumer deployed to:", contractAddress);

  // Verify the contract
  console.log("🔍 Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [pythEntropyAddress, pythProviderAddress, treasuryAddress],
    });
    console.log("✅ Contract verified on Etherscan");
  } catch (error) {
    console.log("⚠️ Contract verification failed:", error.message);
  }

  // Test the contract
  console.log("🧪 Testing contract...");
  try {
    const contractInfo = await casinoContract.getContractInfo();
    console.log("Contract Info:", {
      contractAddress: contractInfo.contractAddress,
      treasuryAddress: contractInfo.treasuryAddress,
      totalRequests: contractInfo.totalRequests.toString(),
      totalFulfilled: contractInfo.totalFulfilled.toString(),
      contractBalance: ethers.formatEther(contractInfo.contractBalance),
    });

    // Test requesting random entropy
    console.log("🎲 Testing random entropy request...");
    const userRandomNumber = ethers.keccak256(ethers.toUtf8Bytes("test_seed_" + Date.now()));
    
    const tx = await casinoContract.request(
      userRandomNumber,
      { value: ethers.parseEther("0.001") }
    );
    
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Get the request ID from events
    const event = receipt.logs.find(log => {
      try {
        const parsed = casinoContract.interface.parseLog(log);
        return parsed.name === 'EntropyRequested';
      } catch (e) {
        return false;
      }
    });

    if (event) {
      const parsedEvent = casinoContract.interface.parseLog(event);
      const requestId = parsedEvent.args.requestId;
      console.log("Request ID:", requestId);
      
      // Check request status
      const requestStatus = await casinoContract.getRequest(requestId);
      console.log("Request Status:", {
        requester: requestStatus.requester,
        gameType: requestStatus.gameType,
        gameSubType: requestStatus.gameSubType,
        fulfilled: requestStatus.fulfilled,
        timestamp: new Date(Number(requestStatus.timestamp) * 1000).toISOString(),
        sequenceNumber: requestStatus.sequenceNumber.toString(),
      });
    }

    console.log("✅ Contract test completed successfully!");
  } catch (error) {
    console.log("❌ Contract test failed:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: net.chainId.toString(),
    contractAddress: contractAddress,
    pythEntropyAddress: pythEntropyAddress,
    treasuryAddress: treasuryAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: casinoContract.deploymentTransaction()?.hash,
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require('fs');
  const deploymentsDir = './deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const filename = `${deploymentsDir}/casino-entropy-${networkName}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", filename);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", networkName);
  console.log("Chain ID:", net.chainId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
