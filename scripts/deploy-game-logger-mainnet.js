const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  if (chainId !== 16661) {
    throw new Error(`Expected 0G Mainnet (16661), got chain ${chainId}`);
  }

  console.log('Deployer:', deployer.address);
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), '0G');

  const GameLogger = await ethers.getContractFactory('GameLogger');
  const gameLogger = await GameLogger.deploy();
  await gameLogger.waitForDeployment();

  const contractAddress = await gameLogger.getAddress();
  const deployTx = gameLogger.deploymentTransaction();
  const deployReceipt = await deployTx.wait(1);

  console.log('GameLogger:', contractAddress);
  console.log('Deploy tx:', deployTx.hash);

  const proofId = `wave3_mainnet_${Date.now()}`;
  const logTx = await gameLogger.logGame(
    proofId,
    'WAVE3_PROOF',
    deployer.address,
    ethers.parseEther('0.001'),
    ethers.parseEther('0.002'),
    true,
    JSON.stringify({ source: '0G Bridge Wave 3', project: 'APT-Casino' }),
    JSON.stringify({ note: 'Mainnet integration proof' }),
    JSON.stringify({ program: '0G Bridge by AKINDO', wave: 3 })
  );
  const logReceipt = await logTx.wait(1);

  const deployment = {
    contractAddress,
    deploymentTx: deployTx.hash,
    proofTx: logTx.hash,
    proofGameId: proofId,
    owner: deployer.address,
    chainId,
    network: '0g-mainnet',
    explorer: {
      contract: `https://chainscan.0g.ai/address/${contractAddress}`,
      deployTx: `https://chainscan.0g.ai/tx/${deployTx.hash}`,
      proofTx: `https://chainscan.0g.ai/tx/${logTx.hash}`,
    },
    blocks: {
      deploy: deployReceipt.blockNumber,
      proof: logReceipt.blockNumber,
    },
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `game-logger-0g-mainnet.json`);
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));

  console.log(JSON.stringify(deployment, null, 2));
  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
