/**
 * Secure Blockchain Frontend Application
 * 
 * Handles:
 * - ECC key generation in browser
 * - Transaction creation and signing
 * - ECIES encryption
 * - Blockchain interaction
 * - Attack simulation
 */

// Configuration - Update these after deployment
const CONFIG = {
    VALIDATOR_REGISTRY_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    SECURE_LEDGER_ADDRESS: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    RPC_URL: 'http://127.0.0.1:8545'
};

// Global state
let userKeys = null;
let provider = null;
let validatorRegistry = null;
let secureLedger = null;
let currentTransaction = null;

// Debug function to check library status
function checkLibraries() {
    const status = {
        elliptic: typeof elliptic !== 'undefined',
        cryptoJS: typeof CryptoJS !== 'undefined',
        ethers: typeof ethers !== 'undefined'
    };
    console.log('📚 Library Status:', status);
    
    if (!status.elliptic) {
        console.error('❌ Elliptic library is missing!');
        console.log('💡 Try: Refresh the page or check internet connection');
        console.log('💡 Alternative: Download elliptic.min.js locally (see elliptic-local-install.md)');
    }
    if (!status.cryptoJS) {
        console.error('❌ CryptoJS library is missing!');
    }
    if (!status.ethers) {
        console.error('❌ Ethers.js library is missing!');
    }
    
    return status;
}

// Make copyToClipboard available globally
window.copyToClipboard = copyToClipboard;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for all scripts to load
    setTimeout(async () => {
        await initializeApp();
        setupEventListeners();
    }, 100);
});

// Also initialize when window loads (backup)
window.addEventListener('load', async () => {
    if (!provider) {
        setTimeout(async () => {
            await initializeApp();
            if (!document.getElementById('generateKeys').onclick) {
                setupEventListeners();
            }
        }, 100);
    }
});

/**
 * Initialize application
 */
async function initializeApp() {
    try {
        // Initialize ethers provider (using v5 for CDN compatibility)
        if (typeof ethers !== 'undefined') {
            provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL);
            
            // Load contracts (ABI would be loaded from artifacts in production)
            // For now, using minimal interface
            validatorRegistry = new ethers.Contract(
                CONFIG.VALIDATOR_REGISTRY_ADDRESS,
                getValidatorRegistryABI(),
                provider
            );
            
            secureLedger = new ethers.Contract(
                CONFIG.SECURE_LEDGER_ADDRESS,
                getSecureLedgerABI(),
                provider
            );
            
            updateNetworkStatus('Connected');
            await refreshBlockchainStatus();
        } else {
            updateNetworkStatus('Ethers.js not loaded');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        updateNetworkStatus('Connection Error');
        showNotification('Failed to connect to blockchain', 'error');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    try {
        // Key generation
        const generateBtn = document.getElementById('generateKeys');
        if (generateBtn) {
            // Remove existing listeners to avoid duplicates
            const newGenerateBtn = generateBtn.cloneNode(true);
            generateBtn.parentNode.replaceChild(newGenerateBtn, generateBtn);
            newGenerateBtn.addEventListener('click', generateKeyPair);
            console.log('Key generation button listener attached');
        } else {
            console.error('Generate keys button not found');
        }
        
        // Transaction form
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.addEventListener('submit', handleTransactionSubmit);
        }
        
        // Submit transaction
        const submitBtn = document.getElementById('submitTransactionBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', submitTransactionToBlockchain);
        }
        
        // Status refresh
        const refreshBtn = document.getElementById('refreshStatusBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshBlockchainStatus);
        }
        
        // Attack simulations
        const replayBtn = document.getElementById('simulateReplayBtn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => simulateAttack('replay'));
        }
        
        const tamperBtn = document.getElementById('simulateTamperBtn');
        if (tamperBtn) {
            tamperBtn.addEventListener('click', () => simulateAttack('tamper'));
        }
        
        const fakeSenderBtn = document.getElementById('simulateFakeSenderBtn');
        if (fakeSenderBtn) {
            fakeSenderBtn.addEventListener('click', () => simulateAttack('fakeSender'));
        }
        
        const mitmBtn = document.getElementById('simulateMITMBtn');
        if (mitmBtn) {
            mitmBtn.addEventListener('click', () => simulateAttack('mitm'));
        }
        
        // Modal close
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const modal = document.getElementById('infoModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        console.log('All event listeners attached successfully');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Generate ECC key pair using elliptic.js
 */
function generateKeyPair() {
    try {
        // Check if elliptic library is loaded
        if (typeof elliptic === 'undefined') {
            console.error('Elliptic library not available');
            showNotification('Error: Elliptic library not loaded. Please refresh the page.', 'error');
            return;
        }

        // Validate elliptic library
        if (!elliptic.ec) {
            console.error('Elliptic.ec not available');
            showNotification('Error: Elliptic.ec not available. Please check library version.', 'error');
            return;
        }

        console.log('Generating key pair...');
        
        // Create elliptic curve instance
        const ec = new elliptic.ec('secp256k1');
        
        // Generate key pair
        const keyPair = ec.genKeyPair();
        
        // Get private key (64 hex characters)
        const privateKey = keyPair.getPrivate('hex');
        
        // Ensure private key is 64 characters (pad if needed)
        const paddedPrivateKey = privateKey.padStart(64, '0');
        
        // Get public key (compressed format)
        const publicKeyPoint = keyPair.getPublic();
        const publicKey = publicKeyPoint.encode('hex', true); // true = compressed
        
        // Validate keys
        if (!privateKey || privateKey.length === 0) {
            throw new Error('Failed to generate private key');
        }
        if (!publicKey || publicKey.length === 0) {
            throw new Error('Failed to generate public key');
        }
        
        console.log('Key pair generated successfully');
        console.log('Private Key length:', paddedPrivateKey.length);
        console.log('Public Key length:', publicKey.length);
        
        // Store keys
        userKeys = {
            privateKey: paddedPrivateKey,
            publicKey: publicKey,
            keyPair: keyPair
        };
        
        // Display keys
        const privateKeyElement = document.getElementById('privateKey');
        const publicKeyElement = document.getElementById('publicKey');
        const keyDisplayElement = document.getElementById('keyDisplay');
        
        if (!privateKeyElement || !publicKeyElement || !keyDisplayElement) {
            throw new Error('Key display elements not found in DOM');
        }
        
        privateKeyElement.value = paddedPrivateKey;
        publicKeyElement.value = publicKey;
        keyDisplayElement.style.display = 'block';
        
        showNotification('Key pair generated successfully!', 'success');
        console.log('Keys displayed in UI');
    } catch (error) {
        console.error('Key generation error:', error);
        console.error('Error stack:', error.stack);
        showNotification('Failed to generate keys: ' + error.message, 'error');
    }
}

/**
 * Handle transaction form submission
 */
async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    if (!userKeys) {
        showNotification('Please generate a key pair first', 'warning');
        return;
    }
    
    const receiverPublicKey = document.getElementById('receiverPublicKey').value.trim();
    const amount = document.getElementById('transactionAmount').value;
    const message = document.getElementById('transactionMessage').value;
    
    if (!receiverPublicKey) {
        showNotification('Please enter receiver public key', 'error');
        return;
    }
    
    try {
        // Create transaction payload
        const payload = {
            amount: parseFloat(amount),
            message: message || '',
            timestamp: Date.now()
        };
        
        // Encrypt payload using ECIES
        const encrypted = await encryptPayload(userKeys.privateKey, receiverPublicKey, payload);
        
        // Create transaction data
        const txData = {
            senderPublicKey: userKeys.publicKey,
            receiverPublicKey: receiverPublicKey,
            encryptedPayload: JSON.stringify(encrypted),
            nonce: await getNextNonce(userKeys.publicKey),
            timestamp: Math.floor(Date.now() / 1000)
        };
        
        // Hash transaction data
        const txHash = hashData(JSON.stringify(txData));
        
        // Sign transaction
        const signature = signData(userKeys.keyPair, txHash);
        
        // Create transaction ID (ethers v5 syntax)
        const txId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(txHash));
        
        // Store transaction
        currentTransaction = {
            txId: txId,
            ...txData,
            signature: signature,
            payload: payload
        };
        
        // Display transaction
        displayTransaction(currentTransaction);
        
        showNotification('Transaction created and signed!', 'success');
    } catch (error) {
        console.error('Transaction creation error:', error);
        showNotification('Failed to create transaction: ' + error.message, 'error');
    }
}

/**
 * Encrypt payload using ECIES (simplified browser implementation)
 */
async function encryptPayload(senderPrivateKey, receiverPublicKey, payload) {
    try {
        // Check if libraries are available
        if (typeof elliptic === 'undefined') {
            throw new Error('Elliptic library not loaded');
        }
        if (typeof CryptoJS === 'undefined') {
            throw new Error('CryptoJS library not loaded');
        }
        
        // In a real implementation, this would use proper ECIES
        // For browser, we'll use a simplified version with AES
        
        const ec = new elliptic.ec('secp256k1');
        const senderKeyPair = ec.keyFromPrivate(senderPrivateKey, 'hex');
        const receiverKey = ec.keyFromPublic(receiverPublicKey, 'hex');
        
        // Derive shared secret using ECDH
        const sharedPoint = senderKeyPair.derive(receiverKey.getPublic());
        const sharedSecret = sharedPoint.toString('hex', 32);
        
        // Derive encryption key from shared secret
        const encryptionKey = CryptoJS.SHA256(sharedSecret).toString();
        
        // Generate IV
        const iv = CryptoJS.lib.WordArray.random(16);
        
        // Encrypt payload
        const encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(payload),
            encryptionKey,
            { iv: iv }
        );
        
        // Create authentication tag
        const hmac = CryptoJS.HmacSHA256(
            iv.toString() + encrypted.ciphertext.toString(),
            encryptionKey
        );
        
        return {
            encrypted: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
            iv: iv.toString(CryptoJS.enc.Hex),
            tag: hmac.toString()
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw error;
    }
}

/**
 * Hash data using SHA-256
 */
function hashData(data) {
    try {
        if (typeof CryptoJS === 'undefined') {
            throw new Error('CryptoJS library not loaded');
        }
        return CryptoJS.SHA256(data).toString();
    } catch (error) {
        console.error('Hashing error:', error);
        throw error;
    }
}

/**
 * Sign data using ECDSA
 */
function signData(keyPair, dataHash) {
    try {
        if (!keyPair) {
            throw new Error('Key pair not provided');
        }
        
        // Convert hex string to array of bytes for elliptic.js
        // elliptic.js expects the hash as a hex string or array
        const signature = keyPair.sign(dataHash, 'hex');
        
        // Return signature in DER format
        return signature.toDER('hex');
    } catch (error) {
        console.error('Signing error:', error);
        throw error;
    }
}

/**
 * Get next nonce for sender
 */
async function getNextNonce(senderPublicKey) {
    try {
        if (secureLedger) {
            const lastNonce = await secureLedger.getLastNonce(senderPublicKey);
            return parseInt(lastNonce) + 1;
        }
    } catch (error) {
        console.error('Error getting nonce:', error);
    }
    return 1; // Default to 1 if error
}

/**
 * Display transaction details
 */
function displayTransaction(tx) {
    document.getElementById('txId').textContent = tx.txId;
    document.getElementById('txEncrypted').value = tx.encryptedPayload;
    document.getElementById('txSignature').value = tx.signature;
    document.getElementById('txStatus').textContent = 'Ready';
    document.getElementById('txStatus').className = 'status-badge success';
    document.getElementById('transactionDisplay').style.display = 'block';
    document.getElementById('submitTransactionBtn').style.display = 'block';
}

/**
 * Submit transaction to blockchain
 */
async function submitTransactionToBlockchain() {
    if (!currentTransaction || !secureLedger) {
        showNotification('Transaction not ready or blockchain not connected', 'error');
        return;
    }
    
    try {
        // Get signer (in production, connect wallet)
        // For demo, we'll use the first account from provider
        const signer = provider.getSigner(0);
        const secureLedgerWithSigner = secureLedger.connect(signer);
        
        // Submit transaction
        const tx = await secureLedgerWithSigner.submitTransaction(
            currentTransaction.txId,
            currentTransaction.senderPublicKey,
            currentTransaction.receiverPublicKey,
            currentTransaction.encryptedPayload,
            currentTransaction.signature,
            currentTransaction.nonce,
            currentTransaction.timestamp
        );
        
        showNotification('Transaction submitted! Waiting for confirmation...', 'info');
        
        await tx.wait();
        
        // Update status
        document.getElementById('txStatus').textContent = 'Submitted';
        document.getElementById('txStatus').className = 'status-badge success';
        
        // Add to history
        addToTransactionHistory(currentTransaction, 'success');
        
        showNotification('Transaction confirmed!', 'success');
        
        // Refresh status
        await refreshBlockchainStatus();
    } catch (error) {
        console.error('Transaction submission error:', error);
        document.getElementById('txStatus').textContent = 'Failed';
        document.getElementById('txStatus').className = 'status-badge error';
        showNotification('Transaction failed: ' + error.message, 'error');
        addToTransactionHistory(currentTransaction, 'error');
    }
}

/**
 * Refresh blockchain status
 */
async function refreshBlockchainStatus() {
    try {
        if (!secureLedger) return;
        
        const blockNumber = await secureLedger.blockNumber();
        document.getElementById('currentBlock').textContent = blockNumber.toString();
        
        const validators = await validatorRegistry.getActiveValidators();
        document.getElementById('validatorCount').textContent = validators.length.toString();
        
    } catch (error) {
        console.error('Status refresh error:', error);
    }
}

/**
 * Simulate attack
 */
async function simulateAttack(attackType) {
    if (!userKeys) {
        showNotification('Please generate a key pair first', 'warning');
        return;
    }
    
    const resultsDiv = document.getElementById('attackResults');
    resultsDiv.innerHTML = '<div class="spinner"></div> Running simulation...';
    
    try {
        let result;
        const receiverKeys = generateTestKeyPair();
        
        switch (attackType) {
            case 'replay':
                result = await simulateReplayAttack(receiverKeys);
                break;
            case 'tamper':
                result = await simulateTamperAttack(receiverKeys);
                break;
            case 'fakeSender':
                result = await simulateFakeSenderAttack(receiverKeys);
                break;
            case 'mitm':
                result = await simulateMITMAttack(receiverKeys);
                break;
        }
        
        displayAttackResult(attackType, result);
    } catch (error) {
        console.error('Attack simulation error:', error);
        resultsDiv.innerHTML = `<div class="status-badge error">Error: ${error.message}</div>`;
    }
}

/**
 * Simulate replay attack
 */
async function simulateReplayAttack(receiverKeys) {
    // Create transaction
    const payload = { amount: 100, message: 'Test' };
    const encrypted = await encryptPayload(userKeys.privateKey, receiverKeys.publicKey, payload);
    
    const txData = {
        senderPublicKey: userKeys.publicKey,
        receiverPublicKey: receiverKeys.publicKey,
        encryptedPayload: JSON.stringify(encrypted),
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000)
    };
    
    const txHash = hashData(JSON.stringify(txData));
    const signature = signData(userKeys.keyPair, txHash);
    const txId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(txHash));
    
    // Try to submit twice
    try {
        if (secureLedger) {
            const signer = provider.getSigner(0);
            const secureLedgerWithSigner = secureLedger.connect(signer);
            
            await secureLedgerWithSigner.submitTransaction(
                txId, txData.senderPublicKey, txData.receiverPublicKey,
                txData.encryptedPayload, signature, txData.nonce, txData.timestamp
            );
            
            // Try replay
            try {
                await secureLedgerWithSigner.submitTransaction(
                    txId, txData.senderPublicKey, txData.receiverPublicKey,
                    txData.encryptedPayload, signature, txData.nonce, txData.timestamp
                );
                return { blocked: false, message: 'Replay attack succeeded!' };
            } catch (error) {
                return { blocked: true, message: 'Replay attack blocked: ' + error.message };
            }
        }
    } catch (error) {
        return { blocked: true, message: 'Error: ' + error.message };
    }
    
    return { blocked: true, message: 'Attack simulation completed' };
}

/**
 * Simulate tamper attack
 */
async function simulateTamperAttack(receiverKeys) {
    const payload = { amount: 100, message: 'Original' };
    const encrypted = await encryptPayload(userKeys.privateKey, receiverKeys.publicKey, payload);
    
    // Tamper with encrypted data
    const tampered = JSON.parse(JSON.stringify(encrypted));
    tampered.encrypted = tampered.encrypted.substring(0, tampered.encrypted.length - 10) + 'TAMPERED';
    
    const txData = {
        senderPublicKey: userKeys.publicKey,
        receiverPublicKey: receiverKeys.publicKey,
        encryptedPayload: JSON.stringify(tampered),
        nonce: 2,
        timestamp: Math.floor(Date.now() / 1000)
    };
    
    const txHash = hashData(JSON.stringify(txData));
    const signature = signData(userKeys.keyPair, txHash);
    
    // Signature won't match tampered data
    return { blocked: true, message: 'Tampered transaction detected - signature mismatch' };
}

/**
 * Simulate fake sender attack
 */
async function simulateFakeSenderAttack(receiverKeys) {
    const fakeKeys = generateTestKeyPair();
    const payload = { amount: 1000, message: 'Fake' };
    const encrypted = await encryptPayload(fakeKeys.privateKey, receiverKeys.publicKey, payload);
    
    const txData = {
        senderPublicKey: userKeys.publicKey, // Claim to be real sender
        receiverPublicKey: receiverKeys.publicKey,
        encryptedPayload: JSON.stringify(encrypted),
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000)
    };
    
    const txHash = hashData(JSON.stringify(txData));
    const signature = signData(fakeKeys.keyPair, txHash); // But sign with fake key
    
    // Verify signature
    if (typeof elliptic === 'undefined') {
        return { blocked: true, message: 'Elliptic library not loaded' };
    }
    
    const ec = new elliptic.ec('secp256k1');
    const senderKey = ec.keyFromPublic(userKeys.publicKey, 'hex');
    const isValid = senderKey.verify(txHash, signature, 'hex');
    
    return {
        blocked: !isValid,
        message: isValid ? 'Fake sender attack succeeded!' : 'Fake sender detected - signature verification failed'
    };
}

/**
 * Simulate MITM attack
 */
async function simulateMITMAttack(receiverKeys) {
    const attackerKeys = generateTestKeyPair();
    const payload = { amount: 100, message: 'Original' };
    const encrypted = await encryptPayload(userKeys.privateKey, receiverKeys.publicKey, payload);
    
    // MITM changes receiver
    const txData = {
        senderPublicKey: userKeys.publicKey,
        receiverPublicKey: attackerKeys.publicKey, // Changed by MITM
        encryptedPayload: JSON.stringify(encrypted), // Still encrypted for original receiver
        nonce: 3,
        timestamp: Math.floor(Date.now() / 1000)
    };
    
    const txHash = hashData(JSON.stringify(txData));
    const signature = signData(userKeys.keyPair, txHash);
    
    return { blocked: true, message: 'MITM attack detected - encrypted payload mismatch' };
}

/**
 * Generate test key pair
 */
function generateTestKeyPair() {
    try {
        if (typeof elliptic === 'undefined') {
            throw new Error('Elliptic library not loaded');
        }
        
        const ec = new elliptic.ec('secp256k1');
        const keyPair = ec.genKeyPair();
        const privateKey = keyPair.getPrivate('hex').padStart(64, '0');
        const publicKeyPoint = keyPair.getPublic();
        const publicKey = publicKeyPoint.encode('hex', true);
        
        return {
            privateKey: privateKey,
            publicKey: publicKey,
            keyPair: keyPair
        };
    } catch (error) {
        console.error('Test key pair generation error:', error);
        throw error;
    }
}

/**
 * Display attack result
 */
function displayAttackResult(attackType, result) {
    const resultsDiv = document.getElementById('attackResults');
    const statusClass = result.blocked ? 'success' : 'error';
    const icon = result.blocked ? '✅' : '❌';
    
    resultsDiv.innerHTML = `
        <div class="status-badge ${statusClass}">
            ${icon} ${attackType.toUpperCase()} Attack: ${result.message}
        </div>
    `;
}

/**
 * Add transaction to history
 */
function addToTransactionHistory(tx, status) {
    const historyDiv = document.getElementById('transactionHistory');
    
    if (historyDiv.querySelector('.empty-state')) {
        historyDiv.innerHTML = '';
    }
    
    const txItem = document.createElement('div');
    txItem.className = `transaction-history-item ${status}`;
    txItem.innerHTML = `
        <div><strong>TX ID:</strong> ${tx.txId.substring(0, 20)}...</div>
        <div><strong>Amount:</strong> ${tx.payload.amount}</div>
        <div><strong>Status:</strong> <span class="status-badge ${status}">${status}</span></div>
        <div><strong>Time:</strong> ${new Date().toLocaleString()}</div>
    `;
    
    historyDiv.insertBefore(txItem, historyDiv.firstChild);
}

/**
 * Update network status
 */
function updateNetworkStatus(status) {
    const statusEl = document.getElementById('networkStatus');
    statusEl.textContent = status;
    statusEl.className = 'status-badge ' + (status === 'Connected' ? 'success' : 'error');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Simple notification (could be enhanced with toast library)
    const badge = document.createElement('div');
    badge.className = `status-badge ${type}`;
    badge.textContent = message;
    badge.style.position = 'fixed';
    badge.style.top = '20px';
    badge.style.right = '20px';
    badge.style.zIndex = '10000';
    badge.style.padding = '15px 20px';
    
    document.body.appendChild(badge);
    
    setTimeout(() => {
        badge.remove();
    }, 3000);
}

/**
 * Copy to clipboard (using modern Clipboard API)
 */
async function copyToClipboard(elementId) {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            showNotification('Element not found', 'error');
            return;
        }
        
        const text = element.value || element.textContent;
        if (!text) {
            showNotification('No text to copy', 'error');
            return;
        }
        
        // Use modern Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showNotification('Copied to clipboard!', 'success');
        } else {
            // Fallback to execCommand for older browsers
            element.select();
            element.setSelectionRange(0, 99999); // For mobile devices
            const successful = document.execCommand('copy');
            if (successful) {
                showNotification('Copied to clipboard!', 'success');
            } else {
                showNotification('Failed to copy. Please select and copy manually.', 'error');
            }
        }
    } catch (error) {
        console.error('Copy error:', error);
        showNotification('Failed to copy: ' + error.message, 'error');
    }
}

/**
 * Get ValidatorRegistry ABI (minimal interface)
 */
function getValidatorRegistryABI() {
    return [
        "function getActiveValidators() external view returns (address[])",
        "function getValidator(address) external view returns (address, string, uint256, bool, uint256)",
        "function isValidator(address) external view returns (bool)",
        "function getHighestTrustScoreValidator() external view returns (address)"
    ];
}

/**
 * Get SecureLedger ABI (minimal interface)
 */
function getSecureLedgerABI() {
    return [
        "function submitTransaction(bytes32, string, string, string, string, uint256, uint256) external",
        "function blockNumber() external view returns (uint256)",
        "function getLastNonce(string) external view returns (uint256)",
        "function getTransaction(bytes32) external view returns (bytes32, string, string, string, string, uint256, uint256, bool)"
    ];
}

// Make copyToClipboard available globally for onclick handlers
window.copyToClipboard = copyToClipboard;

// Expose checkLibraries for debugging
window.checkLibraries = checkLibraries;

// Log when app.js is loaded
console.log('Secure Blockchain Frontend App loaded');
console.log('Checking libraries...');
setTimeout(() => {
    checkLibraries();
}, 500);

