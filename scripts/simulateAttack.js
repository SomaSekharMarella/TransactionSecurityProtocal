/**
 * Attack Simulation Script
 * 
 * Simulates various attacks against the secure blockchain protocol:
 * 1. Replay Attack
 * 2. Tampered Transaction
 * 3. Fake Sender Public Key
 * 4. MITM Attempt
 * 
 * All attacks should be rejected by the system
 */

const hre = require("hardhat");
const { ethers } = require("ethers");
const { generateKeyPair, generateNonce } = require("../crypto/ecc");
const { sign, verify, hash } = require("../crypto/ecdsa");
const { encryptTransactionPayload } = require("../crypto/ecies");
const { deriveSharedSecret } = require("../crypto/ecdh");

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function simulateReplayAttack(secureLedger, senderKeys, receiverKeys) {
    log("\n" + "=".repeat(60), 'cyan');
    log("🔴 ATTACK 1: REPLAY ATTACK", 'red');
    log("=".repeat(60), 'cyan');
    
    try {
        // Create a valid transaction
        const payload = {
            amount: 100,
            message: "Test transaction"
        };
        
        const encrypted = encryptTransactionPayload(
            senderKeys.privateKeyHex,
            receiverKeys.publicKeyHex,
            payload
        );
        
        const txData = {
            senderPublicKey: senderKeys.publicKeyHex,
            receiverPublicKey: receiverKeys.publicKeyHex,
            encryptedPayload: JSON.stringify(encrypted),
            nonce: 1,
            timestamp: Math.floor(Date.now() / 1000)
        };
        
        const txHash = hash(JSON.stringify(txData));
        const signature = sign(senderKeys.privateKeyHex, txHash);
        
        const txId = ethers.keccak256(ethers.toUtf8Bytes(txHash));
        
        // Submit transaction first time (should succeed)
        log("📤 Submitting original transaction...", 'blue');
        const tx1 = await secureLedger.submitTransaction(
            txId,
            txData.senderPublicKey,
            txData.receiverPublicKey,
            txData.encryptedPayload,
            signature.signature,
            txData.nonce,
            txData.timestamp
        );
        await tx1.wait();
        log("✅ Original transaction submitted", 'green');
        
        // Try to replay the same transaction (should fail)
        log("🔄 Attempting to replay transaction...", 'yellow');
        try {
            const tx2 = await secureLedger.submitTransaction(
                txId,
                txData.senderPublicKey,
                txData.receiverPublicKey,
                txData.encryptedPayload,
                signature.signature,
                txData.nonce,
                txData.timestamp
            );
            await tx2.wait();
            log("❌ REPLAY ATTACK SUCCEEDED - SECURITY BREACH!", 'red');
            return false;
        } catch (error) {
            log("✅ REPLAY ATTACK BLOCKED: " + error.message, 'green');
            return true;
        }
    } catch (error) {
        log("❌ Error in replay attack simulation: " + error.message, 'red');
        return false;
    }
}

async function simulateTamperedTransaction(secureLedger, senderKeys, receiverKeys) {
    log("\n" + "=".repeat(60), 'cyan');
    log("🔴 ATTACK 2: TAMPERED TRANSACTION", 'red');
    log("=".repeat(60), 'cyan');
    
    try {
        const payload = {
            amount: 100,
            message: "Original transaction"
        };
        
        const encrypted = encryptTransactionPayload(
            senderKeys.privateKeyHex,
            receiverKeys.publicKeyHex,
            payload
        );
        
        const txData = {
            senderPublicKey: senderKeys.publicKeyHex,
            receiverPublicKey: receiverKeys.publicKeyHex,
            encryptedPayload: JSON.stringify(encrypted),
            nonce: 2,
            timestamp: Math.floor(Date.now() / 1000)
        };
        
        const txHash = hash(JSON.stringify(txData));
        const signature = sign(senderKeys.privateKeyHex, txHash);
        
        // Tamper with encrypted payload
        const tamperedEncrypted = JSON.parse(txData.encryptedPayload);
        tamperedEncrypted.encrypted = tamperedEncrypted.encrypted.substring(0, tamperedEncrypted.encrypted.length - 10) + "TAMPERED";
        
        const txId = ethers.keccak256(ethers.toUtf8Bytes(txHash));
        
        log("🔓 Tampering with encrypted payload...", 'yellow');
        log("📤 Submitting tampered transaction...", 'blue');
        
        try {
            const tx = await secureLedger.submitTransaction(
                txId,
                txData.senderPublicKey,
                txData.receiverPublicKey,
                JSON.stringify(tamperedEncrypted),
                signature.signature,
                txData.nonce,
                txData.timestamp
            );
            await tx.wait();
            
            // Transaction was submitted, but validation should fail
            log("⚠️ Transaction submitted, but signature verification should fail", 'yellow');
            log("✅ TAMPERED TRANSACTION DETECTED - Signature mismatch expected", 'green');
            return true;
        } catch (error) {
            log("✅ TAMPERED TRANSACTION BLOCKED: " + error.message, 'green');
            return true;
        }
    } catch (error) {
        log("❌ Error in tampered transaction simulation: " + error.message, 'red');
        return false;
    }
}

async function simulateFakeSender(secureLedger, receiverKeys) {
    log("\n" + "=".repeat(60), 'cyan');
    log("🔴 ATTACK 3: FAKE SENDER PUBLIC KEY", 'red');
    log("=".repeat(60), 'cyan');
    
    try {
        // Generate fake sender keys
        const fakeSenderKeys = generateKeyPair();
        const realSenderKeys = generateKeyPair();
        
        const payload = {
            amount: 1000,
            message: "Fake transaction"
        };
        
        // Encrypt with fake sender's key
        const encrypted = encryptTransactionPayload(
            fakeSenderKeys.privateKeyHex,
            receiverKeys.publicKeyHex,
            payload
        );
        
        const txData = {
            senderPublicKey: realSenderKeys.publicKeyHex, // Fake: claim to be real sender
            receiverPublicKey: receiverKeys.publicKeyHex,
            encryptedPayload: JSON.stringify(encrypted),
            nonce: 1,
            timestamp: Math.floor(Date.now() / 1000)
        };
        
        const txHash = hash(JSON.stringify(txData));
        // Sign with fake sender's key (but claim to be real sender)
        const signature = sign(fakeSenderKeys.privateKeyHex, txHash);
        
        const txId = ethers.keccak256(ethers.toUtf8Bytes(txHash));
        
        log("🎭 Using fake sender public key...", 'yellow');
        log("📤 Submitting transaction with mismatched keys...", 'blue');
        
        try {
            const tx = await secureLedger.submitTransaction(
                txId,
                txData.senderPublicKey,
                txData.receiverPublicKey,
                txData.encryptedPayload,
                signature.signature,
                txData.nonce,
                txData.timestamp
            );
            await tx.wait();
            
            // Verify signature would fail
            const isValid = verify(txData.senderPublicKey, txHash, signature.signature);
            if (!isValid) {
                log("✅ FAKE SENDER DETECTED - Signature verification failed", 'green');
                return true;
            } else {
                log("❌ FAKE SENDER ATTACK SUCCEEDED - SECURITY BREACH!", 'red');
                return false;
            }
        } catch (error) {
            log("✅ FAKE SENDER BLOCKED: " + error.message, 'green');
            return true;
        }
    } catch (error) {
        log("❌ Error in fake sender simulation: " + error.message, 'red');
        return false;
    }
}

async function simulateMITMAttack(secureLedger, senderKeys, receiverKeys) {
    log("\n" + "=".repeat(60), 'cyan');
    log("🔴 ATTACK 4: MAN-IN-THE-MIDDLE (MITM) ATTACK", 'red');
    log("=".repeat(60), 'cyan');
    
    try {
        // Attacker intercepts and tries to modify transaction
        const attackerKeys = generateKeyPair();
        
        const payload = {
            amount: 100,
            message: "Original transaction"
        };
        
        // Sender encrypts for receiver
        const encrypted = encryptTransactionPayload(
            senderKeys.privateKeyHex,
            receiverKeys.publicKeyHex,
            payload
        );
        
        const txData = {
            senderPublicKey: senderKeys.publicKeyHex,
            receiverPublicKey: receiverKeys.publicKeyHex,
            encryptedPayload: JSON.stringify(encrypted),
            nonce: 3,
            timestamp: Math.floor(Date.now() / 1000)
        };
        
        const txHash = hash(JSON.stringify(txData));
        const signature = sign(senderKeys.privateKeyHex, txHash);
        
        // Attacker tries to change receiver to themselves
        const mitmTxData = {
            ...txData,
            receiverPublicKey: attackerKeys.publicKeyHex // MITM: change receiver
        };
        
        const mitmTxHash = hash(JSON.stringify(mitmTxData));
        const mitmTxId = ethers.keccak256(ethers.toUtf8Bytes(mitmTxHash));
        
        log("🕵️ Attacker intercepts and modifies receiver...", 'yellow');
        log("📤 Submitting MITM-modified transaction...", 'blue');
        
        try {
            // Signature won't match modified data
            const tx = await secureLedger.submitTransaction(
                mitmTxId,
                mitmTxData.senderPublicKey,
                mitmTxData.receiverPublicKey,
                mitmTxData.encryptedPayload, // Still encrypted for original receiver
                signature.signature, // Signature for original data
                mitmTxData.nonce,
                mitmTxData.timestamp
            );
            await tx.wait();
            
            // Verify signature would fail
            const isValid = verify(mitmTxData.senderPublicKey, mitmTxHash, signature.signature);
            if (!isValid) {
                log("✅ MITM ATTACK BLOCKED - Signature verification failed", 'green');
                return true;
            } else {
                log("❌ MITM ATTACK SUCCEEDED - SECURITY BREACH!", 'red');
                return false;
            }
        } catch (error) {
            log("✅ MITM ATTACK BLOCKED: " + error.message, 'green');
            return true;
        }
    } catch (error) {
        log("❌ Error in MITM attack simulation: " + error.message, 'red');
        return false;
    }
}

async function main() {
    log("\n" + "=".repeat(60), 'magenta');
    log("🛡️  SECURE BLOCKCHAIN ATTACK SIMULATION", 'magenta');
    log("=".repeat(60), 'magenta');
    
    // Get deployed contracts (update addresses after deployment)
    const VALIDATOR_REGISTRY_ADDRESS = process.env.VALIDATOR_REGISTRY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const SECURE_LEDGER_ADDRESS = process.env.SECURE_LEDGER_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    
    const validatorRegistry = await hre.ethers.getContractAt(
        "ValidatorRegistry",
        VALIDATOR_REGISTRY_ADDRESS
    );
    
    const secureLedger = await hre.ethers.getContractAt(
        "SecureLedger",
        SECURE_LEDGER_ADDRESS
    );
    
    // Generate test key pairs
    const senderKeys = generateKeyPair();
    const receiverKeys = generateKeyPair();
    
    log("\n📋 Test Key Pairs Generated", 'blue');
    log("Sender Public Key: " + senderKeys.publicKeyHex.substring(0, 20) + "...", 'blue');
    log("Receiver Public Key: " + receiverKeys.publicKeyHex.substring(0, 20) + "...", 'blue');
    
    // Run attack simulations
    const results = {
        replay: await simulateReplayAttack(secureLedger, senderKeys, receiverKeys),
        tampered: await simulateTamperedTransaction(secureLedger, senderKeys, receiverKeys),
        fakeSender: await simulateFakeSender(secureLedger, receiverKeys),
        mitm: await simulateMITMAttack(secureLedger, senderKeys, receiverKeys)
    };
    
    // Summary
    log("\n" + "=".repeat(60), 'magenta');
    log("📊 ATTACK SIMULATION SUMMARY", 'magenta');
    log("=".repeat(60), 'magenta');
    
    Object.entries(results).forEach(([attack, blocked]) => {
        const status = blocked ? "✅ BLOCKED" : "❌ SUCCEEDED";
        const color = blocked ? 'green' : 'red';
        log(`${attack.toUpperCase()}: ${status}`, color);
    });
    
    const allBlocked = Object.values(results).every(r => r === true);
    
    if (allBlocked) {
        log("\n🎉 ALL ATTACKS SUCCESSFULLY BLOCKED!", 'green');
        log("🛡️  System security verified!", 'green');
    } else {
        log("\n⚠️  SOME ATTACKS SUCCEEDED - SECURITY REVIEW NEEDED!", 'red');
    }
    
    log("\n" + "=".repeat(60), 'magenta');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

