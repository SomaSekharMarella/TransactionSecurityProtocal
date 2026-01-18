/**
 * VehicleTrustRegistry Interaction Snippets
 * 
 * JavaScript functions to interact with VehicleTrustRegistry.sol
 * These functions should be integrated into the frontend app.js
 */

const { ethers } = require("ethers");

// Contract ABI (extract from compiled contract artifacts)
const VEHICLE_TRUST_REGISTRY_ABI = [
    "function isVehicleRegistered(string memory publicKeyHex) external view returns (bool)",
    "function getTrustScore(string memory publicKeyHex) external view returns (uint256)",
    "function registerVehicle(string memory publicKeyHex, address ethereumAddress) external",
    "function selfRegisterVehicle(string memory publicKeyHex) external",
    "function isTrustworthy(string memory publicKeyHex) external view returns (bool)",
    "function canSubmitTransaction(string memory publicKeyHex) external view returns (bool)",
    "function getRemainingCooldown(string memory publicKeyHex) external view returns (uint256)",
    "function getVehicle(string memory publicKeyHex) external view returns (string memory, address, uint256, bool, uint256, uint256, uint256, uint256)",
    "function isRevoked(string memory publicKeyHex) external view returns (bool)"
];

/**
 * Check if a vehicle is registered
 * @param {string} vehicleTrustRegistryAddress - Contract address
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} publicKeyHex - ECC public key (66 hex chars)
 * @returns {Promise<boolean>} True if registered
 */
async function isVehicleRegistered(vehicleTrustRegistryAddress, provider, publicKeyHex) {
    try {
        const contract = new ethers.Contract(
            vehicleTrustRegistryAddress,
            VEHICLE_TRUST_REGISTRY_ABI,
            provider
        );
        return await contract.isVehicleRegistered(publicKeyHex);
    } catch (error) {
        console.error("Error checking vehicle registration:", error);
        return false;
    }
}

/**
 * Get trust score of a vehicle
 * @param {string} vehicleTrustRegistryAddress - Contract address
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} publicKeyHex - ECC public key (66 hex chars)
 * @returns {Promise<number>} Trust score (0 if not registered)
 */
async function getTrustScore(vehicleTrustRegistryAddress, provider, publicKeyHex) {
    try {
        const contract = new ethers.Contract(
            vehicleTrustRegistryAddress,
            VEHICLE_TRUST_REGISTRY_ABI,
            provider
        );
        const score = await contract.getTrustScore(publicKeyHex);
        return score.toNumber();
    } catch (error) {
        console.error("Error getting trust score:", error);
        return 0;
    }
}

/**
 * Register a vehicle (self-registration)
 * @param {string} vehicleTrustRegistryAddress - Contract address
 * @param {ethers.Signer} signer - MetaMask signer
 * @param {string} publicKeyHex - ECC public key (66 hex chars)
 * @returns {Promise<ethers.ContractTransaction>} Transaction object
 */
async function registerVehicle(vehicleTrustRegistryAddress, signer, publicKeyHex) {
    try {
        const contract = new ethers.Contract(
            vehicleTrustRegistryAddress,
            VEHICLE_TRUST_REGISTRY_ABI,
            signer
        );
        
        // Validate public key format (66 hex chars)
        if (publicKeyHex.length !== 66 || !/^[0-9a-fA-F]+$/.test(publicKeyHex)) {
            throw new Error("Invalid public key format. Must be 66 hex characters.");
        }
        
        // Check if already registered
        const isRegistered = await contract.isVehicleRegistered(publicKeyHex);
        if (isRegistered) {
            console.log("Vehicle already registered");
            return null;
        }
        
        // Self-register vehicle
        const tx = await contract.selfRegisterVehicle(publicKeyHex);
        console.log("Registration transaction submitted:", tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log("Vehicle registered successfully in block:", receipt.blockNumber);
        
        return tx;
    } catch (error) {
        console.error("Error registering vehicle:", error);
        if (error.message.includes("Sybil attack detected")) {
            throw new Error("Sybil attack detected: This Ethereum address is already registered with a different public key.");
        }
        throw error;
    }
}

/**
 * Check if vehicle is trustworthy (registered, not revoked, trust >= 50)
 * @param {string} vehicleTrustRegistryAddress - Contract address
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} publicKeyHex - ECC public key (66 hex chars)
 * @returns {Promise<boolean>} True if trustworthy
 */
async function isTrustworthy(vehicleTrustRegistryAddress, provider, publicKeyHex) {
    try {
        const contract = new ethers.Contract(
            vehicleTrustRegistryAddress,
            VEHICLE_TRUST_REGISTRY_ABI,
            provider
        );
        return await contract.isTrustworthy(publicKeyHex);
    } catch (error) {
        console.error("Error checking trustworthiness:", error);
        return false;
    }
}

/**
 * Check if vehicle can submit transaction (DoS protection - 10-second cooldown)
 * @param {string} vehicleTrustRegistryAddress - Contract address
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} publicKeyHex - ECC public key (66 hex chars)
 * @returns {Promise<boolean>} True if cooldown passed
 */
async function canSubmitTransaction(vehicleTrustRegistryAddress, provider, publicKeyHex) {
    try {
        const contract = new ethers.Contract(
            vehicleTrustRegistryAddress,
            VEHICLE_TRUST_REGISTRY_ABI,
            provider
        );
        return await contract.canSubmitTransaction(publicKeyHex);
    } catch (error) {
        console.error("Error checking cooldown:", error);
        return false;
    }
}

/**
 * Get remaining cooldown time for a vehicle
 * @param {string} vehicleTrustRegistryAddress - Contract address
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} publicKeyHex - ECC public key (66 hex chars)
 * @returns {Promise<number>} Remaining cooldown in seconds (0 if ready)
 */
async function getRemainingCooldown(vehicleTrustRegistryAddress, provider, publicKeyHex) {
    try {
        const contract = new ethers.Contract(
            vehicleTrustRegistryAddress,
            VEHICLE_TRUST_REGISTRY_ABI,
            provider
        );
        const remaining = await contract.getRemainingCooldown(publicKeyHex);
        return remaining.toNumber();
    } catch (error) {
        console.error("Error getting cooldown:", error);
        return 0;
    }
}

/**
 * Get complete vehicle information
 * @param {string} vehicleTrustRegistryAddress - Contract address
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} publicKeyHex - ECC public key (66 hex chars)
 * @returns {Promise<Object>} Vehicle information object
 */
async function getVehicleInfo(vehicleTrustRegistryAddress, provider, publicKeyHex) {
    try {
        const contract = new ethers.Contract(
            vehicleTrustRegistryAddress,
            VEHICLE_TRUST_REGISTRY_ABI,
            provider
        );
        const [
            publicKey,
            ethereumAddress,
            trustScore,
            revoked,
            registrationTime,
            successfulTransactions,
            failedTransactions,
            suspiciousActivities
        ] = await contract.getVehicle(publicKeyHex);
        
        return {
            publicKey,
            ethereumAddress,
            trustScore: trustScore.toNumber(),
            revoked,
            registrationTime: registrationTime.toNumber(),
            successfulTransactions: successfulTransactions.toNumber(),
            failedTransactions: failedTransactions.toNumber(),
            suspiciousActivities: suspiciousActivities.toNumber()
        };
    } catch (error) {
        console.error("Error getting vehicle info:", error);
        return null;
    }
}

/**
 * Check if vehicle is revoked
 * @param {string} vehicleTrustRegistryAddress - Contract address
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} publicKeyHex - ECC public key (66 hex chars)
 * @returns {Promise<boolean>} True if revoked
 */
async function isRevoked(vehicleTrustRegistryAddress, provider, publicKeyHex) {
    try {
        const contract = new ethers.Contract(
            vehicleTrustRegistryAddress,
            VEHICLE_TRUST_REGISTRY_ABI,
            provider
        );
        return await contract.isRevoked(publicKeyHex);
    } catch (error) {
        console.error("Error checking revocation:", error);
        return false;
    }
}

// Export functions for use in frontend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isVehicleRegistered,
        getTrustScore,
        registerVehicle,
        isTrustworthy,
        canSubmitTransaction,
        getRemainingCooldown,
        getVehicleInfo,
        isRevoked,
        VEHICLE_TRUST_REGISTRY_ABI
    };
}

// Example usage in frontend app.js:
/*
// In your frontend app.js configuration:
const CONFIG = {
    VEHICLE_TRUST_REGISTRY_ADDRESS: "0x...", // Add this address
    // ... other config
};

// Check vehicle registration before submitting transaction:
async function checkVehicleRegistration(publicKeyHex) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const isRegistered = await isVehicleRegistered(
        CONFIG.VEHICLE_TRUST_REGISTRY_ADDRESS,
        provider,
        publicKeyHex
    );
    
    if (!isRegistered) {
        // Auto-register if not registered
        const signer = provider.getSigner();
        await registerVehicle(
            CONFIG.VEHICLE_TRUST_REGISTRY_ADDRESS,
            signer,
            publicKeyHex
        );
    }
}

// Check trust score and cooldown before transaction:
async function validateVehicleForTransaction(publicKeyHex) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Check registration
    const registered = await isVehicleRegistered(
        CONFIG.VEHICLE_TRUST_REGISTRY_ADDRESS,
        provider,
        publicKeyHex
    );
    if (!registered) {
        throw new Error("Vehicle not registered");
    }
    
    // Check trust score
    const trustworthy = await isTrustworthy(
        CONFIG.VEHICLE_TRUST_REGISTRY_ADDRESS,
        provider,
        publicKeyHex
    );
    if (!trustworthy) {
        const score = await getTrustScore(
            CONFIG.VEHICLE_TRUST_REGISTRY_ADDRESS,
            provider,
            publicKeyHex
        );
        throw new Error(`Trust score too low: ${score} (minimum: 50)`);
    }
    
    // Check cooldown
    const canSubmit = await canSubmitTransaction(
        CONFIG.VEHICLE_TRUST_REGISTRY_ADDRESS,
        provider,
        publicKeyHex
    );
    if (!canSubmit) {
        const remaining = await getRemainingCooldown(
            CONFIG.VEHICLE_TRUST_REGISTRY_ADDRESS,
            provider,
            publicKeyHex
        );
        throw new Error(`Cooldown active: Please wait ${remaining} more seconds`);
    }
    
    return true;
}
*/
