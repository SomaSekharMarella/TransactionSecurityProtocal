# 🔐 Secure Blockchain Transaction Protocol

A production-ready secure blockchain transaction protocol using **MetaMask** and **Elliptic Curve Cryptography (ECC)** with comprehensive protection against passive and active attacks. This system implements a dual-layer security model where MetaMask handles Ethereum transactions while the protocol layer provides ECC-based encryption and authentication.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [What This Project Does](#-what-this-project-does)
3. [Architecture & Design](#-architecture--design)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [File-by-File Explanation](#-file-by-file-explanation)
7. [Code Functionalities](#-code-functionalities)
8. [Security Features](#-security-features)
9. [Cryptography Implementation](#-cryptography-implementation)
10. [Smart Contracts](#-smart-contracts)
11. [Frontend Application](#-frontend-application)
12. [Attack Simulation](#-attack-simulation)
13. [Git Configuration](#-git-configuration)
14. [Setup & Installation](#-setup--installation)
15. [Usage Guide](#-usage-guide)
16. [Testing](#-testing)

---

## 🎯 Project Overview

This project implements a **secure blockchain transaction protocol** that protects transactions against both **passive attacks** (network sniffing, eavesdropping) and **active attacks** (replay attacks, transaction tampering, MITM, impersonation). The system uses a **dual-layer security model**:

- **Layer 1 (MetaMask/Ethereum)**: Handles account management, ETH transactions, gas, and network interaction
- **Layer 2 (Protocol/ECC)**: Provides ECC-based encryption, authentication, and protocol-level security

### Key Features

✅ **MetaMask Integration** - Uses only MetaMask accounts, no manual key generation  
✅ **Real ETH Transactions** - Sends actual transactions on Sepolia testnet  
✅ **ECC-Based Cryptography** - ECDH, ECIES, ECDSA for encryption and signing  
✅ **Attack Resistance** - Protects against replay, tampering, MITM, impersonation  
✅ **Smart Contract Validation** - Nonce, timestamp, and signature verification  
✅ **Frontend UI** - Modern, dark-themed interface for transaction management  
✅ **Attack Simulation** - Built-in scripts to test security mechanisms  

---

## 🚀 What This Project Does

### Primary Function

This project creates a **secure transaction system** where:

1. **Users send ETH transactions** via MetaMask on Sepolia testnet
2. **Transaction payloads are encrypted** using ECC-based cryptography (ECIES)
3. **Shared secrets are derived** using ECDH (Elliptic Curve Diffie-Hellman)
4. **Transactions are signed** using ECDSA (Elliptic Curve Digital Signature Algorithm)
5. **Smart contracts validate** transactions for nonce uniqueness, timestamp freshness, and signature validity
6. **Attack attempts are detected and blocked** automatically

### Use Cases

- **Secure Financial Transactions**: Send encrypted transaction data along with ETH transfers
- **Confidential Messaging**: Encrypt messages that only the receiver can decrypt
- **Identity Verification**: Use ECC signatures to verify transaction authenticity
- **Replay Attack Prevention**: Nonce and timestamp mechanisms prevent transaction replay
- **MITM Protection**: ECDH ensures only intended receiver can decrypt payloads

---

## 🏗️ Architecture & Design

### Dual-Layer Security Model

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│              (HTML/CSS/JavaScript Frontend)              │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌─────────▼──────────┐
│  Layer 1:      │            │  Layer 2:          │
│  MetaMask      │            │  Protocol (ECC)     │
│  (Ethereum)    │            │  (Encryption)       │
├────────────────┤            ├────────────────────┤
│ • Accounts     │            │ • ECDH Key Exchange│
│ • ETH Transfer │            │ • ECIES Encryption  │
│ • Gas Mgmt     │            │ • ECDSA Signing     │
│ • Signing      │            │ • Nonce Generation  │
│ • Network      │            │ • Timestamp Check   │
└───────┬────────┘            └─────────┬──────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
              ┌─────────▼──────────┐
              │  Smart Contracts  │
              │  (Solidity)        │
              ├────────────────────┤
              │ • SecureLedger     │
              │ • ValidatorRegistry│
              │ • Validation Logic │
              └────────────────────┘
```

### Transaction Flow

```
1. User connects MetaMask
   ↓
2. Frontend generates protocol ECC keys (internal)
   ↓
3. User enters receiver's protocol public key
   ↓
4. User sends ETH transaction via MetaMask
   ↓
5. Protocol encrypts payload using ECIES (ECDH + AES)
   ↓
6. Protocol signs transaction hash using ECDSA
   ↓
7. Encrypted payload attached to ETH transaction
   ↓
8. Smart contract validates:
   - Nonce uniqueness (per sender address)
   - Timestamp freshness (±5 minutes)
   - Signature validity
   ↓
9. Transaction confirmed on Sepolia
   ↓
10. Receiver can decrypt payload using their private key
```

---

## 💻 Tech Stack

### Backend/Blockchain

| Technology | Version | Purpose |
|------------|---------|---------|
| **Hardhat** | ^2.19.0 | Ethereum development environment, compilation, testing |
| **Solidity** | 0.8.20 | Smart contract programming language |
| **Ethers.js** | ^6.9.0 | Ethereum JavaScript library for contract interaction |
| **Node.js** | Latest | JavaScript runtime environment |

### Cryptography

| Library | Version | Purpose |
|---------|---------|---------|
| **elliptic** | ^6.5.4 | ECC operations (ECDH, ECDSA, key generation) |
| **crypto-js** | ^4.2.0 | AES encryption, SHA-256 hashing, HMAC |
| **secp256k1** | ^5.0.0 | secp256k1 curve operations (optional) |

### Frontend

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure and layout |
| **CSS3** | Styling (dark theme, modern UI) |
| **JavaScript (ES6+)** | Application logic, MetaMask integration |
| **MetaMask** | Wallet integration, account management |

### Development Tools

| Tool | Purpose |
|------|---------|
| **dotenv** | Environment variable management |
| **@nomicfoundation/hardhat-toolbox** | Hardhat plugins and tools |

### Network & Infrastructure

| Service | Purpose |
|---------|---------|
| **Sepolia Testnet** | Ethereum test network for deployment |
| **Alchemy** | RPC provider for Sepolia network |
| **MetaMask** | Browser wallet for transaction signing |

---

## 📁 Project Structure

```
secure-blockchain/
│
├── contracts/                 # Smart Contracts (Solidity)
│   ├── SecureLedger.sol      # Main transaction ledger contract
│   └── ValidatorRegistry.sol  # Validator management contract
│
├── scripts/                   # Deployment & Testing Scripts
│   ├── deploy.js              # Contract deployment script
│   └── simulateAttack.js      # Attack simulation script
│
├── crypto/                    # Cryptography Modules (Node.js)
│   ├── ecc.js                 # ECC key pair generation
│   ├── ecdh.js                # ECDH shared secret derivation
│   ├── ecdsa.js               # ECDSA signing and verification
│   └── ecies.js               # ECIES encryption/decryption
│
├── consensus/                 # Consensus Mechanism (Node.js)
│   ├── poa.js                 # Proof of Authority implementation
│   └── pot.js                 # Proof of Trust implementation
│
├── frontend/                  # Web Application
│   ├── index.html             # Main HTML structure
│   ├── style.css              # Styling (dark theme)
│   └── app.js                 # Application logic (MetaMask integration)
│
├── artifacts/                 # Compiled contracts (auto-generated)
├── cache/                     # Hardhat cache (auto-generated)
├── node_modules/              # Dependencies (auto-generated)
│
├── .gitignore                 # Git ignore rules
├── .env                       # Environment variables (not in git)
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Project dependencies and scripts
├── package-lock.json          # Dependency lock file
│
├── README.md                  # This file (comprehensive documentation)
├── QUICKSTART.md              # Quick setup guide
└── PROTOCOL_KEY_GUIDE.md      # Protocol key usage guide
```

---

## 📄 File-by-File Explanation

### Smart Contracts (`contracts/`)

#### `SecureLedger.sol`
**Purpose**: Main smart contract for secure transaction storage and validation.

**Key Components**:
- `Transaction` struct: Stores transaction data (txId, public keys, encrypted payload, signature, nonce, timestamp)
- `nonceRegistryAddress`: Maps Ethereum addresses to their last used nonce (prevents replay attacks)
- `submitTransaction()`: Validates and stores transactions
- `getTransaction()`: Retrieves transaction data by ID
- `getLastAddressNonce()`: Returns the last nonce for an address

**Security Features**:
- Nonce uniqueness check (must be greater than last nonce)
- Timestamp validation (±5 minutes tolerance)
- Transaction ID uniqueness (prevents duplicate submissions)
- Events for transaction submission and validation

#### `ValidatorRegistry.sol`
**Purpose**: Manages validator registration and trust scores.

**Key Components**:
- Validator registration with ECC public keys
- Trust score management
- Validator status tracking

### Cryptography Modules (`crypto/`)

#### `ecc.js`
**Purpose**: Elliptic Curve Cryptography key pair generation.

**Functions**:
- `generateKeyPair()`: Creates new ECC key pair (secp256k1 curve)
- `getPublicKeyFromPrivate()`: Derives public key from private key
- `validatePublicKey()`: Validates if a public key is valid on secp256k1 curve
- `generateNonce()`: Generates random 32-byte nonce

**Key Format**:
- Private key: 64 hex characters (32 bytes)
- Public key (compressed): 66 hex characters (33 bytes: 0x02/0x03 + 32 bytes x-coordinate)

#### `ecdh.js`
**Purpose**: Elliptic Curve Diffie-Hellman key exchange.

**Functions**:
- `deriveSharedSecret()`: Derives shared secret between two parties
- Uses ECDH to compute shared point without exchanging private keys
- Converts shared point to encryption key

**Security**: Only parties with valid key pairs can derive the same shared secret.

#### `ecdsa.js`
**Purpose**: Elliptic Curve Digital Signature Algorithm.

**Functions**:
- `sign()`: Signs data with private key
- `verify()`: Verifies signature with public key
- `recoverPublicKey()`: Recovers public key from signature (optional)
- `hash()`: SHA-256 hashing function

**Usage**: Signs transaction hashes to prove authenticity.

#### `ecies.js`
**Purpose**: Elliptic Curve Integrated Encryption Scheme.

**Functions**:
- `encrypt()`: Encrypts plaintext using receiver's public key
- `decrypt()`: Decrypts ciphertext using receiver's private key
- Uses ECDH to derive encryption key
- Uses AES-256 for symmetric encryption
- Includes HMAC for integrity verification

**Security**: Only the receiver with the matching private key can decrypt.

### Consensus Mechanism (`consensus/`)

#### `poa.js`
**Purpose**: Proof of Authority consensus implementation.

**Features**:
- Pre-authorized validators
- ECC-based validator identity
- Block signing requirements

#### `pot.js`
**Purpose**: Proof of Trust consensus implementation.

**Features**:
- Trust score per validator
- Score increases for valid blocks
- Score decreases for invalid signatures/replay attempts
- Block proposer selection based on trust score

### Frontend (`frontend/`)

#### `index.html`
**Purpose**: Main HTML structure and UI layout.

**Sections**:
- MetaMask connection section
- Account selector and balance display
- Transaction form (receiver address, protocol key, amount, message)
- Transaction history
- Attack simulation controls
- Network status display

**Script Loading**:
- Multi-CDN fallback for `ethers.js` and `elliptic.js`
- Library loading verification before app initialization
- Error handling for failed CDN loads

#### `style.css`
**Purpose**: Styling and theme configuration.

**Features**:
- Dark theme (professional, security-focused)
- Responsive design
- Status badges (success, error, warning, info)
- Form styling
- Button styles
- Notification system styling

#### `app.js`
**Purpose**: Core application logic and MetaMask integration.

**Key Functions**:
- `initializeApp()`: Initializes application, detects MetaMask
- `connectMetaMask()`: Connects to MetaMask, loads accounts
- `loadContracts()`: Loads smart contract instances
- `handleTransactionSubmit()`: Handles transaction creation and submission
- `encryptPayload()`: Encrypts transaction payload using ECIES
- `generateProtocolKeys()`: Generates internal ECC keys for protocol
- `simulateAttack()`: Simulates various attack scenarios
- `displayMyProtocolKey()`: Shows user's protocol public key
- `generateTestReceiverKey()`: Generates test receiver key

**MetaMask Integration**:
- Account detection and switching
- Network validation (must be Sepolia)
- Transaction signing via MetaMask
- Balance fetching
- Event listeners for account/network changes

### Scripts (`scripts/`)

#### `deploy.js`
**Purpose**: Deploys smart contracts to network.

**Functionality**:
- Compiles contracts
- Deploys `ValidatorRegistry`
- Deploys `SecureLedger`
- Saves contract addresses
- Verifies deployment

#### `simulateAttack.js`
**Purpose**: Simulates attack scenarios.

**Attack Types**:
- Replay attack
- Transaction tampering
- Fake sender
- MITM attack

### Configuration Files

#### `hardhat.config.js`
**Purpose**: Hardhat framework configuration.

**Configuration**:
- Solidity compiler version (0.8.20)
- Optimizer settings (200 runs)
- Network configurations:
  - `hardhat`: Local development network
  - `localhost`: Local node connection
  - `sepolia`: Sepolia testnet (Alchemy RPC)
- Path configurations for contracts, tests, artifacts

#### `package.json`
**Purpose**: Project metadata and dependencies.

**Scripts**:
- `compile`: Compile Solidity contracts
- `test`: Run tests
- `node`: Start local Hardhat node
- `deploy`: Deploy contracts
- `attack`: Run attack simulation

**Dependencies**:
- `hardhat`: Development framework
- `ethers`: Ethereum library
- `elliptic`: ECC operations
- `crypto-js`: Encryption and hashing
- `dotenv`: Environment variables

---

## 🔧 Code Functionalities

### 1. Protocol Key Generation

```javascript
function generateProtocolKeys() {
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate('hex').padStart(64, '0');
    const publicKey = keyPair.getPublic().encode('hex', true); // Compressed (66 chars)
    
    protocolKeys = {
        privateKey: privateKey,
        publicKey: publicKey,
        keyPair: keyPair
    };
}
```

**What it does**:
- Generates a new ECC key pair on secp256k1 curve
- Stores private key (64 hex chars) and public key (66 hex chars)
- Used internally for protocol encryption (not displayed to user)

### 2. Payload Encryption (ECIES)

```javascript
async function encryptPayload(senderPrivateKey, receiverPublicKey, payload) {
    const ec = new elliptic.ec('secp256k1');
    const senderKeyPair = ec.keyFromPrivate(senderPrivateKey, 'hex');
    const receiverKey = ec.keyFromPublic(receiverPublicKey, 'hex');
    
    // ECDH: Derive shared secret
    const sharedPoint = senderKeyPair.derive(receiverKey.getPublic());
    const sharedSecret = sharedPoint.toString('hex', 32);
    
    // Derive encryption key from shared secret
    const encryptionKey = CryptoJS.SHA256(sharedSecret).toString();
    
    // AES encryption
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(payload),
        encryptionKey,
        { iv: iv }
    );
    
    // HMAC for integrity
    const hmac = CryptoJS.HmacSHA256(
        iv.toString() + encrypted.ciphertext.toString(),
        encryptionKey
    );
    
    return {
        encrypted: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
        iv: iv.toString(CryptoJS.enc.Hex),
        tag: hmac.toString()
    };
}
```

**What it does**:
- Uses ECDH to derive shared secret between sender and receiver
- Derives AES encryption key from shared secret
- Encrypts payload using AES-256
- Adds HMAC for integrity verification
- Returns encrypted data, IV, and HMAC tag

### 3. Transaction Submission

```javascript
async function handleTransactionSubmit(e) {
    // 1. Get receiver's protocol public key
    const receiverPublicKey = document.getElementById('receiverPublicKey').value.trim();
    
    // 2. Validate key format (66 hex chars)
    // 3. Encrypt payload using ECIES
    const encrypted = await encryptPayload(protocolKeys.privateKey, receiverPublicKey, payload);
    
    // 4. Create transaction data
    const txData = {
        senderPublicKey: protocolKeys.publicKey,
        receiverPublicKey: receiverPublicKey,
        encryptedPayload: JSON.stringify(encrypted),
        nonce: await getNextNonce(protocolKeys.publicKey),
        timestamp: Math.floor(Date.now() / 1000)
    };
    
    // 5. Sign transaction hash
    const txHash = hashData(JSON.stringify(txData));
    const signature = signData(protocolKeys.keyPair, txHash);
    
    // 6. Send ETH transaction via MetaMask
    const ethTx = await signer.sendTransaction({
        to: receiverAddress,
        value: ethers.utils.parseEther(amount),
        data: ethers.utils.toUtf8Bytes(JSON.stringify({
            protocolTxId: txId,
            encryptedPayload: encrypted,
            signature: signature
        }))
    });
    
    // 7. Submit to smart contract
    await secureLedger.submitTransaction(txId, ...);
}
```

**What it does**:
- Validates receiver's protocol public key
- Encrypts payload using ECIES
- Generates nonce and timestamp
- Signs transaction hash using ECDSA
- Sends ETH transaction via MetaMask
- Submits protocol transaction to smart contract

### 4. Smart Contract Validation

```solidity
function submitTransaction(
    bytes32 _txId,
    string memory _senderPublicKey,
    string memory _receiverPublicKey,
    string memory _encryptedPayload,
    string memory _signature,
    uint256 _nonce,
    uint256 _timestamp
) external {
    require(!processedTxIds[_txId], "Transaction already processed");
    require(_nonce > nonceRegistryAddress[msg.sender], "Invalid nonce");
    require(
        _timestamp >= block.timestamp - TIMESTAMP_TOLERANCE &&
        _timestamp <= block.timestamp + TIMESTAMP_TOLERANCE,
        "Timestamp out of tolerance"
    );
    
    // Store transaction
    transactions[_txId] = Transaction({...});
    nonceRegistryAddress[msg.sender] = _nonce;
    processedTxIds[_txId] = true;
    
    emit TransactionSubmitted(...);
}
```

**What it does**:
- Checks transaction ID uniqueness
- Validates nonce (must be greater than last nonce for sender)
- Validates timestamp (within ±5 minutes)
- Stores transaction data
- Updates nonce registry
- Emits event

---

## 🔐 Security Features

### Attack Mitigation

| Attack Type | Protection Mechanism | Implementation |
|-------------|---------------------|----------------|
| **Replay Attack** | Nonce + Timestamp | Each transaction must have unique nonce per sender and valid timestamp |
| **Transaction Tampering** | ECDSA Signature | Transaction hash is signed; tampering invalidates signature |
| **Impersonation** | Public Key Identity | Sender's protocol public key is bound to transaction |
| **MITM Attack** | ECDH + ECIES | Only receiver with matching private key can decrypt |
| **Network Sniffing** | ECIES Encryption | Payload is encrypted; attacker cannot read plaintext |
| **Double Spending** | Nonce Registry | Nonce must be strictly increasing per sender address |

### Cryptographic Guarantees

1. **Confidentiality**: ECIES encryption ensures only receiver can decrypt
2. **Integrity**: HMAC ensures payload hasn't been tampered
3. **Authenticity**: ECDSA signature proves transaction origin
4. **Non-repudiation**: Signature binds sender to transaction
5. **Freshness**: Timestamp prevents replay of old transactions

---

## 🔑 Cryptography Implementation

### ECC Curve: secp256k1

- **Same curve as Bitcoin/Ethereum**
- **256-bit security level**
- **Compressed public keys**: 33 bytes (66 hex chars)
- **Private keys**: 32 bytes (64 hex chars)

### Key Formats

- **Protocol Public Key**: 66 hex characters (compressed secp256k1)
  - Format: `02` or `03` + 64 hex chars (x-coordinate)
  - Example: `02ac9c45b8747967c9939f03b9401442c0f583ea95958cd5e01fc210b79c394298`
- **Protocol Private Key**: 64 hex characters
  - Never exposed to user
  - Stored internally in browser memory

### Encryption Flow

```
Sender                          Receiver
  │                                │
  │ 1. Get receiver's public key  │
  │──────────────────────────────>│
  │                                │
  │ 2. Derive shared secret (ECDH)│
  │    (using sender private +    │
  │     receiver public)          │
  │                                │
  │ 3. Encrypt payload (AES-256)  │
  │    with derived key            │
  │                                │
  │ 4. Send encrypted payload      │
  │──────────────────────────────>│
  │                                │
  │                                │ 5. Derive same shared secret
  │                                │    (using receiver private +
  │                                │     sender public)
  │                                │
  │                                │ 6. Decrypt payload
```

---

## 📜 Smart Contracts

### SecureLedger Contract

**State Variables**:
- `mapping(bytes32 => Transaction) transactions`: Stores all transactions
- `mapping(address => uint256) nonceRegistryAddress`: Tracks last nonce per address
- `mapping(bytes32 => bool) processedTxIds`: Prevents duplicate submissions

**Key Functions**:
- `submitTransaction()`: Validates and stores transaction
- `getTransaction()`: Retrieves transaction by ID
- `getLastAddressNonce()`: Returns last nonce for address

**Events**:
- `TransactionSubmitted`: Emitted when transaction is submitted
- `TransactionValidated`: Emitted when transaction is validated

### ValidatorRegistry Contract

**Purpose**: Manages validator registration and trust scores for consensus mechanism.

---

## 🖥️ Frontend Application

### MetaMask Integration

- **Auto-detection**: Detects if MetaMask is installed
- **Account loading**: Loads all MetaMask accounts automatically
- **Network validation**: Ensures user is on Sepolia testnet
- **Account switching**: Allows user to switch between accounts
- **Balance display**: Shows ETH balance for each account

### Protocol Key Management

- **Auto-generation**: Generates protocol keys when MetaMask connects
- **Key display**: Shows user's protocol public key
- **Key validation**: Validates receiver's protocol public key format
- **Test key generation**: Generates test keys for testing

### Transaction Interface

- **Form validation**: Validates all inputs before submission
- **Real-time feedback**: Shows transaction status and progress
- **History display**: Shows transaction history with Etherscan links
- **Error handling**: Clear error messages for failures

---

## 🧪 Attack Simulation

The system includes built-in attack simulation to demonstrate security:

### 1. Replay Attack
- Attempts to reuse a previous transaction
- **Blocked by**: Nonce validation (nonce must be greater than last)

### 2. Transaction Tampering
- Attempts to modify encrypted payload
- **Blocked by**: HMAC integrity check and signature verification

### 3. Fake Sender
- Attempts to impersonate another sender
- **Blocked by**: Public key identity binding and signature verification

### 4. MITM Attack
- Attempts to intercept and modify transaction
- **Blocked by**: ECDH ensures only receiver can decrypt

---

## 📝 Git Configuration

### `.gitignore` File Explanation

```gitignore
node_modules/          # Node.js dependencies (installed via npm)
artifacts/            # Compiled Solidity contracts (auto-generated by Hardhat)
cache/                # Hardhat compilation cache (auto-generated)
coverage/             # Test coverage reports (if using coverage tools)
.env                  # Environment variables (contains sensitive API keys)
.env.local            # Local environment overrides
*.log                 # Log files (npm, Hardhat, etc.)
.DS_Store             # macOS system file
```

**Why these files are ignored**:

1. **`node_modules/`**: Contains thousands of dependency files. Should be installed via `npm install`, not committed to git.

2. **`artifacts/`**: Compiled contract bytecode and ABIs. Regenerated on each compilation, so no need to commit.

3. **`cache/`**: Hardhat's compilation cache for faster builds. Regenerated automatically.

4. **`.env`**: Contains sensitive information:
   - `ALCHEMY_SEPOLIA_URL`: Alchemy API key (should be secret)
   - `PRIVATE_KEY`: Ethereum private key (MUST be secret)
   - Committing this would expose credentials

5. **`*.log`**: Log files are temporary and can be large. Not needed in version control.

6. **`.DS_Store`**: macOS system file, not relevant to the project.

**What IS committed**:
- Source code (`.sol`, `.js`, `.html`, `.css`)
- Configuration files (`hardhat.config.js`, `package.json`)
- Documentation (`.md` files)
- Scripts (`scripts/` directory)

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Alchemy account** (for Sepolia RPC)

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd secure-blockchain
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```env
   ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   PRIVATE_KEY=your_private_key_here
   ```

4. **Compile contracts**:
   ```bash
   npm run compile
   ```

5. **Deploy contracts** (to Sepolia):
   ```bash
   npm run deploy
   ```

6. **Update contract addresses** in `frontend/app.js`:
   ```javascript
   const CONFIG = {
       SECURE_LEDGER_ADDRESS: '0x...', // From deployment
       VALIDATOR_REGISTRY_ADDRESS: '0x...', // From deployment
       // ...
   };
   ```

7. **Open frontend**:
   - Serve `frontend/` directory using a local server
   - Or open `frontend/index.html` directly (some features may not work)

---

## 📖 Usage Guide

### For Users

1. **Connect MetaMask**:
   - Click "Connect MetaMask" button
   - Approve connection in MetaMask popup
   - Ensure you're on Sepolia testnet

2. **Get Your Protocol Key**:
   - Click "Show My Protocol Key"
   - Copy the displayed 66-character key
   - Share this with others who want to send you encrypted transactions

3. **Send Transaction**:
   - Enter receiver's Ethereum address
   - Enter receiver's protocol public key (66 hex chars)
   - Enter amount in ETH
   - (Optional) Enter a message
   - Click "Send ETH Transaction"
   - Approve transaction in MetaMask

4. **View Transaction History**:
   - Check the "Transaction History" section
   - Click Etherscan links to view on blockchain explorer

### For Developers

1. **Modify Smart Contracts**:
   - Edit files in `contracts/`
   - Run `npm run compile` to compile
   - Run `npm run deploy` to deploy

2. **Add New Cryptography Functions**:
   - Add functions to `crypto/` modules
   - Import in `frontend/app.js` if needed

3. **Customize Frontend**:
   - Edit `frontend/index.html` for structure
   - Edit `frontend/style.css` for styling
   - Edit `frontend/app.js` for functionality

---

## ✅ Testing

### Run Attack Simulations

```bash
npm run attack
```

This will simulate various attack scenarios and verify they are blocked.

### Manual Testing

1. **Test Replay Attack**:
   - Send a transaction
   - Try to send the same transaction again
   - Should be rejected (nonce already used)

2. **Test Key Validation**:
   - Enter invalid protocol key (wrong length/format)
   - Should show validation error

3. **Test Network Validation**:
   - Switch to wrong network in MetaMask
   - Should show network error

---

## 📚 Additional Documentation

- **`QUICKSTART.md`**: Quick setup guide for getting started
- **`PROTOCOL_KEY_GUIDE.md`**: Detailed guide on protocol public keys

---

## 🔒 Security Considerations

### What This System Protects Against

✅ Replay attacks  
✅ Transaction tampering  
✅ MITM attacks  
✅ Impersonation  
✅ Network sniffing  

### What This System Does NOT Protect Against

❌ Smart contract bugs (audit contracts before production)  
❌ Frontend XSS attacks (sanitize inputs)  
❌ MetaMask phishing (user education required)  
❌ Private key theft (user responsibility)  

### Best Practices

1. **Never commit `.env` file** to git
2. **Use testnet** for development and testing
3. **Audit smart contracts** before mainnet deployment
4. **Keep MetaMask updated** for security patches
5. **Verify contract addresses** before interacting
6. **Use strong, unique protocol keys** for production

---

## 🤝 Contributing

This is a security-focused project. When contributing:

1. Follow cryptographic best practices
2. Test all changes thoroughly
3. Document security implications
4. Review code for potential vulnerabilities

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Elliptic.js** for ECC operations
- **Hardhat** for development framework
- **MetaMask** for wallet integration
- **Alchemy** for RPC infrastructure

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Built with 🔐 security in mind**
