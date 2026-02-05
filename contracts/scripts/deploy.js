require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function main() {
  const { PRIVATE_KEY, RPC_URL, PLATFORM_WALLET } = process.env;
  
  if (!PRIVATE_KEY) {
    console.error('[ERROR] PRIVATE_KEY required in .env');
    process.exit(1);
  }
  
  if (!PLATFORM_WALLET) {
    console.error('[ERROR] PLATFORM_WALLET required in .env (your wallet for fees)');
    process.exit(1);
  }

  // Get network from command line or default to hardhat
  const network = hre.network.name;
  console.log(`[Deploy] Deploying to ${network}...`);
  
  // Load contract artifact
  const artifactPath = path.join(__dirname, '../artifacts/contracts/BotMarket.sol/BotMarket.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Create contract factory
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    new ethers.Wallet(PRIVATE_KEY, new ethers.JsonRpcProvider(RPC_URL))
  );
  
  // Deploy with platform wallet
  const contract = await factory.deploy(PLATFORM_WALLET);
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log(`[Deploy] BotMarket deployed to: ${address}`);
  console.log(`[Deploy] Platform fee: ${await contract.PLATFORM_FEE_PERCENT()}%`);
  console.log(`[Deploy] Platform wallet: ${await contract.platformWallet()}`);
  
  // Save deployment info
  const deployment = {
    network,
    address,
    platformWallet: PLATFORM_WALLET,
    timestamp: Date.now()
  };
  
  fs.writeFileSync(
    path.join(__dirname, `../deployments/${network}.json`),
    JSON.stringify(deployment, null, 2)
  );
  
  console.log(`[Deploy] Saved to deployments/${network}.json`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[ERROR]', err);
    process.exit(1);
  });
