# 🔐 Secure Blockchain Transaction Protocol - Complete Documentation

A production-ready secure blockchain transaction protocol implementing **Vehicle-to-Vehicle (V2V)** and **Vehicle-to-Infrastructure (V2I)** communication with comprehensive protection against 11 attack vectors. This system uses **MetaMask**, **Elliptic Curve Cryptography (ECC)**, and **Solidity smart contracts** to provide a secure, trust-based transaction system on the Sepolia testnet.

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Security Model](#security-model)
5. [Cryptography Implementation](#cryptography-implementation)
6. [Smart Contracts](#smart-contracts)
7. [Frontend Application](#frontend-application)
8. [Attack Protections](#attack-protections)
9. [Trust Management System](#trust-management-system)
10. [Project Structure](#project-structure)
11. [Technology Stack](#technology-stack)
12. [Data Flow](#data-flow)
13. [Key Concepts](#key-concepts)
14. [Configuration](#configuration)
15. [Deployment Architecture](#deployment-architecture)
16. [Integration Points](#integration-points)

---

## Executive Summary

### What This Project Is

This is a **secure blockchain-based transaction protocol** designed for **Intelligent Transportation Systems (ITS)** that enables secure communication between vehicles (V2V) and between vehicles and infrastructure (V2I). The system combines:

- **Blockchain Layer**: Ethereum Sepolia testnet for transaction immutability
- **Cryptography Layer**: ECC-based encryption (ECDH, ECIES, ECDSA) for payload security
- **Trust Layer**: VehicleTrustRegistry for Sybil and DoS attack prevention
- **Validation Layer**: ValidatorRegistry for consensus and transaction validation

### Key Capabilities

✅ **Secure Transactions**: ECC-encrypted payloads attached to ETH transactions  
✅ **Identity Management**: Persistent ECC identity bound to Ethereum addresses  
✅ **Trust Scoring**: Dynamic trust scores (0-100+) with rewards/penalties  
✅ **Attack Resistance**: Protection against 11 attack vectors  
✅ **DoS Protection**: 10-second cooldown and rate limiting (10 tx/min)  
✅ **Sybil Prevention**: One ECC public key per Ethereum address  

### Use Cases

- **Autonomous Vehicle Communication**: Secure data exchange between vehicles
- **Traffic Management**: Vehicle-to-infrastructure communication for traffic optimization
- **Payment Systems**: Secure transaction processing with identity verification
- **Supply Chain**: Trusted vehicle identity for logistics tracking
- **Smart City Integration**: Secure IoT communication for urban infrastructure

---

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                      │
│              (HTML/CSS/JavaScript Frontend)                  │
│  • MetaMask Connection  • Transaction Forms                  │
│  • Attack Simulation    • Trust Status Display              │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌─────────▼──────────┐
│  CRYPTO LAYER  │            │  BLOCKCHAIN LAYER  │
│  (JavaScript)  │            │  (MetaMask/Ethers) │
├────────────────┤            ├────────────────────┤
│ • ECC Key Gen  │            │ • Account Mgmt     │
│ • ECDH Exchange│            │ • ETH Transactions │
│ • ECIES Encrypt│            │ • Gas Management   │
│ • ECDSA Sign   │            │ • Network Connect  │
│ • Session Keys │            │ • Event Listening  │
└───────┬────────┘            └─────────┬──────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
              ┌─────────▼──────────┐
              │  SMART CONTRACT    │
              │  LAYER (Solidity)  │
              ├────────────────────┤
              │ • SecureLedger     │
              │ • VehicleTrust     │
              │ • ValidatorRegistry│
              │ • Event Emission   │
              └────────────────────┘
                        │
              ┌─────────▼──────────┐
              │  SEPOLIA BLOCKCHAIN│
              │  (Ethereum Testnet)│
              └────────────────────┘
```

### Component Interaction Flow

```
User Action (Frontend)
    ↓
MetaMask Signing (Ethereum Layer)
    ↓
ECC Encryption (Crypto Layer)
    ↓
Transaction Submission → SecureLedger Contract
    ↓
VehicleTrustRegistry Check (Registration, Trust, Cooldown)
    ↓
Transaction Validation (Nonce, Timestamp, Signature)
    ↓
Transaction Storage + Trust Score Update
    ↓
Blockchain Confirmation (Sepolia)
    ↓
UI Update (Frontend)
```

---

## Core Components

### 1. Frontend Application (`docs/`)

**Files:**
- `index.html`: Main UI structure
- `app.js`: Core application logic (2,500+ lines)
- `style.css`: Styling and responsive design

**Responsibilities:**
- MetaMask integration and account management
- ECC key generation and persistent storage (localStorage)
- Transaction form handling and validation
- Vehicle registration orchestration
- Attack simulation interface
- Real-time trust status display

**Key Functions:**
```javascript
- initializeProtocolKeys(ethereumAddress) // Persistent ECC identity
- registerVehicleIfNeeded(publicKeyHex, ethereumAddress) // Smart registration
- validateVehicleForTransaction(publicKeyHex) // Pre-transaction checks
- handleTransactionSubmit() // Transaction processing pipeline
- simulateXAttack() // 11 attack simulation functions
```

### 2. Cryptography Module (`crypto/`)

**Files:**
- `ecc.js`: ECC key pair generation (secp256k1)
- `ecdh.js`: Elliptic Curve Diffie-Hellman key exchange
- `ecies.js`: ECIES encryption/decryption
- `ecdsa.js`: ECDSA digital signatures
- `sessionKey.js`: Ephemeral session key generation

**ECC Key Format:**
- **Curve**: secp256k1 (Bitcoin's curve)
- **Private Key**: 64 hex characters (32 bytes)
- **Public Key**: 66 hex characters (compressed format: 0x02/0x03 + 32 bytes)
- **Storage**: localStorage keyed by Ethereum address

**Encryption Flow:**
```
Plaintext → ECDH Shared Secret → AES-256-GCM → Ciphertext + IV + Tag
```

### 3. Smart Contracts (`contracts/`)

#### SecureLedger.sol (Main Transaction Handler)

**Purpose**: Receives, validates, and stores encrypted transactions

**Key Functions:**
- `submitTransaction()`: Main entry point with 10 validation checks
- `validateTransaction()`: Validator-only function for trust score updates
- `proposeBlock()`: Block creation for consensus
- `finalizeBlock()`: Block finalization

**Validation Checks:**
1. Vehicle registration (Sybil prevention)
2. Vehicle not revoked
3. Trust score >= 50
4. Cooldown period passed (10 seconds)
5. Rate limit not exceeded (10 tx/min)
6. Transaction ID uniqueness (replay prevention)
7. Nonce validation (ECC public key)
8. Nonce validation (Ethereum address)
9. Timestamp freshness (±5 minutes)
10. Session key uniqueness (forward secrecy)

**Events:**
```solidity
- TransactionSubmitted(txId, sender, receiver, nonce, timestamp)
- TransactionValidated(txId, isValid, reason)
- BlockProposed(blockNumber, proposer, txCount)
- BlockFinalized(blockNumber, blockHash, proposer)
```

#### VehicleTrustRegistry.sol (Trust Management)

**Purpose**: Manages vehicle identities, trust scores, and attack prevention

**Key Functions:**
- `selfRegisterVehicle(publicKeyHex)`: Public self-registration
- `registerVehicle(publicKeyHex, ethereumAddress)`: Owner-only registration
- `rewardVehicle(publicKeyHex)`: +1 trust score (SecureLedger only)
- `penalizeVehicle(publicKeyHex, reason)`: -10 trust score (SecureLedger only)
- `revokeVehicle(publicKeyHex, reason)`: Immediate revocation
- `canSubmitTransaction(publicKeyHex)`: Cooldown check
- `checkRateLimit(publicKeyHex)`: Rate limit check (10 tx/min)

**Trust Score Rules:**
- **Initial**: 100
- **Valid Transaction**: +1
- **Invalid Transaction**: -10 (replay, tamper, spam)
- **Minimum Threshold**: 50 (below = cannot transact)
- **Revocation Threshold**: 0 (auto-revoke)

**DoS Protection:**
- **Cooldown**: 10 seconds between transactions per vehicle
- **Rate Limit**: 10 transactions per 60-second window

**Sybil Prevention:**
- One ECC public key per Ethereum address
- Binding enforced in `selfRegisterVehicle()`
- Error: "Sybil attack detected: Same address with different public key"

#### ValidatorRegistry.sol (Consensus Management)

**Purpose**: Manages validator registration and trust scores

**Key Functions:**
- `registerValidator(address, publicKeyHex)`: Owner-only registration
- `removeValidator(address)`: Validator removal
- `increaseTrustScore(address)`: +10 for valid blocks
- `decreaseTrustScore(address)`: -20 for invalid blocks

---

## Security Model

### 11 Attack Protections

#### 1. **Replay Attack Prevention**
- **Mechanism**: Nonce + Timestamp validation
- **Implementation**: 
  - ECC public key nonce registry
  - Ethereum address nonce registry
  - Transaction ID uniqueness check
  - Timestamp tolerance: ±5 minutes
- **Status**: ✅ Blocked

#### 2. **MITM (Man-in-the-Middle) Attack Prevention**
- **Mechanism**: ECDH + ECIES + Signature verification
- **Implementation**:
  - ECDH shared secret (only sender+receiver can derive)
  - ECIES encryption (authenticated encryption)
  - ECDSA signature verification (non-repudiation)
- **Status**: ✅ Blocked

#### 3. **Privileged Insider Attack Prevention**
- **Mechanism**: Key separation + Session keys
- **Implementation**:
  - ECC protocol keys separate from Ethereum keys
  - Validators cannot forge signatures without private ECC key
  - Session keys for forward/backward secrecy
- **Status**: ✅ Blocked

#### 4. **Impersonation Attack Prevention**
- **Mechanism**: Public key identity binding + Signature verification
- **Implementation**:
  - ECC public key = unique vehicle identity
  - ECDSA signature proves ownership of private key
  - Cannot impersonate without private key
- **Status**: ✅ Blocked

#### 5. **Physical Vehicle Capture Prevention**
- **Mechanism**: Forward/Backward secrecy via ephemeral session keys
- **Implementation**:
  - Unique session key per transaction
  - Past session keys cannot decrypt future messages
  - Future session keys cannot decrypt past messages
- **Status**: ✅ Protected

#### 6. **Session Key Disclosure Prevention**
- **Mechanism**: Unique session keys per transaction
- **Implementation**:
  - Session key hash stored in contract
  - Session key reuse detection
  - One-time use enforcement
- **Status**: ✅ Blocked

#### 7. **Eavesdropping Attack Prevention**
- **Mechanism**: ECIES encryption (only receiver can decrypt)
- **Implementation**:
  - Payload encrypted with receiver's public key
  - Only receiver's private key can decrypt
  - Network sniffers see only ciphertext
- **Status**: ✅ Protected

#### 8. **Data Integrity Attack Prevention**
- **Mechanism**: HMAC + Digital signatures
- **Implementation**:
  - ECIES authentication tag (HMAC)
  - ECDSA signature over entire transaction
  - Tamper detection on decryption
- **Status**: ✅ Blocked

#### 9. **Sybil Attack Prevention**
- **Mechanism**: VehicleTrustRegistry with one identity per ECC key
- **Implementation**:
  - One ECC public key per Ethereum address
  - Registration binding check
  - Multiple identity attempts blocked
- **Status**: ✅ Blocked

#### 10. **DoS Attack Prevention**
- **Mechanism**: Rate limiting + 10-second cooldown
- **Implementation**:
  - 10-second cooldown per vehicle
  - 10 transactions per 60-second window
  - Automatic rate limit tracking
- **Status**: ✅ Blocked

#### 11. **Trust Management Attack Prevention**
- **Mechanism**: Dynamic trust scoring with revocation
- **Implementation**:
  - Trust score: 0-100+ (starts at 100)
  - Minimum threshold: 50 (below = blocked)
  - Auto-revocation at score 0
  - Manual revocation by owner
- **Status**: ✅ Protected

---

## Cryptography Implementation

### ECC Key Generation

```javascript
// secp256k1 curve (same as Bitcoin)
const ec = new elliptic.ec('secp256k1');
const keyPair = ec.genKeyPair();

// Private key: 64 hex chars (32 bytes)
const privateKey = keyPair.getPrivate('hex').padStart(64, '0');

// Public key: 66 hex chars (compressed format)
const publicKey = keyPair.getPublic().encode('hex', true);
// Format: 0x02 or 0x03 + 32-byte x-coordinate
```

### ECDH Key Exchange

```javascript
// Sender derives shared secret
const senderKeyPair = ec.keyFromPrivate(senderPrivateKey, 'hex');
const receiverPublicKeyObj = ec.keyFromPublic(receiverPublicKey, 'hex');
const sharedPoint = senderKeyPair.derive(receiverPublicKeyObj.getPublic());
const sharedSecret = sharedPoint.toString('hex', 32);

// Both parties derive same secret independently
```

### ECIES Encryption

```javascript
// Encryption: Plaintext → Ciphertext + IV + Tag
const encrypted = encrypt(senderPrivateKey, receiverPublicKey, plaintext);
// Returns: { encrypted: hex, iv: hex, tag: hex, sessionKeyHash: hex }

// Decryption: Ciphertext + IV + Tag → Plaintext
const decrypted = decrypt(receiverPrivateKey, senderPublicKey, encrypted);
// Verifies tag (HMAC) before returning plaintext
```

### ECDSA Signing

```javascript
// Sign transaction hash
const txHash = hashData(JSON.stringify(txData));
const signature = signData(keyPair, txHash);
// Returns: r, s values (hex format)

// Verify signature
const isValid = verifySignature(publicKey, txHash, signature);
```

### Session Key Generation

```javascript
// Ephemeral session key (one per transaction)
const sessionKey = generateSessionKeyHash();
// SHA256 hash of random 32 bytes
// Stored in contract for uniqueness check
```

---

## Smart Contracts

### Contract Interaction Flow

```
Frontend (app.js)
    ↓
Ethers.js Provider (MetaMask)
    ↓
SecureLedger.sol
    ├─→ VehicleTrustRegistry.sol (registration, trust, cooldown)
    ├─→ ValidatorRegistry.sol (validator checks)
    └─→ Event Emission (TransactionSubmitted, etc.)
```

### State Variables (SecureLedger)

```solidity
mapping(bytes32 => Transaction) public transactions;
mapping(string => uint256) public nonceRegistry; // ECC key nonce
mapping(address => uint256) public addressNonceRegistry; // ETH address nonce
mapping(bytes32 => bool) public processedTxIds; // Replay prevention
mapping(bytes32 => bool) public usedSessionKeys; // Session key tracking
mapping(string => bytes32) public lastSessionKey; // Last session key per vehicle
```

### Access Control

```solidity
// SecureLedger → VehicleTrustRegistry
modifier onlySecureLedger() {
    require(msg.sender == secureLedgerAddress);
}

// VehicleTrustRegistry → Only SecureLedger can reward/penalize
function rewardVehicle(...) external onlySecureLedger
function penalizeVehicle(...) external onlySecureLedger
```

---

## Frontend Application

### Key JavaScript Modules

#### Identity Management
```javascript
// Persistent ECC identity (per Ethereum address)
initializeProtocolKeys(ethereumAddress)
  ├─ Load from localStorage: protocolKeys_{address}
  ├─ Validate key format (66 hex chars)
  ├─ Reconstruct elliptic keyPair
  └─ Store in localStorage if new

// Storage format:
{
  privateKey: "64-hex-char",
  publicKey: "66-hex-char",
  ethereumAddress: "0x...",
  createdAt: "ISO-timestamp"
}
```

#### Vehicle Registration
```javascript
// Smart registration (checks before attempting)
registerVehicleIfNeeded(publicKeyHex, ethereumAddress)
  ├─ Check on-chain registration status
  ├─ Verify Ethereum address binding
  ├─ Block if Sybil detected
  └─ Register only if needed

// Called automatically before first transaction
```

#### Transaction Pipeline
```javascript
handleTransactionSubmit()
  ├─ Validate vehicle (registration, trust, cooldown)
  ├─ Encrypt payload (ECIES)
  ├─ Sign transaction (ECDSA)
  ├─ Generate session key hash
  ├─ Submit to SecureLedger contract
  ├─ Wait for confirmation
  └─ Update UI
```

### UI Components

- **MetaMask Connection**: Account selection, balance display, network switching
- **Vehicle Trust Status**: Registration status, trust score, cooldown timer
- **Transaction Form**: Receiver address, ECC public key, amount, message
- **Protocol Identity Display**: Persistent public key with reset option (dev mode)
- **Attack Simulation**: 11 attack buttons with results display
- **Transaction History**: Past transactions with Etherscan links

---

## Attack Protections

### Attack Simulation Functions

All attacks can be simulated in **Test Mode** (local validation) or **Real Mode** (actual blockchain):

```javascript
// Test Mode: Local validation only
simulateReplayAttack(receiverPublicKey, testMode = true)

// Real Mode: Actual blockchain transactions
simulateReplayAttack(receiverPublicKey, testMode = false)
```

### Attack Results

Each attack returns:
```javascript
{
  blocked: true/false,
  message: "Detailed explanation"
}
```

**Blocked = Protection Working** ✅  
**Not Blocked = Security Issue** ❌

---

## Trust Management System

### Trust Score Lifecycle

```
Registration (100) 
    ↓
Valid Transaction → +1 (101, 102, ...)
Invalid Transaction → -10 (90, 80, ...)
    ↓
Below 50 → Cannot Transact (Blocked)
At 0 → Auto-Revoked
```

### Trust Score Updates

**Automatic (SecureLedger):**
- Called after transaction validation
- `rewardVehicle()` on valid transaction (+1)
- `penalizeVehicle(reason)` on invalid transaction (-10)

**Manual (Owner/Validator):**
- `revokeVehicle(reason)` for immediate revocation
- Manual trust score adjustment (if implemented)

### Cooldown & Rate Limiting

**Cooldown:**
- 10 seconds between transactions per vehicle
- Enforced in `canSubmitTransaction()`
- Prevents rapid-fire DoS attempts

**Rate Limit:**
- 10 transactions per 60-second window
- Sliding window implementation
- Reset after window expires

---

## Project Structure

```
Protocal/
├── contracts/              # Solidity smart contracts
│   ├── SecureLedger.sol   # Main transaction handler
│   ├── VehicleTrustRegistry.sol  # Trust management
│   └── ValidatorRegistry.sol     # Validator management
│
├── crypto/                 # Cryptography modules
│   ├── ecc.js             # ECC key generation
│   ├── ecdh.js            # Key exchange
│   ├── ecies.js           # Encryption/decryption
│   ├── ecdsa.js           # Digital signatures
│   └── sessionKey.js      # Session key generation
│
├── docs/                   # Frontend application
│   ├── index.html         # Main UI
│   ├── app.js             # Application logic (2,500+ lines)
│   └── style.css          # Styling
│
├── scripts/                # Deployment & utilities
│   ├── deploy.js          # Contract deployment
│   ├── vehicleTrustInteraction.js  # Registry utilities
│   ├── simulateAttack.js  # Single attack simulation
│   └── simulateAllAttacks.js  # All attacks
│
├── consensus/              # Consensus algorithms (future)
│   ├── poa.js             # Proof of Authority
│   └── pot.js             # Proof of Trust
│
├── hardhat.config.js      # Hardhat configuration
├── package.json           # Dependencies
└── README.md              # This file
```

---

## Technology Stack

### Frontend
- **HTML5/CSS3**: Modern UI with responsive design
- **JavaScript (ES6+)**: Application logic
- **Ethers.js v5**: Ethereum interaction
- **Elliptic.js**: ECC operations (secp256k1)
- **CryptoJS**: HMAC and symmetric encryption

### Blockchain
- **Solidity ^0.8.20**: Smart contract language
- **Hardhat**: Development environment
- **MetaMask**: Wallet and transaction signing
- **Sepolia Testnet**: Ethereum test network

### Cryptography
- **Curve**: secp256k1 (Bitcoin's curve)
- **Encryption**: AES-256-GCM (via ECIES)
- **Key Exchange**: ECDH (Elliptic Curve Diffie-Hellman)
- **Signing**: ECDSA (Elliptic Curve Digital Signature Algorithm)

---

## Data Flow

### Complete Transaction Flow

```
1. User enters transaction details (UI)
   ↓
2. Frontend validates vehicle:
   - Check registration (VehicleTrustRegistry)
   - Check trust score (>= 50)
   - Check cooldown (10 seconds passed)
   - Check rate limit (10 tx/min)
   ↓
3. Encrypt payload (ECIES):
   - Derive shared secret (ECDH)
   - Encrypt with AES-256-GCM
   - Generate session key hash
   ↓
4. Sign transaction (ECDSA):
   - Create transaction data object
   - Hash transaction data
   - Sign with ECC private key
   ↓
5. Submit to MetaMask:
   - Create ETH transaction
   - Include encrypted payload in data
   - User approves in MetaMask
   ↓
6. MetaMask sends ETH transaction
   ↓
7. Frontend calls SecureLedger.submitTransaction():
   - SecureLedger validates (10 checks)
   - VehicleTrustRegistry checks
   - Transaction stored
   - Cooldown updated
   ↓
8. Transaction confirmed on Sepolia
   ↓
9. Validator validates transaction:
   - Decrypt payload (off-chain)
   - Verify signature
   - Check data integrity
   ↓
10. SecureLedger.validateTransaction():
    - Update trust score (+1 or -10)
    - Mark transaction as validated
    ↓
11. UI updates:
    - Show confirmation
    - Update trust status
    - Add to transaction history
```

---

## Key Concepts

### Dual Identity System

**Ethereum Identity:**
- Managed by MetaMask
- Used for ETH transactions and gas
- Stored in MetaMask wallet

**ECC Protocol Identity:**
- Generated once per Ethereum address
- Stored in localStorage
- Used for encryption and signing
- Bound to Ethereum address (Sybil prevention)

### Persistent Identity

**Problem Solved:**
- Previously, new ECC keys generated on each page load
- Caused Sybil errors when trying to re-register

**Solution:**
- Keys stored in localStorage: `protocolKeys_{ethereumAddress}`
- Loaded automatically on MetaMask connection
- Same key reused across sessions
- Can be reset (dev mode only)

### Trust Score System

**Purpose:**
- Reward good behavior (+1 per valid transaction)
- Penalize bad behavior (-10 per invalid transaction)
- Prevent low-trust vehicles from spamming

**Implementation:**
- Starts at 100
- Minimum threshold: 50 (cannot transact below)
- Revocation threshold: 0 (auto-revoked)
- Updated automatically by SecureLedger

---

## Configuration

### Frontend Configuration (`docs/app.js`)

```javascript
const CONFIG = {
    VALIDATOR_REGISTRY_ADDRESS: '0x...',
    VEHICLE_TRUST_REGISTRY_ADDRESS: '0x...',
    SECURE_LEDGER_ADDRESS: '0x...',
    ALCHEMY_RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/...',
    SEPOLIA_CHAIN_ID: 11155111
};
```

### Contract Configuration (Solidity)

```solidity
// VehicleTrustRegistry.sol
uint256 public constant INITIAL_TRUST_SCORE = 100;
uint256 public constant TRUST_SCORE_INCREMENT = 1;
uint256 public constant TRUST_SCORE_DECREMENT = 10;
uint256 public constant MIN_TRUST_SCORE_THRESHOLD = 50;
uint256 public constant TX_COOLDOWN_PERIOD = 10 seconds;
uint256 public constant RATE_LIMIT_WINDOW = 60 seconds;
uint256 public constant MAX_TRANSACTIONS_PER_WINDOW = 10;

// SecureLedger.sol
uint256 public constant TIMESTAMP_TOLERANCE = 300 seconds; // 5 minutes
uint256 public constant BLOCK_TIME = 10 seconds;
uint256 public constant MAX_TRANSACTIONS_PER_BLOCK = 100;
```

---

## Deployment Architecture

### Contract Deployment Order

```
1. ValidatorRegistry
   ↓ (address passed to)
2. VehicleTrustRegistry
   ↓ (address passed to)
3. SecureLedger (both addresses)
   ↓ (address passed back to)
4. VehicleTrustRegistry.setSecureLedgerAddress()
```

### Contract Linking

```javascript
// Deploy script links contracts:
await vehicleTrustRegistry.setSecureLedgerAddress(secureLedgerAddress);

// This allows SecureLedger to call:
- rewardVehicle()
- penalizeVehicle()
- recordTransaction()
```

---

## Integration Points

### MetaMask Integration
- **Account Selection**: Dropdown for multiple accounts
- **Network Switching**: Automatic Sepolia detection
- **Transaction Signing**: User approval via MetaMask popup
- **Event Listening**: Account/network change detection

### Alchemy RPC
- **Provider**: Web3Provider via Alchemy endpoint
- **Read Operations**: Contract view function calls
- **Write Operations**: Transaction submission via MetaMask
- **Event Listening**: Contract event subscriptions

### localStorage
- **Key Format**: `protocolKeys_{ethereumAddress.toLowerCase()}`
- **Data**: JSON with privateKey, publicKey, ethereumAddress, createdAt
- **Lifetime**: Persists across browser sessions
- **Security**: Browser-local only (never sent to server)

---

## Additional Resources

- **Quick Start Guide**: See `QUICKSTART.md` for setup instructions
- **Vehicle Registration Guide**: See `VEHICLE_REGISTRATION_GUIDE.md` for identity management
- **Project Overview**: See `PROJECT_OVERVIEW.md` for simple explanation

---

**Documentation Version**: 1.0  
**Last Updated**: 2024  
**Project Status**: ✅ Production-Ready
