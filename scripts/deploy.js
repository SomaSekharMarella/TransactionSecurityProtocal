/**
 * Deployment Script
 * 
 * Deploys ValidatorRegistry and SecureLedger contracts
 * Registers initial validators for testing
 */

const hre = require("hardhat");
const { generateKeyPair } = require("../crypto/ecc");

async function main() {
    console.log("🚀 Starting deployment...\n");

    const [deployer, ...validators] = await hre.ethers.getSigners();
    
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
    console.log("\n");

    // Deploy ValidatorRegistry
    console.log("📝 Deploying ValidatorRegistry...");
    const ValidatorRegistry = await hre.ethers.getContractFactory("ValidatorRegistry");
    const validatorRegistry = await ValidatorRegistry.deploy();
    await validatorRegistry.waitForDeployment();
    const validatorRegistryAddress = await validatorRegistry.getAddress();
    console.log("✅ ValidatorRegistry deployed to:", validatorRegistryAddress);
    console.log("\n");

    // Deploy SecureLedger
    console.log("📝 Deploying SecureLedger...");
    const SecureLedger = await hre.ethers.getContractFactory("SecureLedger");
    const secureLedger = await SecureLedger.deploy(validatorRegistryAddress);
    await secureLedger.waitForDeployment();
    const secureLedgerAddress = await secureLedger.getAddress();
    console.log("✅ SecureLedger deployed to:", secureLedgerAddress);
    console.log("\n");

    // Register validators
    console.log("👥 Registering validators...");
    const validatorKeys = [];
    
    for (let i = 0; i < Math.min(validators.length, 5); i++) {
        const validator = validators[i];
        const keyPair = generateKeyPair();
        validatorKeys.push({
            address: validator.address,
            privateKey: keyPair.privateKeyHex,
            publicKey: keyPair.publicKeyHex
        });

        const tx = await validatorRegistry.registerValidator(
            validator.address,
            keyPair.publicKeyHex
        );
        await tx.wait();
        console.log(`✅ Registered validator ${i + 1}: ${validator.address}`);
        console.log(`   Public Key: ${keyPair.publicKeyHex.substring(0, 20)}...`);
    }
    console.log("\n");

    // Display deployment summary
    console.log("=".repeat(60));
    console.log("📊 DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("ValidatorRegistry:", validatorRegistryAddress);
    console.log("SecureLedger:", secureLedgerAddress);
    console.log("\nValidators registered:", validatorKeys.length);
    console.log("\nValidator Keys (for testing):");
    validatorKeys.forEach((vk, i) => {
        console.log(`\nValidator ${i + 1}:`);
        console.log(`  Address: ${vk.address}`);
        console.log(`  Private Key: ${vk.privateKey}`);
        console.log(`  Public Key: ${vk.publicKey}`);
    });
    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Deployment complete!");
    console.log("\n💡 Save these addresses for frontend configuration:");
    console.log(`   VALIDATOR_REGISTRY_ADDRESS="${validatorRegistryAddress}"`);
    console.log(`   SECURE_LEDGER_ADDRESS="${secureLedgerAddress}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

