# 🚀 Quick Start Guide

Get the secure blockchain protocol running with MetaMask in 5 minutes!

## Prerequisites

- ✅ Node.js v16+
- ✅ MetaMask browser extension
- ✅ Alchemy account (free)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Alchemy API Key

1. Go to https://www.alchemy.com/
2. Create free account
3. Create new app → Select "Sepolia" network
4. Copy API key

## Step 3: Configure Environment

Create `.env` file in project root:

```env
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_deployer_private_key
```

## Step 4: Compile Contracts

```bash
npm run compile
```

## Step 5: Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Copy the contract addresses** from output!

## Step 6: Update Frontend Config

Edit `frontend/app.js`, update `CONFIG`:

```javascript
const CONFIG = {
    VALIDATOR_REGISTRY_ADDRESS: '0x...', // From deployment
    SECURE_LEDGER_ADDRESS: '0x...',      // From deployment
    ALCHEMY_RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'
};
```

## Step 7: Get Sepolia ETH

Get testnet ETH from:
- https://sepoliafaucet.com/
- https://faucet.quicknode.com/ethereum/sepolia
- https://www.alchemy.com/faucets/ethereum-sepolia

## Step 8: Open Frontend

**Option A: Local Server (Recommended)**
```bash
cd frontend
python -m http.server 8000
# Or: npx http-server -p 8000
```

Open: `http://localhost:8000`

**Option B: Direct File**
- Open `frontend/index.html` in browser
- May have limitations with local files

## Step 9: Connect MetaMask

1. **Click "Connect MetaMask"**
2. **Approve connection** in MetaMask popup
3. **Switch to Sepolia** if prompted
4. **Verify connection** - Account and balance should appear

## Step 10: Send First Transaction

1. **Enter receiver address** - Another MetaMask address
2. **Enter receiver protocol public key** - ECC public key (see note below)
3. **Enter amount** - e.g., 0.001 ETH
4. **Click "Send ETH Transaction"**
5. **Approve in MetaMask** - Review and confirm
6. **Wait for confirmation** - Check Etherscan link

### Getting Protocol Public Keys

For testing, you can:
- Use the same address twice (sender = receiver)
- Generate ECC keys using: `node -e "const EC = require('elliptic').ec; const ec = new EC('secp256k1'); const key = ec.genKeyPair(); console.log('Public:', key.getPublic(true, 'hex'));"`

## Step 11: Test Attack Simulations

After successful transaction:

1. **Click any attack button** (Replay, Tamper, Fake Sender, MITM)
2. **Verify attacks are blocked** ✅
3. **Check console** for detailed results

## Troubleshooting

### "MetaMask not detected"
- Install MetaMask extension
- Refresh page
- Check extension is enabled

### "Please switch to Sepolia"
- Click MetaMask extension
- Select "Sepolia" from network dropdown
- Or click "Switch Network" in UI

### "Insufficient balance"
- Get Sepolia ETH from faucet
- Wait for faucet transaction to confirm

### "Transaction reverted"
- Check contract addresses are correct
- Verify you have Sepolia ETH
- Check nonce is correct

### "Contract not found"
- Verify contracts are deployed
- Check addresses in `frontend/app.js`
- Ensure network is Sepolia

## What Happens Behind the Scenes

1. **MetaMask** signs and sends ETH transaction
2. **Protocol** encrypts payload using ECIES
3. **Encrypted payload** attached to transaction data
4. **Smart contract** validates nonce, timestamp, signature
5. **Transaction** confirmed on Sepolia

## Key Points

✅ **Only MetaMask accounts** - No manual key generation  
✅ **Real ETH transactions** - On Sepolia testnet  
✅ **Encrypted payloads** - ECC-based encryption  
✅ **Attack resistant** - Multiple security layers  

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Explore `crypto/` directory for cryptography details
- Review `contracts/` for smart contract logic
- Test all attack simulations

## Need Help?

- Check browser console for errors
- Verify MetaMask is on Sepolia
- Ensure contracts are deployed
- Check contract addresses in config

---

**Ready to go! Connect MetaMask and start sending secure transactions! 🚀**
