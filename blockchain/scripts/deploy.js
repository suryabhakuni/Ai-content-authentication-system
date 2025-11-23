const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  const networkName = hre.network.name;
  const chainId = network.chainId;

  console.log(`📡 Network: ${networkName}`);
  console.log(`🔗 Chain ID: ${chainId}\n`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);

  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Check if deployer has enough balance
  if (balance === 0n) {
    console.error("❌ Error: Deployer account has no ETH!");
    if (networkName === "sepolia") {
      console.log("💡 Get test ETH from: https://sepoliafaucet.com/");
    }
    process.exit(1);
  }

  // Deploy ContentVerification contract
  console.log("📝 Deploying ContentVerification contract...");
  const ContentVerification = await hre.ethers.getContractFactory(
    "ContentVerification"
  );
  const contentVerification = await ContentVerification.deploy();

  await contentVerification.waitForDeployment();
  const contractAddress = await contentVerification.getAddress();

  console.log(`✅ ContentVerification deployed to: ${contractAddress}\n`);

  // Save deployment information
  const deploymentInfo = {
    network: networkName,
    chainId: chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployerAddress,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to JSON file
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: deployments/${networkName}.json\n`);

  // Save contract ABI for frontend
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "ContentVerification.sol",
    "ContentVerification.json"
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiFile = path.join(deploymentsDir, "ContentVerification.abi.json");
    fs.writeFileSync(abiFile, JSON.stringify(artifact.abi, null, 2));
    console.log(
      `📄 Contract ABI saved to: deployments/ContentVerification.abi.json\n`
    );
  }

  // Display useful information
  console.log("📋 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Network:          ${networkName}`);
  console.log(`Chain ID:         ${chainId}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer:         ${deployerAddress}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Network-specific instructions
  if (networkName === "sepolia") {
    console.log("🔍 Verify your contract on Etherscan:");
    console.log(`https://sepolia.etherscan.io/address/${contractAddress}\n`);

    console.log("📝 To verify the contract source code, run:");
    console.log(`npx hardhat verify --network sepolia ${contractAddress}\n`);
  } else if (networkName === "mainnet") {
    console.log("🔍 View on Etherscan:");
    console.log(`https://etherscan.io/address/${contractAddress}\n`);

    console.log("📝 To verify the contract source code, run:");
    console.log(`npx hardhat verify --network mainnet ${contractAddress}\n`);
  } else if (networkName === "localhost" || networkName === "hardhat") {
    console.log("🏠 Local deployment successful!");
    console.log("💡 Contract is ready for testing on local network\n");
  }

  console.log("✨ Deployment complete!\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
