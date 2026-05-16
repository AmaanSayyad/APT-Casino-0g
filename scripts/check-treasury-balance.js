const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Treasury / deployer balances (current Hardhat network)");

  const [signer] = await ethers.getSigners();
  const treasury = process.env.TREASURY_ADDRESS?.trim();

  console.log("Deployer:", signer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await signer.provider.getBalance(signer.address)),
    "native"
  );

  if (treasury) {
    const bal = await signer.provider.getBalance(treasury);
    console.log("TREASURY_ADDRESS:", treasury);
    console.log("Treasury balance:", ethers.formatEther(bal), "native");
  } else {
    console.log("(Set TREASURY_ADDRESS in .env to print treasury balance.)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
