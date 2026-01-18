# 🚗 Vehicle Registration & Identity Management Guide

Complete guide to understanding vehicle registration, MetaMask connection, ECC key generation, and identity persistence in the Secure Blockchain Transaction Protocol.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Dual Identity System](#dual-identity-system)
3. [ECC Key Generation](#ecc-key-generation)
4. [Identity Persistence](#identity-persistence)
5. [Vehicle Registration Process](#vehicle-registration-process)
6. [MetaMask Connection Flow](#metamask-connection-flow)
7. [Changing ECC Keys](#changing-ecc-keys)
8. [Sybil Attack Prevention](#sybil-attack-prevention)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This system uses a **dual identity model**:

1. **Ethereum Identity** (MetaMask): Used for ETH transactions and gas
2. **ECC Protocol Identity** (Elliptic Curve): Used for encryption and signing

These identities are **bound together** to prevent Sybil attacks (one person creating multiple fake identities).

---

## Dual Identity System

### Ethereum Identity (Layer 1)

**Managed by:** MetaMask  
**Format:** Ethereum address (0x followed by 40 hex chars)  
**Example:** `0x548031b93c390d9979122a9cf604e69534430ccc`  
**Purpose:** 
- ETH transactions
- Gas payment
- Smart contract interaction
- Wallet management

**Storage:**
- Stored in MetaMask wallet
- Backed up via seed phrase
- Can be imported/exported

### ECC Protocol Identity (Layer 2)

**Managed by:** Frontend application (`app.js`)  
**Format:** ECC public key (66 hex characters, compressed format)  
**Example:** `023009878c71370ff7dcfc0e3524648c20b177f5c47cf4cbe8fe14224e11c45337`  
**Purpose:**
- Transaction encryption (ECIES)
- Transaction signing (ECDSA)
- Key exchange (ECDH)
- Vehicle identity on-chain

**Storage:**
- Stored in `localStorage` (browser)
- Key: `protocolKeys_{ethereumAddress.toLowerCase()}`
- Format: JSON with privateKey, publicKey, ethereumAddress, createdAt

**Binding:**
- One ECC public key per Ethereum address
- Enforced by VehicleTrustRegistry contract
- Prevents Sybil attacks

---

## ECC Key Generation

### How ECC Keys Are Generated

**Curve:** secp256k1 (same as Bitcoin)  
**Library:** Elliptic.js  
**Location:** `crypto/ecc.js`

```javascript
// Step 1: Initialize curve
const ec = new elliptic.ec('secp256k1');

// Step 2: Generate key pair
const keyPair = ec.genKeyPair();

// Step 3: Extract keys
const privateKey = keyPair.getPrivate('hex').padStart(64, '0'); // 64 hex chars
const publicKey = keyPair.getPublic().encode('hex', true); // 66 hex chars (compressed)

// Format: 0x02 or 0x03 + 32-byte x-coordinate
// Example: 023009878c71370ff7dcfc0e3524648c20b177f5c47cf4cbe8fe14224e11c45337
```

### Key Format Details

**Private Key:**
- **Length:** 64 hex characters (32 bytes)
- **Format:** Lowercase hex, zero-padded
- **Example:** `0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b`
- **Storage:** localStorage (encrypted by browser)

**Public Key (Compressed):**
- **Length:** 66 hex characters (33 bytes)
- **Format:** `0x02` or `0x03` prefix + 32-byte x-coordinate
- **Example:** `023009878c71370ff7dcfc0e3524648c20b177f5c47cf4cbe8fe14224e11c45337`
- **Purpose:** Shared with others for encryption

**Why Compressed?**
- Smaller storage (66 vs 130 chars)
- Faster transmission
- Same security as uncompressed
- Standard format for secp256k1

### When Keys Are Generated

**First Time (New User):**
1. User connects MetaMask
2. Frontend gets Ethereum address
3. Checks localStorage: `protocolKeys_{address}`
4. Not found → Generate new key pair
5. Store in localStorage

**Returning User:**
1. User connects MetaMask
2. Frontend gets Ethereum address
3. Checks localStorage: `protocolKeys_{address}`
4. Found → Load existing keys
5. Reconstruct elliptic keyPair from private key

**Result:**
- Same ECC identity across sessions
- Same Ethereum address = same ECC key
- Persistent identity per address

---

## Identity Persistence

### Storage Mechanism

**Location:** Browser localStorage  
**Key Format:** `protocolKeys_{ethereumAddress.toLowerCase()}`  
**Example Key:** `protocolKeys_0x548031b93c390d9979122a9cf604e69534430ccc`

**Storage Format (JSON):**
```json
{
  "privateKey": "64-hex-character-private-key",
  "publicKey": "66-hex-character-public-key",
  "ethereumAddress": "0x548031b93c390d9979122a9cf604e69534430ccc",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Persistence Flow

```
First Visit:
  1. Connect MetaMask → Address: 0xABC...
  2. Check localStorage: protocolKeys_0xabc... → Not found
  3. Generate new ECC key pair
  4. Store in localStorage: protocolKeys_0xabc...
  5. Register vehicle (first transaction)

Next Visit:
  1. Connect MetaMask → Address: 0xABC...
  2. Check localStorage: protocolKeys_0xabc... → Found
  3. Load existing keys from localStorage
  4. Reconstruct elliptic keyPair
  5. Use same identity (no re-registration needed)
```

### Benefits

✅ **No Re-registration**: Same identity across sessions  
✅ **Sybil Prevention**: One key per address enforced  
✅ **User-Friendly**: Seamless experience  
✅ **Secure**: Keys never leave browser  

---

## Vehicle Registration Process

### Automatic Registration

**When:** First transaction attempt  
**Function:** `registerVehicleIfNeeded()` in `app.js`

**Process:**

```
1. User attempts transaction
   ↓
2. Frontend validates vehicle:
   - Check on-chain: isVehicleRegistered(publicKey)
   - Already registered? → Skip registration ✅
   ↓
3. Not registered? → Register:
   - Get Ethereum address from MetaMask
   - Check if address already bound to different public key
   - If bound → Sybil error (blocked)
   - If not bound → Proceed with registration
   ↓
4. Call VehicleTrustRegistry.selfRegisterVehicle(publicKey):
   - Contract binds Ethereum address to ECC public key
   - Sets initial trust score: 100
   - Sets registration time: block.timestamp
   ↓
5. Registration confirmed:
   - Transaction hash shown
   - Trust status updated in UI
   - Vehicle can now transact
```

### Registration Checks

**Before Registration:**
1. ✅ ECC public key format valid (66 hex chars)
2. ✅ Ethereum address valid
3. ✅ Address not already bound to different public key (Sybil check)
4. ✅ Public key not already registered

**On-Chain Registration:**
```solidity
// VehicleTrustRegistry.sol
function selfRegisterVehicle(string memory publicKeyHex) external {
    // Sybil check: Same address with different public key?
    require(
        addressToPublicKey[msg.sender] == "" || 
        keccak256(bytes(addressToPublicKey[msg.sender])) == keccak256(bytes(publicKeyHex)),
        "Sybil attack detected: Same address with different public key"
    );
    
    // Register vehicle
    vehicles[publicKeyHex] = Vehicle({
        publicKeyHex: publicKeyHex,
        ethereumAddress: msg.sender,
        trustScore: INITIAL_TRUST_SCORE, // 100
        isRevoked: false,
        registrationTime: block.timestamp,
        // ... other fields
    });
    
    addressToPublicKey[msg.sender] = publicKeyHex;
    emit VehicleRegistered(publicKeyHex, msg.sender);
}
```

### Registration Requirements

**Minimum Requirements:**
- ✅ MetaMask connected
- ✅ Ethereum address valid
- ✅ ECC keys generated (auto-generated on connection)
- ✅ Not already registered with different key (Sybil prevention)

**Gas Cost:**
- Registration transaction: ~50,000 gas
- Varies with network conditions
- Sepolia testnet: ~$0.01 USD (very cheap)

---

## MetaMask Connection Flow

### Complete Connection Process

```
1. User clicks "Connect MetaMask"
   ↓
2. Frontend requests connection:
   - window.ethereum.request({ method: 'eth_requestAccounts' })
   - MetaMask popup appears
   ↓
3. User approves:
   - Select account(s) if multiple
   - Click "Connect"
   - Approve permissions
   ↓
4. Frontend receives accounts:
   - Primary account: userAccount
   - All accounts: allAccounts[]
   ↓
5. Initialize provider:
   - new ethers.providers.Web3Provider(window.ethereum)
   - Get network (should be Sepolia)
   ↓
6. Check/switch network:
   - If not Sepolia → Prompt to switch
   - User approves network switch
   - Verify: chainId === 11155111
   ↓
7. Load account balances:
   - getBalance() for each account
   - Update UI with balances
   ↓
8. Load smart contracts:
   - ValidatorRegistry (from CONFIG)
   - VehicleTrustRegistry (from CONFIG)
   - SecureLedger (from CONFIG)
   - Test contract accessibility
   ↓
9. Initialize protocol keys:
   - Get Ethereum address: await signer.getAddress()
   - Call: initializeProtocolKeys(address)
     ├─ Check localStorage: protocolKeys_{address}
     ├─ Found? → Load existing keys
     └─ Not found? → Generate new keys + Store
   ↓
10. Display protocol identity:
    - Show public key in UI
    - Enable "Show My Protocol Key" button
    ↓
11. Check vehicle registration:
    - Check on-chain: isVehicleRegistered(publicKey)
    - If not registered → Will auto-register on first transaction
    ↓
12. Update UI:
    - Show account address
    - Show balance
    - Show network
    - Show trust status (if registered)
    - Show protocol public key
```

### Connection Validation

**After Connection, Verify:**

1. ✅ Account address shown in UI
2. ✅ Balance displayed (Sepolia ETH)
3. ✅ Network shows "Sepolia" or Chain ID: 11155111
4. ✅ Protocol public key displayed (66 hex chars)
5. ✅ Vehicle trust status visible (if registered)
6. ✅ No console errors

---

## Changing ECC Keys

### Why You Can't Change Keys (Sybil Prevention)

**Problem Solved:**
- Sybil attack: One person creates multiple fake identities
- Solution: One ECC public key per Ethereum address
- Binding enforced on-chain in VehicleTrustRegistry

**What Happens if You Try to Change:**

```
Scenario: User has Ethereum address 0xABC... registered with ECC key PK1
         User tries to register same address with different ECC key PK2

Process:
  1. User connects MetaMask (address: 0xABC...)
  2. Frontend generates new ECC key PK2 (or loads from localStorage)
  3. User attempts transaction
  4. Frontend tries to register PK2 for address 0xABC...
  5. VehicleTrustRegistry checks: addressToPublicKey[0xABC...] = PK1
  6. Contract detects: Different public key for same address
  7. Error: "Sybil attack detected: Same address with different public key"
  8. Registration blocked ❌
```

**Error Message:**
```
❌ Sybil attack detected: Same address with different public key
   Ethereum address: 0xABC...
   Original public key: PK1 (already registered)
   New public key: PK2 (cannot register)
```

### How to Reset Protocol Identity (Dev Mode Only)

**⚠️ WARNING**: Resetting requires re-registration!

**Reset Button:**
- Located in "Protocol Identity" section
- Label: "⚠️ Reset Protocol Identity (Dev Mode)"
- **Only use in development/testing!**

**Reset Process:**

```
1. Click "Reset Protocol Identity"
   ↓
2. Confirmation dialog:
   "WARNING: Reset Protocol Identity?
    This will delete your ECC key pair and require re-registration.
    You will need to register again with VehicleTrustRegistry.
    This action cannot be undone. Continue?"
   ↓
3. User confirms:
   - localStorage.removeItem(protocolKeys_{address})
   - protocolKeys = null
   - Show notification: "Protocol identity reset"
   ↓
4. Re-initialize keys:
   - New ECC key pair generated
   - Stored in localStorage
   - Different public key than before
   ↓
5. First transaction:
   - New public key registered
   - Old identity (PK1) remains on-chain (but not used)
   - New identity (PK2) now active
```

**Important Notes:**
- ⚠️ Old public key (PK1) remains registered on-chain
- ⚠️ Cannot re-use PK1 with same address (Sybil check)
- ⚠️ Trust score resets (starts at 100 for new registration)
- ⚠️ Previous transactions still linked to PK1

### Clearing localStorage (Manual)

**If Reset Button Not Available:**

1. **Open Browser DevTools** (F12)
2. **Go to Application tab** (Chrome) or Storage tab (Firefox)
3. **Find Local Storage** → `http://localhost:8000` (or your URL)
4. **Find key:** `protocolKeys_{yourAddress}` (lowercase address)
5. **Delete key**
6. **Refresh page**
7. **New keys generated on next connection**

---

## Sybil Attack Prevention

### How Sybil Prevention Works

**Binding Mechanism:**
- One Ethereum address → One ECC public key
- Enforced on-chain in VehicleTrustRegistry
- Cannot change after first registration

**On-Chain Binding:**

```solidity
// VehicleTrustRegistry.sol
mapping(address => string) public addressToPublicKey; // Ethereum address → ECC public key

function selfRegisterVehicle(string memory publicKeyHex) external {
    // Check if address already bound
    string memory existingPublicKey = addressToPublicKey[msg.sender];
    
    // If bound, must be same public key
    if (bytes(existingPublicKey).length != 0) {
        require(
            keccak256(bytes(existingPublicKey)) == keccak256(bytes(publicKeyHex)),
            "Sybil attack detected: Same address with different public key"
        );
    }
    
    // Bind address to public key
    addressToPublicKey[msg.sender] = publicKeyHex;
    vehicles[publicKeyHex].ethereumAddress = msg.sender;
}
```

### Sybil Scenarios

**Scenario 1: Multiple Addresses (Allowed)**
```
User has:
- Address A → ECC Key PK1 ✅ (Registered)
- Address B → ECC Key PK2 ✅ (Allowed - different address)

Both can be registered (different addresses)
```

**Scenario 2: Same Address, Different Key (Blocked)**
```
User has:
- Address A → ECC Key PK1 ✅ (Registered)
- Tries: Address A → ECC Key PK2 ❌ (Blocked - Sybil attack)

Same address cannot register different key
```

**Scenario 3: Same Key, Different Address (Blocked)**
```
User has:
- Address A → ECC Key PK1 ✅ (Registered)
- Tries: Address B → ECC Key PK1 ❌ (Blocked - key already used)

Same key cannot be used by different address
```

---

## Troubleshooting

### "Sybil attack detected" Error

**Cause:** Attempting to register different ECC key for same Ethereum address

**Solution:**
1. Use same protocol identity (ECC key) for address
2. Clear localStorage only if absolutely necessary (dev mode)
3. Contact admin if identity needs to be changed

**Check Current Identity:**
- Click "Show My Protocol Key" in UI
- Copy the 66-character public key
- This is your registered identity

---

### Protocol Keys Not Loading

**Symptoms:**
- New keys generated on each page load
- Registration errors on each transaction

**Cause:** localStorage not accessible or keys corrupted

**Solution:**
1. Check browser console for errors
2. Verify localStorage enabled in browser
3. Check Application/Storage tab in DevTools
4. Verify key format: `protocolKeys_{address}` (lowercase address)

**Verify Keys Exist:**
```javascript
// In browser console
const address = await window.ethereum.request({ method: 'eth_accounts' })[0];
const storageKey = `protocolKeys_${address.toLowerCase()}`;
const keys = localStorage.getItem(storageKey);
console.log(keys); // Should show JSON object
```

---

### "Vehicle not registered" on Every Transaction

**Cause:** Registration failing or not completing

**Solution:**
1. Check MetaMask for pending registration transaction
2. Verify sufficient Sepolia ETH for gas
3. Check contract addresses in CONFIG
4. Verify VehicleTrustRegistry is deployed and accessible

**Manual Registration Check:**
```javascript
// In browser console (after connecting MetaMask)
const address = await signer.getAddress();
const publicKey = protocolKeys.publicKey;
const isRegistered = await vehicleTrustRegistry.isVehicleRegistered(publicKey);
console.log('Registered:', isRegistered);
```

---

### Different Public Key Each Time

**Symptoms:**
- Protocol public key changes on each page load
- Cannot maintain consistent identity

**Cause:** Keys not stored/loaded from localStorage correctly

**Solution:**
1. Check localStorage access (DevTools → Application → Local Storage)
2. Verify `initializeProtocolKeys()` called with correct address
3. Check for JavaScript errors in console
4. Try different browser

**Debug Storage:**
```javascript
// In browser console
Object.keys(localStorage).filter(k => k.startsWith('protocolKeys_'))
// Should show: ["protocolKeys_0x..."]
```

---

### Protocol Identity Not Displayed

**Symptoms:**
- "Show My Protocol Key" shows nothing
- Protocol identity section hidden

**Cause:** Keys not initialized or display function not called

**Solution:**
1. Ensure MetaMask connected
2. Check console for initialization errors
3. Click "Show My Protocol Key" button
4. Verify `displayMyProtocolKey()` called in `initializeProtocolKeys()`

---

## Best Practices

### For Users

1. ✅ **Keep Same Browser**: Identity stored in localStorage
2. ✅ **Don't Clear Storage**: Unless intentionally resetting identity
3. ✅ **Backup Your Protocol Key**: Save public key somewhere safe
4. ✅ **Use Dev Mode Reset**: Only for development/testing

### For Developers

1. ✅ **Test Registration**: Verify first-time registration works
2. ✅ **Test Persistence**: Reload page, verify same identity
3. ✅ **Test Sybil Prevention**: Try registering different key (should fail)
4. ✅ **Handle Errors**: Provide clear error messages for users

---

## Summary

**Key Takeaways:**

- ✅ **Dual Identity**: Ethereum (MetaMask) + ECC (Protocol)
- ✅ **Persistent**: Same ECC key per Ethereum address across sessions
- ✅ **Automatic**: Keys generated on first connection, loaded thereafter
- ✅ **Sybil Prevention**: One ECC key per address enforced on-chain
- ✅ **User-Friendly**: Seamless experience, no manual key management
- ✅ **Secure**: Keys never leave browser (localStorage)

**Questions Answered:**

- **How are ECC keys generated?** → Automatically on first connection, stored in localStorage
- **What happens if I change ECC keys?** → Sybil error (same address, different key blocked)
- **Can I use different keys?** → Only with different Ethereum addresses
- **How do I reset identity?** → Use reset button (dev mode) or clear localStorage manually

---

**For more details, see:**
- `README.md` - Complete project documentation
- `QUICKSTART.md` - Setup instructions
- `PROJECT_OVERVIEW.md` - Simple explanation
