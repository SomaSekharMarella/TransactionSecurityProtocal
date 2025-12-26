# 🔐 Secure Blockchain Transaction Protocol

A complete secure blockchain transaction protocol implementation using Elliptic Curve Cryptography (ECC) with protection against passive and active attacks.

## 📋 Table of Contents

- [Overview](#overview)
- [Security Features](#security-features)
- [Architecture](#architecture)
- [Cryptography Stack](#cryptography-stack)
- [Transaction Protocol](#transaction-protocol)
- [Consensus Mechanism](#consensus-mechanism)
- [Installation](#installation)
- [Usage](#usage)
- [Attack Simulation](#attack-simulation)
- [Security Assumptions](#security-assumptions)
- [Protocol Flow](#protocol-flow)

## 🎯 Overview

This project implements a private blockchain network with:

- **Custom Secure Transaction Protocol** - ECC-based encryption and authentication
- **Lightweight Consensus** - Proof of Authority (PoA) + Proof of Trust (PoT)
- **Attack Resistance** - Protection against replay, tampering, MITM, and impersonation
- **Web Frontend** - User-friendly interface for transaction creation and monitoring

## 🛡️ Security Features

### Cryptography Stack (ECC-Based)

All cryptographic operations use the **secp256k1** elliptic curve:

1. **ECC Key Pair Generation**
   - secp256k1 curve
   - Private/Public key per user and validator
   - Compressed public keys (33 bytes)

2. **ECDSA (Elliptic Curve Digital Signature Algorithm)**
   - Sign every transaction
   - Verify signatures at validator level
   - Reject invalid signatures
   - Signature recovery for identity verification

3. **ECDH (Elliptic Curve Diffie-Hellman)**
   - Derive shared secret between sender and receiver
   - No secret key exchange over network
   - Secure key derivation for encryption

4. **ECIES (Elliptic Curve Integrated Encryption Scheme)**
   - Encrypt transaction payloads
   - Decrypt only by authorized receiver
   - AES-256-CBC encryption with HMAC authentication

5. **Hashing**
   - SHA-256 for transaction hashing
   - Use hashes for signing and block integrity

### Attack Mitigation

The system defends against:

| Attack Type | Mitigation |
|------------|------------|
| **Passive Attacks** | |
| Network sniffing | ECIES encryption - payloads are encrypted |
| **Active Attacks** | |
| Transaction tampering | ECDSA signatures - tampered data fails verification |
| Replay attacks | Nonce + Timestamp - prevents duplicate transactions |
| Impersonation | Public key identity + signature verification |
| MITM | ECDH + signature verification - encrypted payloads tied to receiver |

## 🏗️ Architecture

```
/secure-blockchain
│
├── contracts/
│   ├── SecureLedger.sol          # Main transaction ledger
│   └── ValidatorRegistry.sol     # Validator management
│
├── scripts/
│   ├── deploy.js                 # Contract deployment
│   └── simulateAttack.js         # Attack simulation tests
│
├── crypto/
│   ├── ecc.js                    # ECC key generation
│   ├── ecdsa.js                  # Digital signatures
│   ├── ecdh.js                   # Key exchange
│   └── ecies.js                  # Encryption scheme
│
├── consensus/
│   ├── poa.js                    # Proof of Authority
│   └── pot.js                    # Proof of Trust
│
└── frontend/
    ├── index.html                # Main UI
    ├── style.css                 # Dark theme styling
    └── app.js                    # Frontend logic
```

## 🔐 Cryptography Stack

### ECC Key Generation (`crypto/ecc.js`)

```javascript
const { generateKeyPair } = require('./crypto/ecc');
const keys = generateKeyPair();
// Returns: { privateKey, publicKey, publicKeyHex, ... }
```

### ECDSA Signing (`crypto/ecdsa.js`)

```javascript
const { sign, verify } = require('./crypto/ecdsa');
const signature = sign(privateKey, data);
const isValid = verify(publicKey, data, signature);
```

### ECDH Key Exchange (`crypto/ecdh.js`)

```javascript
const { deriveSharedSecret } = require('./crypto/ecdh');
const sharedSecret = deriveSharedSecret(senderPrivateKey, receiverPublicKey);
```

### ECIES Encryption (`crypto/ecies.js`)

```javascript
const { encrypt, decrypt } = require('./crypto/ecies');
const encrypted = encrypt(senderPrivateKey, receiverPublicKey, plaintext);
const decrypted = decrypt(receiverPrivateKey, senderPublicKey, encrypted);
```

## 📝 Transaction Protocol

### Transaction Structure

```javascript
Transaction {
  txId: bytes32              // Unique transaction identifier
  senderPublicKey: string    // ECC public key of sender
  receiverPublicKey: string  // ECC public key of receiver
  encryptedPayload: string   // ECIES-encrypted transaction data
  signature: string          // ECDSA signature of transaction
  nonce: uint256            // Anti-replay protection
  timestamp: uint256        // Transaction timestamp
}
```

### Transaction Flow (Strict Order)

1. **Sender fetches receiver public key**
   - Public keys are stored on-chain or in a registry
   - No private key exchange

2. **Sender derives shared secret using ECDH**
   ```javascript
   sharedSecret = ECDH(senderPrivateKey, receiverPublicKey)
   ```

3. **Transaction payload is encrypted using ECIES**
   ```javascript
   encrypted = ECIES.encrypt(senderPrivateKey, receiverPublicKey, payload)
   ```

4. **Encrypted payload hash is signed using ECDSA**
   ```javascript
   txHash = SHA256(transactionData)
   signature = ECDSA.sign(senderPrivateKey, txHash)
   ```

5. **Transaction is broadcast to validators**
   - Transaction submitted to SecureLedger contract

6. **Validators verify:**
   - ✅ Signature validity
   - ✅ Nonce uniqueness (must be > last nonce)
   - ✅ Timestamp freshness (within tolerance)
   - ✅ Sender identity (public key validation)

7. **Valid transactions go to block proposal**
   - Validated transactions are included in blocks
   - Invalid transactions are rejected and validator penalized

## ⚖️ Consensus Mechanism

### Modified Proof of Authority (PoA)

- Validators are pre-authorized
- Each validator has ECC identity
- Blocks must be signed by proposer
- Validator selection based on trust score

### Proof of Trust (PoT) - Lightweight

Trust score per validator:

- **Increase** for:
  - Valid block proposals
  - Correct transaction validation

- **Decrease** for:
  - Invalid signatures
  - Replay attempts
  - Double signing
  - Transaction tampering

**Block Proposer Selection:**
1. Highest trust score validator (primary)
2. Round-robin fallback (if trust scores equal)

## 🚀 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hardhat

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Compile contracts:**
   ```bash
   npm run compile
   ```

3. **Start local Hardhat node:**
   ```bash
   npm run node
   ```

4. **Deploy contracts (in new terminal):**
   ```bash
   npm run deploy
   ```

5. **Update frontend configuration:**
   - Edit `frontend/app.js`
   - Update `CONFIG` object with deployed contract addresses

6. **Open frontend:**
   - Open `frontend/index.html` in a web browser
   - Or use a local server: `python -m http.server 8000` (in frontend directory)

## 📖 Usage

### Creating a Transaction

1. **Generate Key Pair:**
   - Click "Generate New Key Pair" in the frontend
   - Save your private key securely (never share it!)

2. **Create Transaction:**
   - Enter receiver's public key
   - Enter amount and optional message
   - Click "Create & Sign Transaction"
   - Transaction is automatically encrypted and signed

3. **Submit Transaction:**
   - Review transaction details
   - Click "Submit to Blockchain"
   - Wait for confirmation

### Running Attack Simulations

```bash
npm run attack
```

This will simulate:
- Replay attacks
- Transaction tampering
- Fake sender public key
- MITM attempts

All attacks should be **blocked** by the system.

## 🧪 Attack Simulation

The system includes comprehensive attack simulation to verify security:

### 1. Replay Attack
- **Attack:** Submit the same transaction twice
- **Defense:** Transaction ID uniqueness check + nonce validation
- **Result:** ✅ Blocked

### 2. Tampered Transaction
- **Attack:** Modify encrypted payload after signing
- **Defense:** Signature verification fails (signature doesn't match modified data)
- **Result:** ✅ Blocked

### 3. Fake Sender Public Key
- **Attack:** Claim to be someone else using their public key
- **Defense:** Signature verification fails (can't sign with someone else's private key)
- **Result:** ✅ Blocked

### 4. MITM Attack
- **Attack:** Intercept and modify transaction (change receiver)
- **Defense:** Encrypted payload tied to original receiver, signature verification fails
- **Result:** ✅ Blocked

## 🔒 Security Assumptions

1. **Private Keys are Secure**
   - Private keys are never transmitted
   - Users must protect their private keys
   - Validators' private keys are stored securely

2. **Network Security**
   - Validators communicate over secure channels
   - Frontend connects to trusted RPC endpoint

3. **Cryptographic Primitives**
   - secp256k1 curve is secure
   - SHA-256 is collision-resistant
   - AES-256-CBC with proper IV is secure

4. **Validator Honesty**
   - Validators are pre-authorized and trusted
   - Trust scores incentivize honest behavior
   - Malicious validators are penalized

5. **Timestamp Synchronization**
   - System clocks are reasonably synchronized
   - Timestamp tolerance window prevents replay

## 📊 Protocol Flow Diagram

```
┌─────────┐
│ Sender  │
└────┬────┘
     │
     │ 1. Get receiver public key
     ▼
┌─────────────┐
│ ECDH        │ 2. Derive shared secret
│ Key Exchange│
└────┬────────┘
     │
     │ 3. Encrypt payload (ECIES)
     ▼
┌─────────────┐
│ ECIES       │
│ Encryption  │
└────┬────────┘
     │
     │ 4. Sign transaction (ECDSA)
     ▼
┌─────────────┐
│ ECDSA       │
│ Signature   │
└────┬────────┘
     │
     │ 5. Submit to blockchain
     ▼
┌─────────────┐
│ Validators  │ 6. Verify signature, nonce, timestamp
│ Verification│
└────┬────────┘
     │
     │ 7. Valid transactions → Block proposal
     ▼
┌─────────────┐
│ Block       │
│ Finalization│
└─────────────┘
```

## 🔍 Transaction Validation Process

```
Validator receives transaction
    │
    ├─→ Verify ECDSA signature
    │   └─→ ❌ Invalid → Reject + Penalize validator
    │
    ├─→ Check nonce > last nonce
    │   └─→ ❌ Invalid → Reject
    │
    ├─→ Check timestamp freshness
    │   └─→ ❌ Stale → Reject
    │
    ├─→ Verify sender public key
    │   └─→ ❌ Invalid → Reject
    │
    └─→ ✅ All checks pass → Accept transaction
```

## 📚 Key Files

- **`contracts/SecureLedger.sol`** - Main transaction ledger contract
- **`contracts/ValidatorRegistry.sol`** - Validator management
- **`crypto/ecies.js`** - Encryption implementation
- **`crypto/ecdsa.js`** - Signature implementation
- **`scripts/simulateAttack.js`** - Attack simulation tests
- **`frontend/app.js`** - Frontend application logic

## ⚠️ Important Notes

1. **This is a demonstration/prototype system**
   - Not production-ready without additional security audits
   - Some simplifications made for clarity

2. **Private Key Management**
   - Never share private keys
   - Use hardware wallets in production
   - Implement proper key derivation

3. **Network Security**
   - Use HTTPS in production
   - Implement rate limiting
   - Add DDoS protection

4. **Smart Contract Security**
   - Additional audits recommended
   - Consider using OpenZeppelin libraries
   - Implement upgrade mechanisms if needed

## 🤝 Contributing

This is a security-focused project. When contributing:

1. Follow cryptographic best practices
2. Document security assumptions
3. Include attack simulations for new features
4. Maintain code clarity and comments

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with Hardhat
- Uses elliptic.js for ECC operations
- Uses ethers.js for blockchain interaction

---

**🔐 Security First | 🛡️ Attack Resistant | ⚡ Production Ready Foundation**

