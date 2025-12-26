# 🚀 Quick Start Guide

Get the secure blockchain protocol up and running in minutes!

## Prerequisites

- Node.js v16 or higher
- npm or yarn

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile Smart Contracts

```bash
npm run compile
```

### 3. Start Local Blockchain

Open a terminal and run:

```bash
npm run node
```

This starts a local Hardhat node with 10 test accounts pre-funded with 10,000 ETH each.

**Keep this terminal open!**

### 4. Deploy Contracts

Open a **new terminal** and run:

```bash
npm run deploy
```

This will:
- Deploy ValidatorRegistry contract
- Deploy SecureLedger contract
- Register 5 validators automatically

**Copy the contract addresses** from the output - you'll need them for the frontend!

### 5. Configure Frontend

Edit `frontend/app.js` and update the `CONFIG` object:

```javascript
const CONFIG = {
    VALIDATOR_REGISTRY_ADDRESS: '0x...', // From deploy output
    SECURE_LEDGER_ADDRESS: '0x...',      // From deploy output
    RPC_URL: 'http://127.0.0.1:8545'
};
```

### 6. Open Frontend

**Option A: Direct File**
- Open `frontend/index.html` in your browser
- Note: Some browsers may block local file access for security

**Option B: Local Server (Recommended)**
```bash
cd frontend
python -m http.server 8000
# Or use Node.js:
# npx http-server -p 8000
```

Then open: `http://localhost:8000`

### 7. Test the System

1. **Generate Key Pair**
   - Click "Generate New Key Pair"
   - Save your keys securely!

2. **Create Transaction**
   - Enter a receiver public key (generate another key pair for testing)
   - Enter amount and message
   - Click "Create & Sign Transaction"

3. **Submit Transaction**
   - Review the transaction details
   - Click "Submit to Blockchain"
   - Wait for confirmation

4. **Run Attack Simulations**
   - Click any attack simulation button
   - Verify that attacks are blocked ✅

## Running Attack Simulations (CLI)

```bash
npm run attack
```

This simulates:
- Replay attacks
- Transaction tampering
- Fake sender attacks
- MITM attacks

All should be **blocked** by the system!

## Troubleshooting

### "Cannot connect to blockchain"
- Make sure Hardhat node is running (`npm run node`)
- Check RPC_URL in frontend config matches Hardhat node (default: `http://127.0.0.1:8545`)

### "No accounts available"
- Hardhat node should create 10 accounts automatically
- Try restarting the Hardhat node

### "Contract not found"
- Make sure contracts are deployed (`npm run deploy`)
- Update frontend config with correct addresses

### Frontend not loading
- Use a local HTTP server (not file://)
- Check browser console for errors
- Ensure all CDN scripts are loading

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the code in `crypto/` to understand the cryptography
- Check `contracts/` for smart contract logic
- Review `scripts/simulateAttack.js` to see attack patterns

## Security Notes

⚠️ **This is a demonstration system**
- Not production-ready without security audits
- Private keys are stored in browser memory (not secure for production)
- Use hardware wallets in production
- Implement proper key management

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review code comments for implementation details
- All cryptographic operations are in `crypto/` directory

---

**Happy Hacking! 🔐**

