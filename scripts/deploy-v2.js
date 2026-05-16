const hre = require("hardhat");
const { ethers } = hre;

function resolvePythEntropyAddress(chainId) {
  const fromEnv = process.env.PYTH_ENTROPY_ADDRESS;
  if (fromEnv) return fromEnv;
  const id = Number(chainId);
  if (id === 421614) return "0x549ebba8036ab746611b4ffa1423eb0a4df61440";
  return null;
}

async function main() {
  console.log("🚀 Deploying CasinoEntropyConsumerV2...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const net = await ethers.provider.getNetwork();
  const networkName = hre.network.name;
  console.log("Network:", networkName, "Chain ID:", net.chainId);

  const pythEntropyAddress = resolvePythEntropyAddress(net.chainId);
  if (!pythEntropyAddress || pythEntropyAddress === "0x0000000000000000000000000000000000000000") {
    console.log("❌ Set PYTH_ENTROPY_ADDRESS in .env for this chain.");
    console.log("   Current chainId:", net.chainId.toString());
    return;
  }

  console.log("Pyth Entropy address:", pythEntropyAddress);

  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  console.log("Treasury address:", treasuryAddress);

  const pythProviderAddress =
    process.env.PYTH_PROVIDER_ADDRESS ||
    process.env.NEXT_PUBLIC_PYTH_ENTROPY_PROVIDER ||
    pythEntropyAddress;
  console.log("Pyth Provider address:", pythProviderAddress);

  const CasinoEntropyConsumerV2 = await ethers.getContractFactory("CasinoEntropyConsumerV2");
  const casinoContract = await CasinoEntropyConsumerV2.deploy(
    pythEntropyAddress,
    pythProviderAddress,
    treasuryAddress
  );

  await casinoContract.waitForDeployment();

  const contractAddress = await casinoContract.getAddress();
  console.log("✅ CasinoEntropyConsumerV2 deployed to:", contractAddress);

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

    console.log("🎲 Testing random entropy request...");
    const userRandomNumber = ethers.keccak256(ethers.toUtf8Bytes("test_seed_" + Date.now()));

    const tx = await casinoContract.request(
      userRandomNumber,
      { value: ethers.parseEther("0.001") }
    );

    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

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

  const fs = require('fs');
  const deploymentsDir = './deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${deploymentsDir}/casino-entropy-v2-${networkName}-${Date.now()}.json`;
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
