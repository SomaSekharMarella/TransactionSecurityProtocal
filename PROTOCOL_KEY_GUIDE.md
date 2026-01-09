# 🔑 Protocol Public Key Guide

## What is the "Receiver Protocol Public Key (ECC)"?

This is **NOT** an Ethereum address. It's an **ECC (Elliptic Curve Cryptography) public key** used for protocol-level encryption.

### Key Differences

| Type | Purpose | Format | Example |
|------|---------|--------|---------|
| **Ethereum Address** | MetaMask account | 42 characters (0x + 40 hex) | `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` |
| **Protocol Public Key** | ECC encryption | 66 characters (0x + 64 hex) | `0x02a1b2c3d4e5f6...` (66 chars total) |

## How to Get a Protocol Public Key

### Option 1: Use the UI Helper(Easiest)

1. **For Testing (Same Person):**
   - Click "Show My Protocol Key" button
   - Copy the displayed key
   - Paste it in the "Receiver Protocol Public Key" field
   - This allows you to send to yourself for testing

2. **For Testing (Generate New):**
   - Click "Generate Test Key" button
   - A test key will be auto-filled
   - Use this for testing with different keys

### Option 2: Generate Using Browser Console

Open browser console (F12) and run:

```javascript
// Generate a new ECC key pair
const ec = new elliptic.ec('secp256k1');
const keyPair = ec.genKeyPair();
const publicKey = keyPair.getPublic().encode('hex', true);
console.log('Protocol Public Key:', publicKey);
console.log('Private Key (save securely):', keyPair.getPrivate('hex').padStart(64, '0'));

// Copy the public key and use it
```

### Option 3: Generate Using Node.js

```bash
node -e "const EC = require('elliptic').ec; const ec = new EC('secp256k1'); const key = ec.genKeyPair(); console.log('Public Key:', key.getPublic(true, 'hex')); console.log('Private Key:', key.getPrivate('hex').padStart(64, '0'));"
```

## For Testing (Same Person Sending to Self)

If you want to test sending to yourself:

1. **Connect MetaMask**
2. **Click "Show My Protocol Key"** - This shows YOUR protocol public key
3. **Copy that key**
4. **Paste it in "Receiver Protocol Public Key" field**
5. **Enter your own MetaMask address** in "Receiver Address"
6. **Send transaction**

This allows you to test the full flow with a single MetaMask account.

## For Real Transactions (Two Different People)

1. **Receiver generates their protocol key pair** (using console or helper)
2. **Receiver shares their PUBLIC key** with sender (safe to share)
3. **Receiver keeps their PRIVATE key secret** (needed to decrypt)
4. **Sender enters receiver's public key** in the form
5. **Transaction is encrypted** so only receiver can decrypt

## Key Format

- **Length**: 66 characters (with 0x) or 64 characters (without 0x)
- **Format**: Hexadecimal (0-9, a-f, A-F)
- **Example**: `0x02a1b2c3d4e5f67890123456789012345678901234567890123456789012345678`
- **Type**: Compressed secp256k1 public key

## Security Notes

⚠️ **Important:**
- Protocol public key is **safe to share** (like an email address)
- Protocol private key is **secret** (like a password)
- Never share your protocol private key
- Each person needs their own protocol key pair
- Protocol keys are separate from MetaMask/Ethereum keys

## Quick Test Setup

**To test with yourself:**

1. Connect MetaMask
2. Click "Show My Protocol Key"
3. Copy the displayed key
4. Paste in "Receiver Protocol Public Key" field
5. Enter your MetaMask address in "Receiver Address"
6. Send transaction

This works because:
- MetaMask handles the ETH transfer
- Protocol encrypts the payload with your own public key
- You can decrypt it with your protocol private key (stored internally)

---

**The protocol public key is used ONLY for encryption, not for Ethereum transactions!**

