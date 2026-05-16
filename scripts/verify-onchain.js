const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🔍 Verifying CasinoEntropyConsumer on the connected Hardhat network...");

  const contractAddress =
    process.env.NEXT_PUBLIC_CASINO_ENTROPY_CONTRACT ||
    process.env.VERIFY_ENTROPY_CONSUMER_ADDRESS;

  if (!contractAddress) {
    console.error(
      "❌ Set NEXT_PUBLIC_CASINO_ENTROPY_CONTRACT or VERIFY_ENTROPY_CONSUMER_ADDRESS in .env"
    );
    process.exit(1);
  }

  const net = await ethers.provider.getNetwork();

  try {
    const CasinoEntropyConsumer = await ethers.getContractFactory("CasinoEntropyConsumer");
    const contract = CasinoEntropyConsumer.attach(contractAddress);

    console.log("✅ Contract loaded");
    console.log("Address:", contractAddress);

    const contractInfo = await contract.getContractInfo();
    console.log("\n📋 getContractInfo:", {
      contractAddress: contractInfo.contractAddress,
      treasuryAddress: contractInfo.treasuryAddress,
      totalRequests: contractInfo.totalRequests.toString(),
      totalFulfilled: contractInfo.totalFulfilled.toString(),
      contractBalance: ethers.formatEther(contractInfo.contractBalance),
    });

    const allRequestIds = await contract.getAllRequestIds();
    console.log("\n📝 getAllRequestIds count:", allRequestIds.length);

    const gameStats = await contract.getGameTypeStats();
    console.log("📊 getGameTypeStats:", {
      gameTypes: gameStats.gameTypes.map((g) => g.toString()),
      requestCounts: gameStats.requestCounts.map((c) => c.toString()),
      fulfilledCounts: gameStats.fulfilledCounts.map((c) => c.toString()),
    });

    const testRandom = ethers.keccak256(ethers.toUtf8Bytes("verify_commitment"));
    const commitment = await contract.generateCommitment(testRandom);
    const valid = await contract.verifyCommitment(commitment, testRandom);
    console.log("\n🔐 Commitment helpers:", { valid });

    console.log("\n🎉 Read-only verification complete");
    console.log("- Hardhat network:", hre.network.name);
    console.log("- Chain ID:", net.chainId.toString());
    console.log(
      "\nNote: entropy request() is onlyTreasury; live requests need the treasury key on this chain."
    );
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });
