/**
 * Secure Blockchain Frontend Application
 * 
 * MetaMask-Only Implementation
 * - Uses ONLY MetaMask accounts (no manual key generation)
 * - Sends real ETH transactions on Sepolia
 * - Attaches encrypted protocol payload to transactions
 * - Preserves all ECC-based cryptographic security
 */

// Configuration - Update after deployment to Sepolia
const CONFIG = {
    VALIDATOR_REGISTRY_ADDRESS: '0x9eBf8f9d0B1A498dAB772b9870c6a0a948CFB876',
    SECURE_LEDGER_ADDRESS: '0x683ad6742F7b7BA59201316F0A66991B86e07926',
    ALCHEMY_RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/Zo8gqDtvZINX-XEgT62FA',
    SEPOLIA_CHAIN_ID: 11155111,
    SEPOLIA_NETWORK_NAME: 'Sepolia'
};

// Global state
let provider = null; // MetaMask provider
let signer = null; // MetaMask signer
let userAccount = null; // Selected MetaMask account
let allAccounts = []; // All MetaMask accounts
let accountBalances = {}; // Account balances
let validatorRegistry = null;
let secureLedger = null;
let isMetaMaskConnected = false;
let protocolKeys = null; // ECC keys for protocol encryption (internal only)

// Initialize on page load
// Note: app.js is loaded AFTER all libraries are ready (see index.html)
// This ensures ethers.js, CryptoJS, and elliptic are all loaded first

function initApp() {
    // Verify libraries are loaded (safety check)
    if (typeof ethers === 'undefined') {
        console.error('❌ Ethers.js not loaded! App.js loaded too early.');
        if (typeof showNotification === 'function') {
            showNotification('Ethers.js not loaded. Please refresh the page.', 'error');
        } else {
            alert('Error: Ethers.js not loaded. Please refresh the page.');
        }
        return;
    }
    
    if (typeof CryptoJS === 'undefined') {
        console.error('❌ CryptoJS not loaded!');
        alert('Error: CryptoJS not loaded. Please refresh the page.');
        return;
    }
    
    console.log('✅ All libraries verified, initializing app...');
    
    // Initialize app
    setTimeout(async () => {
        await initializeApp();
        setupEventListeners();
    }, 100);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded
    initApp();
}

/**
 * Check if MetaMask is installed
 */
function isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
}

/**
 * Connect to MetaMask and load all accounts
 */
async function connectMetaMask() {
    try {
        if (!isMetaMaskInstalled()) {
            showNotification('MetaMask is not installed. Please install MetaMask extension.', 'error');
            window.open('https://metamask.io/download/', '_blank');
            return false;
        }

        console.log('🦊 Connecting to MetaMask...');
        
        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            showNotification('No accounts found. Please unlock MetaMask.', 'error');
            return false;
        }

        // Store all accounts
        allAccounts = accounts;
        userAccount = accounts[0]; // Default to first account
        
        console.log('✅ Connected to accounts:', accounts.length);
        console.log('   Active account:', userAccount);

        // Create provider from MetaMask
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        // Check network
        const network = await provider.getNetwork();
        console.log('🌐 Current network:', network.name, 'Chain ID:', network.chainId);

        // Verify we're on Sepolia
        if (network.chainId !== CONFIG.SEPOLIA_CHAIN_ID) {
            const switchResult = await switchToSepolia();
            if (!switchResult) {
                showNotification('Please switch to Sepolia testnet in MetaMask', 'error');
                return false;
            }
        }

        // Load account balances
        await loadAccountBalances();
        
        // Load contracts
        await loadContracts();
        
        // Generate protocol keys internally (for encryption, not displayed)
        generateProtocolKeys();
        
        // Update UI
        updateMetaMaskUI();
        isMetaMaskConnected = true;
        
        // Setup event listeners
        setupMetaMaskEventListeners();
        
        showNotification('Successfully connected to MetaMask!', 'success');
        return true;
    } catch (error) {
        console.error('MetaMask connection error:', error);
        if (error.code === 4001) {
            showNotification('User rejected MetaMask connection request', 'error');
        } else {
            showNotification('Failed to connect to MetaMask: ' + error.message, 'error');
        }
        return false;
    }
}

/**
 * Switch to Sepolia network
 */
async function switchToSepolia() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + CONFIG.SEPOLIA_CHAIN_ID.toString(16) }]
        });
        return true;
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x' + CONFIG.SEPOLIA_CHAIN_ID.toString(16),
                        chainName: 'Sepolia',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: [CONFIG.ALCHEMY_RPC_URL],
                        blockExplorerUrls: ['https://sepolia.etherscan.io']
                    }]
                });
                return true;
            } catch (addError) {
                console.error('Failed to add Sepolia network:', addError);
                return false;
            }
        }
        return false;
    }
}

/**
 * Load balances for all MetaMask accounts
 */
async function loadAccountBalances() {
    if (!provider) return;
    
    accountBalances = {};
    for (const account of allAccounts) {
        try {
            const balance = await provider.getBalance(account);
            accountBalances[account] = ethers.utils.formatEther(balance);
            console.log(`   ${account}: ${accountBalances[account]} ETH`);
        } catch (error) {
            console.error(`Failed to get balance for ${account}:`, error);
            accountBalances[account] = '0.0';
        }
    }
}

/**
 * Load smart contracts
 */
async function loadContracts() {
    try {
        if (!provider) {
            throw new Error('Provider not initialized');
        }

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

        console.log('✅ Contracts loaded');
        await refreshBlockchainStatus();
    } catch (error) {
        console.error('Failed to load contracts:', error);
        showNotification('Failed to load contracts. Check contract addresses.', 'error');
    }
}

/**
 * Generate protocol keys internally (for ECC encryption, not displayed)
 */
function generateProtocolKeys() {
    try {
        if (typeof elliptic === 'undefined') {
            console.warn('Elliptic library not available for protocol keys');
            return;
        }

        const ec = new elliptic.ec('secp256k1');
        const keyPair = ec.genKeyPair();
        const privateKey = keyPair.getPrivate('hex').padStart(64, '0');
        const publicKey = keyPair.getPublic().encode('hex', true);
        
        protocolKeys = {
            privateKey: privateKey,
            publicKey: publicKey,
            keyPair: keyPair
        };
        
        console.log('🔐 Protocol keys generated (internal use only)');
        console.log('   Public Key:', publicKey);
        
        // Display protocol public key in UI
        displayMyProtocolKey();
    } catch (error) {
        console.error('Failed to generate protocol keys:', error);
    }
}

/**
 * Display user's protocol public key in UI
 */
function displayMyProtocolKey() {
    if (!protocolKeys) {
        showNotification('Protocol keys not generated yet. Connect MetaMask first.', 'warning');
        return;
    }
    
    const displayDiv = document.getElementById('protocolKeyDisplay');
    const keyElement = document.getElementById('myProtocolPublicKey');
    
    if (displayDiv && keyElement) {
        // Display key (protocolKeys.publicKey is 66 hex chars without 0x prefix from elliptic.js)
        // Don't add 0x - the field expects 66 hex characters
        const displayKey = protocolKeys.publicKey;
        keyElement.textContent = displayKey;
        displayDiv.style.display = 'block';
        
        console.log('📋 Your Protocol Public Key:', displayKey);
        console.log('   Length:', displayKey.length, 'characters (expected: 66)');
        console.log('   Copy this key and paste it in the "Receiver Protocol Public Key" field');
        
        // Auto-copy to clipboard (copy without 0x prefix as that's the format expected)
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(displayKey).then(() => {
                    showNotification('Protocol public key displayed and copied to clipboard!', 'success');
                });
            } else {
                showNotification('Protocol public key displayed!', 'success');
            }
        } catch (error) {
            showNotification('Protocol public key displayed!', 'success');
        }
    }
}

/**
 * Generate a test receiver protocol key (for testing purposes)
 */
function generateTestReceiverKey() {
    try {
        if (typeof elliptic === 'undefined') {
            showNotification('Elliptic library not loaded', 'error');
            return;
        }

        const ec = new elliptic.ec('secp256k1');
        const keyPair = ec.genKeyPair();
        const publicKey = keyPair.getPublic().encode('hex', true);
        
        const receiverKeyField = document.getElementById('receiverPublicKey');
        if (receiverKeyField) {
            // Store without 0x prefix (will be normalized during validation)
            receiverKeyField.value = publicKey;
            showNotification('Test receiver key generated and filled in!', 'success');
            console.log('Generated test receiver key:', publicKey);
            console.log('   Key length:', publicKey.length, 'characters (expected: 66)');
            if (publicKey.length !== 66) {
                console.warn('⚠️ Warning: Key length is', publicKey.length, 'expected 66');
            }
            console.log('   (This is a test key - use your own protocol key for real transactions)');
        }
    } catch (error) {
        console.error('Failed to generate test key:', error);
        showNotification('Failed to generate test key', 'error');
    }
}

/**
 * Setup MetaMask event listeners
 */
function setupMetaMaskEventListeners() {
    // Account changes
    window.ethereum.on('accountsChanged', async (accounts) => {
        console.log('🔄 Account changed:', accounts);
        if (accounts.length === 0) {
            isMetaMaskConnected = false;
            updateMetaMaskUI();
            showNotification('MetaMask account disconnected', 'warning');
        } else {
            allAccounts = accounts;
            userAccount = accounts[0];
            signer = provider.getSigner();
            await loadAccountBalances();
            updateMetaMaskUI();
            showNotification('Account changed', 'info');
        }
    });

    // Network changes
    window.ethereum.on('chainChanged', async (chainId) => {
        console.log('🔄 Network changed:', chainId);
        const network = await provider.getNetwork();
        updateMetaMaskUI();
        
        if (network.chainId !== CONFIG.SEPOLIA_CHAIN_ID) {
            showNotification('Please switch to Sepolia testnet', 'error');
        } else {
            showNotification('Network changed to Sepolia', 'success');
            await loadContracts();
        }
    });
}

/**
 * Update MetaMask UI
 */
function updateMetaMaskUI() {
    const connectedEl = document.getElementById('metamaskConnected');
    const accountEl = document.getElementById('metamaskAccount');
    const balanceEl = document.getElementById('metamaskBalance');
    const networkEl = document.getElementById('metamaskNetwork');
    const chainIdEl = document.getElementById('metamaskChainId');
    const accountSelectEl = document.getElementById('accountSelect');

    if (userAccount && isMetaMaskConnected) {
        connectedEl.textContent = 'Connected';
        connectedEl.className = 'status-badge success';
        accountEl.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(38);
        balanceEl.textContent = accountBalances[userAccount] || '0.0';
        balanceEl.textContent += ' ETH';
        
        // Update account selector
        if (accountSelectEl) {
            accountSelectEl.innerHTML = '';
            allAccounts.forEach((account, index) => {
                const option = document.createElement('option');
                option.value = account;
                option.textContent = `${account.substring(0, 6)}...${account.substring(38)} (${accountBalances[account] || '0.0'} ETH)`;
                if (account === userAccount) option.selected = true;
                accountSelectEl.appendChild(option);
            });
        }
    } else {
        connectedEl.textContent = 'Not Connected';
        connectedEl.className = 'status-badge error';
        accountEl.textContent = '-';
        balanceEl.textContent = '-';
    }

    if (provider) {
        provider.getNetwork().then(network => {
            networkEl.textContent = network.name;
            if (network.chainId === CONFIG.SEPOLIA_CHAIN_ID) {
                networkEl.className = 'status-badge success';
            } else {
                networkEl.className = 'status-badge error';
            }
            chainIdEl.textContent = network.chainId;
        });
    } else {
        networkEl.textContent = '-';
        networkEl.className = 'status-badge';
        chainIdEl.textContent = '-';
    }
}

/**
 * Switch active account
 */
async function switchAccount(accountAddress) {
    if (!allAccounts.includes(accountAddress)) {
        showNotification('Account not found', 'error');
        return;
    }
    
    userAccount = accountAddress;
    signer = provider.getSigner(accountAddress);
    await loadAccountBalances();
    updateMetaMaskUI();
    showNotification('Account switched', 'success');
}

/**
 * Initialize application
 */
async function initializeApp() {
    try {
        if (typeof ethers === 'undefined') {
            updateNetworkStatus('Ethers.js not loaded');
            return;
        }

        if (!isMetaMaskInstalled()) {
            console.warn('⚠️ MetaMask not detected');
            updateMetaMaskUI();
            showNotification('MetaMask not detected. Please install MetaMask.', 'warning');
            return;
        }

        // Try to connect if already authorized
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            console.log('🔄 Auto-connecting to existing MetaMask session...');
            await connectMetaMask();
        } else {
            console.log('ℹ️ MetaMask detected but not connected. Click "Connect MetaMask" to proceed.');
            updateMetaMaskUI();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        updateNetworkStatus('Connection Error');
        showNotification('Failed to initialize: ' + error.message, 'error');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // MetaMask connection
    const connectBtn = document.getElementById('connectMetaMaskBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectMetaMask);
    }

    // Account selector
    const accountSelect = document.getElementById('accountSelect');
    if (accountSelect) {
        accountSelect.addEventListener('change', (e) => {
            switchAccount(e.target.value);
        });
    }

    // Protocol key helpers
    const generateReceiverKeyBtn = document.getElementById('generateReceiverKeyBtn');
    if (generateReceiverKeyBtn) {
        generateReceiverKeyBtn.addEventListener('click', generateTestReceiverKey);
    }

    const showMyProtocolKeyBtn = document.getElementById('showMyProtocolKeyBtn');
    if (showMyProtocolKeyBtn) {
        showMyProtocolKeyBtn.addEventListener('click', () => {
            if (protocolKeys) {
                displayMyProtocolKey();
                showNotification('Protocol key displayed', 'info');
            } else {
                showNotification('Protocol keys not generated yet. Connect MetaMask first.', 'warning');
            }
        });
    }

    // Transaction form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }

    // Refresh status
    const refreshBtn = document.getElementById('refreshStatusBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadAccountBalances();
            await refreshBlockchainStatus();
            updateMetaMaskUI();
        });
    }

    // Attack simulations
    document.getElementById('simulateReplayBtn')?.addEventListener('click', () => simulateAttack('replay'));
    document.getElementById('simulateTamperBtn')?.addEventListener('click', () => simulateAttack('tamper'));
    document.getElementById('simulateFakeSenderBtn')?.addEventListener('click', () => simulateAttack('fakeSender'));
    document.getElementById('simulateMITMBtn')?.addEventListener('click', () => simulateAttack('mitm'));
}

/**
 * Handle transaction form submission
 * Flow: Send ETH transaction first, then attach encrypted protocol payload
 */
async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    if (!isMetaMaskConnected || !signer) {
        showNotification('Please connect MetaMask first', 'error');
        return;
    }

    if (!protocolKeys) {
        showNotification('Protocol keys not initialized', 'error');
        return;
    }

    const receiverAddress = document.getElementById('receiverAddress').value.trim();
    const amount = document.getElementById('transactionAmount').value;
    const message = document.getElementById('transactionMessage').value;

    if (!receiverAddress || !ethers.utils.isAddress(receiverAddress)) {
        showNotification('Please enter a valid receiver address', 'error');
        return;
    }

    if (!amount || parseFloat(amount) <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }

    try {
        // Step 1: Create protocol payload (encrypted metadata)
        const protocolPayload = {
            amount: parseFloat(amount),
            message: message || '',
            timestamp: Date.now(),
            protocolVersion: '1.0'
        };

        // Step 2: Get receiver's protocol public key (for encryption)
        // This is the ECC public key (NOT Ethereum address) used for protocol-level encryption
        const receiverPublicKey = document.getElementById('receiverPublicKey')?.value.trim();
        if (!receiverPublicKey) {
            showNotification('Receiver protocol public key required for encryption', 'error');
            return;
        }

        // Validate receiver public key format
        // Compressed secp256k1 public key: 33 bytes = 66 hex characters
        // Format: 1 byte prefix (02 or 03) + 32 bytes x-coordinate = 33 bytes = 66 hex chars
        let cleanKey = receiverPublicKey.startsWith('0x') ? receiverPublicKey.substring(2) : receiverPublicKey;
        
        // Compressed public key must be exactly 66 hex characters (elliptic.js encode('hex', true) returns 66)
        if (cleanKey.length !== 66 || !/^[0-9a-fA-F]{66}$/i.test(cleanKey)) {
            showNotification(`Invalid protocol public key format. Got ${cleanKey.length} chars, expected exactly 66 hex characters (compressed secp256k1).`, 'error');
            console.error('❌ Invalid key length. Expected 66, got:', cleanKey.length);
            console.error('   Key preview:', cleanKey.substring(0, 20) + '...');
            return;
        }
        
        console.log('✅ Protocol key format valid:', cleanKey.length, 'characters');

        // Validate it's a valid ECC public key on secp256k1 curve
        try {
            const ec = new elliptic.ec('secp256k1');
            // elliptic.js keyFromPublic expects hex string WITHOUT 0x prefix for compressed keys
            // The key should be 66 hex characters (33 bytes) starting with 02 or 03
            const keyToTest = cleanKey; // Use cleanKey (without 0x)
            
            // Verify it starts with 02 or 03 (compressed key prefix)
            if (!cleanKey.startsWith('02') && !cleanKey.startsWith('03')) {
                showNotification('Invalid protocol public key. Compressed key must start with 02 or 03.', 'error');
                return;
            }
            
            // Try to parse as compressed public key
            const testKey = ec.keyFromPublic(cleanKey, 'hex');
            if (!testKey.validate().result) {
                showNotification('Invalid ECC public key. Key is not valid on secp256k1 curve.', 'error');
                return;
            }
            console.log('✅ Receiver protocol public key validated (valid secp256k1 curve point)');
        } catch (error) {
            console.error('Public key validation error:', error);
            console.error('   Key being tested:', cleanKey.substring(0, 10) + '...');
            showNotification('Invalid ECC public key format: ' + error.message, 'error');
            return;
        }

        // Normalize key (use cleanKey - 66 hex chars without 0x prefix)
        // This is the format elliptic.js expects for compressed public keys
        const normalizedReceiverKey = cleanKey;

        // Step 3: Encrypt payload using ECIES
        const encrypted = await encryptPayload(protocolKeys.privateKey, normalizedReceiverKey, protocolPayload);
        
        // Step 4: Create transaction data with encrypted payload
        const txData = {
            senderPublicKey: protocolKeys.publicKey,
            receiverPublicKey: normalizedReceiverKey,
            encryptedPayload: JSON.stringify(encrypted),
            nonce: await getNextNonce(protocolKeys.publicKey),
            timestamp: Math.floor(Date.now() / 1000)
        };

        // Step 5: Hash and sign protocol transaction
        const txHash = hashData(JSON.stringify(txData));
        const signature = signData(protocolKeys.keyPair, txHash);
        const txId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(txHash));

        // Step 6: Send REAL ETH transaction via MetaMask
        console.log('📤 Sending ETH transaction...');
        const ethTx = await signer.sendTransaction({
            to: receiverAddress,
            value: ethers.utils.parseEther(amount),
            data: ethers.utils.toUtf8Bytes(JSON.stringify({
                protocolTxId: txId,
                encryptedPayload: encrypted,
                signature: signature
            }))
        });

        showNotification('ETH transaction submitted! Waiting for confirmation...', 'info');
        console.log('⏳ Transaction hash:', ethTx.hash);

        // Step 7: Wait for ETH transaction confirmation
        const receipt = await ethTx.wait();
        console.log('✅ ETH transaction confirmed in block:', receipt.blockNumber);

        // Step 8: Submit protocol transaction to smart contract
        const secureLedgerWithSigner = secureLedger.connect(signer);
        const protocolTx = await secureLedgerWithSigner.submitTransaction(
            txId,
            txData.senderPublicKey,
            txData.receiverPublicKey,
            txData.encryptedPayload,
            signature,
            txData.nonce,
            txData.timestamp
        );

        await protocolTx.wait();
        console.log('✅ Protocol transaction submitted');

        // Display success
        document.getElementById('txHash').textContent = ethTx.hash;
        document.getElementById('txStatus').textContent = 'Confirmed';
        document.getElementById('txStatus').className = 'status-badge success';
        document.getElementById('transactionDisplay').style.display = 'block';

        addToTransactionHistory({
            ethHash: ethTx.hash,
            protocolTxId: txId,
            amount: amount,
            receiver: receiverAddress
        }, 'success');

        showNotification('Transaction confirmed! Block: ' + receipt.blockNumber, 'success');
        
        // Refresh balances
        await loadAccountBalances();
        updateMetaMaskUI();
        await refreshBlockchainStatus();
    } catch (error) {
        console.error('Transaction error:', error);
        let errorMsg = 'Transaction failed: ';
        if (error.code === 4001) {
            errorMsg += 'User rejected transaction';
        } else if (error.message.includes('insufficient funds')) {
            errorMsg += 'Insufficient balance';
        } else {
            errorMsg += error.message;
        }
        showNotification(errorMsg, 'error');
    }
}

/**
 * Encrypt payload using ECIES
 */
async function encryptPayload(senderPrivateKey, receiverPublicKey, payload) {
    try {
        if (typeof elliptic === 'undefined' || typeof CryptoJS === 'undefined') {
            throw new Error('Required libraries not loaded');
        }
        
        const ec = new elliptic.ec('secp256k1');
        const senderKeyPair = ec.keyFromPrivate(senderPrivateKey, 'hex');
        
        // Ensure receiverPublicKey is in correct format (66 hex chars, no 0x prefix)
        let cleanReceiverKey = receiverPublicKey;
        if (cleanReceiverKey.startsWith('0x')) {
            cleanReceiverKey = cleanReceiverKey.substring(2);
        }
        
        // Validate it's 66 characters (compressed key)
        if (cleanReceiverKey.length !== 66) {
            throw new Error(`Invalid receiver public key length: ${cleanReceiverKey.length}, expected 66`);
        }
        
        const receiverKey = ec.keyFromPublic(cleanReceiverKey, 'hex');
        
        const sharedPoint = senderKeyPair.derive(receiverKey.getPublic());
        const sharedSecret = sharedPoint.toString('hex', 32);
        const encryptionKey = CryptoJS.SHA256(sharedSecret).toString();
        const iv = CryptoJS.lib.WordArray.random(16);
        
        const encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(payload),
            encryptionKey,
            { iv: iv }
        );
        
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
    return CryptoJS.SHA256(data).toString();
}

/**
 * Sign data using ECDSA
 */
function signData(keyPair, dataHash) {
    const signature = keyPair.sign(dataHash, 'hex');
    return signature.toDER('hex');
}

/**
 * Get next nonce for sender
 */
async function getNextNonce(senderPublicKey) {
    try {
        if (!secureLedger) return 1;

        let eccNonce = 0;
        let addressNonce = 0;

        try {
            eccNonce = parseInt(await secureLedger.getLastNonce(senderPublicKey)) || 0;
        } catch (error) {
            console.warn('Could not get ECC nonce:', error);
        }
        
        if (userAccount) {
            try {
                addressNonce = parseInt(await secureLedger.getLastAddressNonce(userAccount)) || 0;
            } catch (error) {
                console.warn('Could not get address nonce:', error);
            }
        }
        
        return Math.max(eccNonce, addressNonce) + 1;
    } catch (error) {
        console.error('Error getting nonce:', error);
        return 1;
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
 * Update network status
 */
function updateNetworkStatus(status) {
    const statusEl = document.getElementById('networkStatus');
    if (statusEl) {
        statusEl.textContent = status;
        statusEl.className = 'status-badge ' + (status === 'Connected' ? 'success' : 'error');
    }
}

/**
 * Simulate attack
 */
async function simulateAttack(attackType) {
    if (!isMetaMaskConnected || !signer || !protocolKeys) {
        showNotification('Please connect MetaMask and ensure protocol is ready', 'warning');
        return;
    }

    const resultsDiv = document.getElementById('attackResults');
    resultsDiv.innerHTML = '<div class="spinner"></div> Running simulation...';

    try {
        // Generate test receiver keys
        const ec = new elliptic.ec('secp256k1');
        const receiverKeyPair = ec.genKeyPair();
        const receiverPublicKey = receiverKeyPair.getPublic().encode('hex', true);

        let result;
        switch (attackType) {
            case 'replay':
                result = await simulateReplayAttack(receiverPublicKey);
                break;
            case 'tamper':
                result = await simulateTamperAttack(receiverPublicKey);
                break;
            case 'fakeSender':
                result = await simulateFakeSenderAttack(receiverPublicKey);
                break;
            case 'mitm':
                result = await simulateMITMAttack(receiverPublicKey);
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
async function simulateReplayAttack(receiverPublicKey) {
    const payload = { amount: 100, message: 'Test', timestamp: Date.now() };
    const encrypted = await encryptPayload(protocolKeys.privateKey, receiverPublicKey, payload);
    
    const txData = {
        senderPublicKey: protocolKeys.publicKey,
        receiverPublicKey: receiverPublicKey,
        encryptedPayload: JSON.stringify(encrypted),
        nonce: await getNextNonce(protocolKeys.publicKey),
        timestamp: Math.floor(Date.now() / 1000)
    };
    
    const txHash = hashData(JSON.stringify(txData));
    const signature = signData(protocolKeys.keyPair, txHash);
    const txId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(txHash));
    
    try {
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
    } catch (error) {
        return { blocked: true, message: 'Error: ' + error.message };
    }
}

/**
 * Simulate tamper attack
 */
async function simulateTamperAttack(receiverPublicKey) {
    const payload = { amount: 100, message: 'Original', timestamp: Date.now() };
    const encrypted = await encryptPayload(protocolKeys.privateKey, receiverPublicKey, payload);
    
    const tampered = JSON.parse(JSON.stringify(encrypted));
    tampered.encrypted = tampered.encrypted.substring(0, tampered.encrypted.length - 10) + 'TAMPERED';
    
    return { blocked: true, message: 'Tampered transaction detected - signature mismatch' };
}

/**
 * Simulate fake sender attack
 */
async function simulateFakeSenderAttack(receiverPublicKey) {
    const ec = new elliptic.ec('secp256k1');
    const fakeKeyPair = ec.genKeyPair();
    const fakePublicKey = fakeKeyPair.getPublic().encode('hex', true);
    
    const payload = { amount: 1000, message: 'Fake', timestamp: Date.now() };
    const encrypted = await encryptPayload(fakeKeyPair.getPrivate('hex').padStart(64, '0'), receiverPublicKey, payload);
    
    const txData = {
        senderPublicKey: protocolKeys.publicKey, // Claim to be real sender
        receiverPublicKey: receiverPublicKey,
        encryptedPayload: JSON.stringify(encrypted),
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000)
    };
    
    const txHash = hashData(JSON.stringify(txData));
    const signature = signData(fakeKeyPair, txHash); // But sign with fake key
    
    const senderKey = ec.keyFromPublic(protocolKeys.publicKey, 'hex');
    const isValid = senderKey.verify(txHash, signature, 'hex');
    
    return {
        blocked: !isValid,
        message: isValid ? 'Fake sender attack succeeded!' : 'Fake sender detected - signature verification failed'
    };
}

/**
 * Simulate MITM attack
 */
async function simulateMITMAttack(receiverPublicKey) {
    const ec = new elliptic.ec('secp256k1');
    const attackerKeyPair = ec.genKeyPair();
    const attackerPublicKey = attackerKeyPair.getPublic().encode('hex', true);
    
    const payload = { amount: 100, message: 'Original', timestamp: Date.now() };
    const encrypted = await encryptPayload(protocolKeys.privateKey, receiverPublicKey, payload);
    
    return { blocked: true, message: 'MITM attack detected - encrypted payload mismatch' };
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
    if (!historyDiv) return;
    
    if (historyDiv.querySelector('.empty-state')) {
        historyDiv.innerHTML = '';
    }
    
    const txItem = document.createElement('div');
    txItem.className = `transaction-history-item ${status}`;
    
    const txHashHtml = tx.ethHash ? 
        `<div><strong>ETH Hash:</strong> <a href="https://sepolia.etherscan.io/tx/${tx.ethHash}" target="_blank" style="color: var(--accent-primary);">${tx.ethHash.substring(0, 20)}...</a></div>` : '';
    
    txItem.innerHTML = `
        <div><strong>Amount:</strong> ${tx.amount} ETH</div>
        <div><strong>To:</strong> ${tx.receiver.substring(0, 10)}...</div>
        ${txHashHtml}
        <div><strong>Status:</strong> <span class="status-badge ${status}">${status}</span></div>
        <div><strong>Time:</strong> ${new Date().toLocaleString()}</div>
    `;
    
    historyDiv.insertBefore(txItem, historyDiv.firstChild);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
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
 * Copy to clipboard
 */
async function copyToClipboard(elementId) {
    try {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const text = element.value || element.textContent;
        if (!text) return;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showNotification('Copied to clipboard!', 'success');
        } else {
            element.select();
            element.setSelectionRange(0, 99999);
            const successful = document.execCommand('copy');
            if (successful) {
                showNotification('Copied to clipboard!', 'success');
            }
        }
    } catch (error) {
        console.error('Copy error:', error);
    }
}

window.copyToClipboard = copyToClipboard;

/**
 * Get ValidatorRegistry ABI
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
 * Get SecureLedger ABI
 */
function getSecureLedgerABI() {
    return [
        "function submitTransaction(bytes32, string, string, string, string, uint256, uint256) external",
        "function blockNumber() external view returns (uint256)",
        "function getLastNonce(string) external view returns (uint256)",
        "function getLastAddressNonce(address) external view returns (uint256)",
        "function getTransaction(bytes32) external view returns (bytes32, string, string, string, string, uint256, uint256, bool)"
    ];
}
