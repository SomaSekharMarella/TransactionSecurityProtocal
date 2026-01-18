# 🚀 Quick Start Guide - Complete Setup Instructions

Step-by-step guide to get the Secure Blockchain Transaction Protocol running from scratch.

---

## 📋 Prerequisites

Before you begin, ensure you have:

### Required Software

1. **Node.js v16+**
   - Download from: https://nodejs.org/
   - Verify: `node --version` (should show v16 or higher)
   - Includes npm (Node Package Manager)

2. **MetaMask Browser Extension**
   - Install from: https://metamask.io/
   - Create a wallet or import existing one
   - **Important**: Add Sepolia testnet network (instructions below)

3. **Code Editor** (Optional but recommended)
   - VS Code: https://code.visualstudio.com/
   - Or any text editor

4. **Git** (for cloning)
   - Download from: https://git-scm.com/
   - Verify: `git --version`

### Required Accounts

1. **Alchemy Account** (Free)
   - Sign up at: https://www.alchemy.com/
   - Free tier includes 300M compute units/month

2. **Sepolia Testnet ETH**
   - Get from faucets (instructions below)
   - Minimum 0.1 ETH recommended for testing

---

## 🔧 Step 1: Clone and Install

### Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd Protocal

# Verify project structure
ls -la
# Should see: contracts/, crypto/, docs/, scripts/, package.json
```

### Install Dependencies

```bash
# Install all npm packages
npm install

# This installs:
# - hardhat (development environment)
# - ethers.js (blockchain interaction)
# - elliptic (ECC operations)
# - crypto-js (encryption utilities)
# - All dependencies from package.json

# Verify installation
npm list --depth=0
```

**Expected Output:**
```
Protocal@1.0.0
├── @nomicfoundation/hardhat-toolbox@^4.0.0
├── crypto-js@^4.2.0
├── elliptic@^6.5.4
├── ethers@^6.9.0
└── hardhat@^2.19.0
```

---

## 🔑 Step 2: Configure Alchemy API

### Create Alchemy App

1. **Go to Alchemy Dashboard**
   - Visit: https://dashboard.alchemy.com/
   - Sign up or log in

2. **Create New App**
   - Click "Create App"
   - Name: `Secure Blockchain Protocol` (or any name)
   - Description: `V2V/V2I Communication Protocol`
   - Chain: **Ethereum**
   - Network: **Sepolia Testnet**
   - Click "Create App"

3. **Copy API Key**
   - Click on your app
   - Click "View Key" or "API Key"
   - Copy the **HTTPS URL**
   - Format: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

### Configure Environment (Optional for Hardhat)

Create `.env` file in project root:

```bash
# .env file
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_deployer_private_key_here (without 0x prefix)
```

**Note**: `.env` is optional. Frontend uses API key directly in `app.js` CONFIG.

---

## ⚙️ Step 3: Compile Smart Contracts

### Compile Contracts

```bash
# Compile Solidity contracts
npm run compile

# Or directly:
npx hardhat compile
```

**Expected Output:**
```
Compiled 3 Solidity files successfully
- contracts/SecureLedger.sol
- contracts/ValidatorRegistry.sol
- contracts/VehicleTrustRegistry.sol
```

**What Happens:**
- Hardhat compiles `.sol` files
- Generates ABI (Application Binary Interface) in `artifacts/`
- Creates bytecode for deployment

---

## 🚀 Step 4: Deploy to Sepolia Testnet

### Prerequisites for Deployment

1. **MetaMask Wallet** with Sepolia ETH
   - Minimum 0.05 ETH for deployment
   - Get from faucet (see Step 5)

2. **Private Key** from MetaMask
   - MetaMask → Account → Account Details → Export Private Key
   - ⚠️ **Security Warning**: Never share private keys!

### Deploy Contracts

```bash
# Deploy to Sepolia (requires .env with PRIVATE_KEY)
npx hardhat run scripts/deploy.js --network sepolia

# Or if using MetaMask directly:
npx hardhat run scripts/deploy.js --network sepolia --wallet
```

**Deployment Order:**
```
1. ValidatorRegistry → Address: 0x...
2. VehicleTrustRegistry → Address: 0x...
3. SecureLedger → Address: 0x...
4. Link VehicleTrustRegistry with SecureLedger
5. Register initial validators
```

**Expected Output:**
```
🚀 Starting deployment...

Deploying contracts with account: 0xYourAddress
Account balance: 500000000000000000 (0.5 ETH)

📝 Deploying ValidatorRegistry...
✅ ValidatorRegistry deployed to: 0x7113cA0a93f803C1Fd12b353A8448FcD59EA38A8

📝 Deploying VehicleTrustRegistry...
✅ VehicleTrustRegistry deployed to: 0x71585F82fd4077605075eC6f58bC270c9982d682

📝 Deploying SecureLedger...
✅ SecureLedger deployed to: 0x918386d7EfFC78a73821CA7fb5E4ed28323b806f

🔗 Linking VehicleTrustRegistry with SecureLedger...
✅ VehicleTrustRegistry linked with SecureLedger

👥 Registering validators...
✅ Registered validator 1: 0x...

📊 DEPLOYMENT SUMMARY
============================================================
ValidatorRegistry: 0x7113cA0a93f803C1Fd12b353A8448FcD59EA38A8
VehicleTrustRegistry: 0x71585F82fd4077605075eC6f58bC270c9982d682
SecureLedger: 0x918386d7EfFC78a73821CA7fb5E4ed28323b806f

✅ Deployment complete!
```

**📝 IMPORTANT**: Copy all three addresses! You'll need them in the next step.

---

## ⚙️ Step 5: Configure Frontend

### Get Sepolia Testnet ETH

**Option 1: Alchemy Faucet (Recommended)**
1. Visit: https://www.alchemy.com/faucets/ethereum-sepolia
2. Enter your MetaMask address
3. Complete captcha
4. Click "Send Me ETH"
5. Wait 1-2 minutes for confirmation

**Option 2: Sepolia Faucet**
1. Visit: https://sepoliafaucet.com/
2. Enter your address
3. Click "Send Me ETH"

**Option 3: QuickNode Faucet**
1. Visit: https://faucet.quicknode.com/ethereum/sepolia
2. Enter your address
3. Get 0.5 Sepolia ETH

### Update Frontend Configuration

Edit `docs/app.js` (line 13-20):

```javascript
// Configuration - Update after deployment to Sepolia
const CONFIG = {
    VALIDATOR_REGISTRY_ADDRESS: '0x7113cA0a93f803C1Fd12b353A8448FcD59EA38A8', // From deployment
    VEHICLE_TRUST_REGISTRY_ADDRESS: '0x71585F82fd4077605075eC6f58bC270c9982d682', // From deployment
    SECURE_LEDGER_ADDRESS: '0x918386d7EfFC78a73821CA7fb5E4ed28323b806f', // From deployment
    ALCHEMY_RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY', // Your Alchemy API key
    SEPOLIA_CHAIN_ID: 11155111,
    SEPOLIA_NETWORK_NAME: 'Sepolia'
};
```

**Replace:**
- `VALIDATOR_REGISTRY_ADDRESS`: From deployment output
- `VEHICLE_TRUST_REGISTRY_ADDRESS`: From deployment output
- `SECURE_LEDGER_ADDRESS`: From deployment output
- `ALCHEMY_RPC_URL`: Your Alchemy API URL from Step 2

### Verify Configuration

```javascript
// Check console in browser DevTools
console.log(CONFIG);
// Should show all addresses and API URL
```

---

## 🌐 Step 6: Configure MetaMask for Sepolia

### Add Sepolia Testnet (if not present)

**Option 1: Via MetaMask UI**
1. Open MetaMask extension
2. Click network dropdown (top-left)
3. Click "Add Network" or "Show Test Networks"
4. Select "Sepolia Test Network"
5. Click "Add"

**Option 2: Manual Addition**
1. MetaMask → Networks → Add Network
2. Fill in:
   - **Network Name**: Sepolia Test Network
   - **RPC URL**: `https://sepolia.infura.io/v3/` or use your Alchemy URL
   - **Chain ID**: `11155111`
   - **Currency Symbol**: `ETH`
   - **Block Explorer**: `https://sepolia.etherscan.io`
3. Click "Save"

**Option 3: Automatic (via Frontend)**
- Frontend will prompt to switch network
- Click "Switch Network" when prompted

---

## 🌍 Step 7: Start Frontend Server

### Option A: Python HTTP Server (Recommended)

```bash
# Navigate to docs directory
cd docs

# Start server (Python 3)
python -m http.server 8000

# Or (Python 2)
python -m SimpleHTTPServer 8000

# Server starts on: http://localhost:8000
```

### Option B: Node.js HTTP Server

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Start server
cd docs
http-server -p 8000

# Or with CORS enabled
http-server -p 8000 -c-1 --cors
```

### Option C: VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `docs/index.html`
3. Select "Open with Live Server"
4. Browser opens automatically

### Option D: Direct File Open (Limited)

- Double-click `docs/index.html`
- ⚠️ **Limitations**: Some features may not work (localStorage, CORS)

### Verify Server

Open browser: `http://localhost:8000`

**Expected:**
- Dark-themed interface
- "Secure Blockchain Protocol" header
- MetaMask connection button visible

---

## 🦊 Step 8: Connect MetaMask

### Connect to Frontend

1. **Open Frontend**
   - Go to: `http://localhost:8000`
   - Or your server URL

2. **Click "Connect MetaMask"**
   - Button at top of page
   - MetaMask popup appears

3. **Approve Connection**
   - Review permissions
   - Click "Next" → "Connect"
   - Select account(s) if prompted

4. **Verify Connection**
   - Account address appears in UI
   - Balance shows (if on Sepolia)
   - Network shows "Sepolia" or prompts to switch

### What Happens During Connection

```
1. Frontend requests MetaMask connection
   ↓
2. User approves in MetaMask
   ↓
3. Frontend initializes:
   - Provider (Ethers.js via MetaMask)
   - Signer (for transaction signing)
   - Load contracts (using CONFIG addresses)
   ↓
4. Initialize protocol keys:
   - Check localStorage: protocolKeys_{address}
   - Load existing keys OR generate new keys
   - Store in localStorage (if new)
   ↓
5. Display protocol public key
   ↓
6. Check vehicle registration:
   - Check on-chain registration status
   - Auto-register if not registered
   ↓
7. Update UI:
   - Show account, balance, network
   - Show trust status (if registered)
   - Display protocol identity
```

---

## 📝 Step 9: Send First Transaction

### Prepare Transaction

1. **Receiver Address**
   - Enter another MetaMask address
   - Or use your own address (for testing)

2. **Receiver Protocol Public Key**
   - If receiver is you: Use the key shown in "Protocol Identity"
   - If receiver is someone else: Ask them for their protocol public key
   - Format: 66 hex characters (no 0x prefix)

3. **Amount**
   - Enter amount in ETH (e.g., 0.001)
   - Ensure sufficient Sepolia ETH balance

4. **Message** (Optional)
   - Enter optional message
   - Will be encrypted in payload

### Send Transaction

1. **Click "Send ETH Transaction"**
   - Form validates inputs
   - Checks vehicle registration
   - Checks trust score (>= 50)
   - Checks cooldown (10 seconds passed)

2. **MetaMask Popup Appears**
   - Review transaction details
   - Gas fee shown (estimate)
   - Click "Confirm" or "Reject"

3. **Wait for Confirmation**
   - Transaction pending...
   - Confirmed on Sepolia (usually 15-30 seconds)
   - Etherscan link appears

4. **Verify Success**
   - Transaction hash shown
   - "View on Etherscan" link works
   - Trust status updates
   - Cooldown timer starts (10 seconds)

### Transaction Flow

```
1. User clicks "Send ETH Transaction"
   ↓
2. Frontend validates:
   - Vehicle registered? ✅
   - Trust score >= 50? ✅
   - Cooldown passed? ✅
   - Rate limit OK? ✅
   ↓
3. Encrypt payload (ECIES):
   - Derive shared secret (ECDH)
   - Encrypt with AES-256-GCM
   ↓
4. Sign transaction (ECDSA):
   - Create transaction data
   - Hash data
   - Sign with ECC private key
   ↓
5. Generate session key hash
   ↓
6. Create ETH transaction:
   - Include encrypted payload in data
   - User approves in MetaMask
   ↓
7. Submit to SecureLedger:
   - Contract validates (10 checks)
   - VehicleTrustRegistry checks
   - Transaction stored
   - Cooldown updated
   ↓
8. Transaction confirmed
   ↓
9. UI updates:
   - Show confirmation
   - Update trust score
   - Add to history
```

---

## 🧪 Step 10: Test Attack Simulations

### Run Attack Tests

1. **Enable Test Mode** (Default)
   - Checkbox: "Test Mode (No MetaMask confirmations)"
   - Local validation only
   - No gas fees

2. **Test Individual Attacks**
   - Click any attack button (1-11)
   - Results appear below
   - ✅ = Attack blocked (protection working)
   - ❌ = Attack succeeded (security issue)

3. **Test All Attacks**
   - Click "Run All Attacks"
   - All 11 attacks tested sequentially
   - Summary shows blocked count

### Attack List

1. **Replay Attack** - Blocked ✅ (Nonce + Timestamp)
2. **MITM Attack** - Blocked ✅ (ECDH + Signature)
3. **Privileged Insider** - Blocked ✅ (Key separation)
4. **Impersonation** - Blocked ✅ (Signature verification)
5. **Physical Capture** - Protected ✅ (Forward secrecy)
6. **Session Key Disclosure** - Blocked ✅ (Uniqueness)
7. **Eavesdropping** - Protected ✅ (ECIES encryption)
8. **Data Integrity** - Blocked ✅ (HMAC + Signature)
9. **Sybil Attack** - Blocked ✅ (Identity binding)
10. **DoS Attack** - Blocked ✅ (Cooldown + Rate limit)
11. **Trust Management** - Protected ✅ (Dynamic scoring)

### Real Mode Testing (Advanced)

1. **Uncheck "Test Mode"**
   - Uses actual blockchain transactions
   - Requires MetaMask confirmations
   - Costs gas fees (Sepolia ETH)

2. **Run Attacks**
   - Each attack creates real transactions
   - Verify on Etherscan
   - Check trust score changes

---

## 🔍 Troubleshooting

### "MetaMask not detected"

**Cause**: MetaMask extension not installed or disabled

**Solution:**
1. Install MetaMask: https://metamask.io/
2. Enable extension in browser
3. Refresh page
4. Check browser console for errors

---

### "Please switch to Sepolia"

**Cause**: MetaMask on wrong network

**Solution:**
1. Click MetaMask extension
2. Select "Sepolia Test Network" from dropdown
3. Or click "Switch Network" in frontend UI
4. Verify network shows "Sepolia" in UI

---

### "Insufficient balance"

**Cause**: Not enough Sepolia ETH

**Solution:**
1. Get Sepolia ETH from faucet:
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://sepoliafaucet.com/
2. Wait 1-2 minutes for confirmation
3. Refresh balance in UI

---

### "VehicleTrustRegistry address not configured"

**Cause**: Frontend CONFIG not updated with deployment addresses

**Solution:**
1. Open `docs/app.js`
2. Update `CONFIG` object with deployment addresses
3. Save file
4. Refresh browser

---

### "Contract not found"

**Cause**: Wrong addresses or network mismatch

**Solution:**
1. Verify addresses in `CONFIG` match deployment output
2. Check network is Sepolia (Chain ID: 11155111)
3. Verify contracts deployed on Sepolia
4. Check Etherscan for contract addresses

---

### "Cooldown active: Please wait X seconds"

**Cause**: Normal behavior - 10-second cooldown between transactions

**Solution:**
1. Wait 10+ seconds after last transaction
2. Refresh page (cooldown resets on blockchain)
3. This is DoS protection working correctly ✅

---

### "Sybil attack detected"

**Cause**: Attempting to register different ECC key for same Ethereum address

**Solution:**
1. Use same protocol identity (ECC key) for address
2. Clear localStorage if needed (dev mode only)
3. Protocol identity is persistent per address
4. See `VEHICLE_REGISTRATION_GUIDE.md` for details

---

### "Transaction reverted"

**Common Causes & Solutions:**

1. **"Vehicle not registered"**
   - Solution: Auto-registration happens on first transaction
   - Wait a moment and try again

2. **"Trust score too low"**
   - Solution: Valid transactions increase score
   - Current score below 50 (minimum threshold)
   - Contact admin to increase trust score

3. **"Cooldown period not passed"**
   - Solution: Wait 10+ seconds between transactions

4. **"Rate limit exceeded"**
   - Solution: Maximum 10 transactions per minute
   - Wait 60 seconds and try again

---

### Browser Console Errors

**"Ethers.js not loaded"**
- Solution: Check browser console
- Verify libraries loaded in correct order
- Check network tab for failed CDN requests
- Try different browser

**"CryptoJS not loaded"**
- Solution: Same as above
- Check `index.html` for script tags

**"Elliptic not loaded"**
- Solution: Verify elliptic.js CDN is accessible
- Check browser console for errors

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Contracts deployed to Sepolia
- [ ] Frontend CONFIG updated with addresses
- [ ] MetaMask connected to Sepolia
- [ ] Sepolia ETH in wallet (minimum 0.1 ETH)
- [ ] Protocol keys generated/loaded
- [ ] Vehicle registered (auto-registration)
- [ ] First transaction successful
- [ ] Attack simulations working
- [ ] Trust status visible in UI

---

## 📚 Next Steps

1. **Read Documentation**
   - `README.md` - Complete project documentation
   - `VEHICLE_REGISTRATION_GUIDE.md` - Identity management
   - `PROJECT_OVERVIEW.md` - Simple explanation

2. **Explore Code**
   - `docs/app.js` - Frontend logic (2,500+ lines)
   - `contracts/` - Smart contracts
   - `crypto/` - Cryptography modules

3. **Test Features**
   - Multiple transactions
   - Attack simulations
   - Trust score changes
   - Cooldown behavior

4. **Customize**
   - Modify trust score thresholds
   - Adjust cooldown periods
   - Add new attack vectors
   - Extend smart contracts

---

## 🆘 Need Help?

**Common Issues:**
- Check browser console for errors
- Verify all addresses in CONFIG
- Ensure MetaMask on Sepolia
- Check contract deployment addresses on Etherscan
- Verify Alchemy API key is correct

**Resources:**
- MetaMask Docs: https://docs.metamask.io/
- Hardhat Docs: https://hardhat.org/docs
- Ethers.js Docs: https://docs.ethers.io/
- Sepolia Etherscan: https://sepolia.etherscan.io/

---

**Ready to use! Connect MetaMask and start sending secure transactions! 🚀**
