# OnlySwap Integration Setup Guide

This guide will walk you through setting up the OnlySwap cross-chain swap feature in your Filecoin dApp.

## Overview

The OnlySwap integration allows users to execute cross-chain token swaps from Base Sepolia to Avalanche Fuji using RUSD tokens. The integration includes:

- **Execute Swap**: Initiate cross-chain swaps
- **Check Status**: Monitor swap progress and completion
- **View Balances**: Track RUSD balances on both chains

## Prerequisites

Before you begin, make sure you have:

1. **Node.js 18+** and npm installed
2. **A web3 wallet** (like MetaMask) configured for:
   - Base Sepolia testnet
   - Avalanche Fuji testnet
3. **Testnet tokens**:
   - ETH on Base Sepolia for gas fees
   - RUSD tokens on Base Sepolia (for swapping)

## Environment Variables Setup

### 1. Create or Update `.env.local`

Create a `.env.local` file in the root of your project if it doesn't exist:

```bash
touch .env.local
```

### 2. Add Required Variables

Add the following environment variables to your `.env.local` file:

```env
# ============================================
# OnlySwap Configuration
# ============================================

# Your deployed OnlySwap contract address
# This is the contract that executes the swap
NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# OnlySwap Router Address (default provided)
# This is the router contract that manages swap requests
NEXT_PUBLIC_ONLYSWAP_ROUTER_ADDRESS=0xC69DD549B037215BA1Ea9866FFa59603862bf986

# RUSD Token Address (same on both Base Sepolia and Avalanche Fuji)
# Default value is provided, but you can override it if needed
NEXT_PUBLIC_RUSD_ADDRESS=0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b

# ============================================
# Optional: For Scripts Only
# (These are only needed if you want to run the TypeScript scripts)
# ============================================

# Private key for executing scripts (DO NOT commit this!)
PRIVATE_KEY=0xyour_private_key_here

# Your wallet address
MY_ADDRESS=0xyour_address_here

# RPC URLs (defaults are provided in the app)
BASE_RPC_URL=https://sepolia.base.org
AVAX_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

### 3. Important Notes

- **REQUIRED**: You MUST set `NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS` to your deployed contract address
- **OPTIONAL**: The router and RUSD addresses have defaults, but you can override them if needed
- **SECURITY**: Never commit your `.env.local` file or share your private key
- **SCRIPTS**: The `PRIVATE_KEY` and script-related variables are only needed for running the TypeScript scripts in the `scripts/` folder

## Getting Your Contract Address

### Option 1: Deploy Your Own Contract

If you haven't deployed a contract yet, you'll need to:

1. Deploy the OnlySwap contract to Base Sepolia
2. Copy the deployed contract address
3. Set it as `NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS` in `.env.local`

### Option 2: Use Example Address (For Testing)

If you're just testing the integration, you can use the example address from the scripts:

```env
NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS=0xDFCE37d029Ef1078fD528E58Da4594afC02fa48e
```

**Note**: This is an example address and may not have RUSD tokens or work as expected.

## Getting Test Tokens

### Base Sepolia ETH (for gas)

Get Base Sepolia ETH from:
- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- https://faucet.quicknode.com/base/sepolia

### RUSD Tokens

RUSD tokens can be obtained from:
1. Contact the OnlySwap team for testnet RUSD tokens
2. Use the provided faucet (if available)
3. Swap from other testnet tokens

### Avalanche Fuji AVAX (for destination chain gas)

Get Fuji testnet tokens from:
- https://core.app/tools/testnet-faucet/

## Network Configuration

The dApp now supports multiple networks and automatic chain switching:

### Filecoin Calibration (Storage)
- **Chain ID**: 314159
- **Purpose**: File storage using Synapse SDK
- **Used For**: Main storage page (/)
- **Block Explorer**: https://calibration.filfox.info

### Base Sepolia (OnlySwap)
- **Chain ID**: 84532
- **Purpose**: Cross-chain swap source chain
- **Used For**: OnlySwap page (/swap)
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org

### Avalanche Fuji (OnlySwap Destination)
- **Chain ID**: 43113
- **Purpose**: Cross-chain swap destination chain
- **RPC URL**: https://api.avax-test.network/ext/bc/C/rpc
- **Block Explorer**: https://testnet.snowtrace.io

### Chain Switching
- The wallet will start on **Filecoin Calibration** by default
- When you navigate to the OnlySwap page, you'll be prompted to switch to **Base Sepolia**
- Chain switching is automatic via the wallet - just approve the switch request
- The ConnectButton in the navbar shows which chain you're currently on

## Running the Application

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Navigate to OnlySwap

Click the "OnlySwap" button in the navigation bar to access the swap interface.

## Using the OnlySwap Interface

### 1. Connect Wallet

Click "Connect Wallet" and connect your MetaMask or other web3 wallet.

### 2. Switch to Base Sepolia

If you're not already on Base Sepolia, the interface will prompt you to switch networks.

### 3. Execute a Swap

Click the "Execute Swap" button to initiate a cross-chain swap. This will:
- Prompt you to approve the transaction in your wallet
- Submit the swap request to the OnlySwap contract
- Display the transaction status

### 4. Monitor Progress

The interface will automatically:
- Show the swap status (Processing/Completed)
- Display the request ID
- Update balances on both chains
- Show when tokens are received on Avalanche Fuji

## Running TypeScript Scripts

You can also interact with OnlySwap using the TypeScript scripts in the `scripts/` folder.

### Setup for Scripts

Make sure you have all the environment variables set in `.env.local`, including:
- `PRIVATE_KEY`
- `MY_ADDRESS`
- `NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS`

### Execute a Swap

```bash
npm run execute-swap
```

Or with npx:

```bash
npx tsx scripts/execute-swap.ts
```

### Check Swap Status

```bash
npm run check-status
```

Or with npx:

```bash
npx tsx scripts/check-status.ts
```

### Check Balances

```bash
npm run check-balances
```

Or with npx:

```bash
npx tsx scripts/check-balances.ts
```

## Troubleshooting

### "Contract address not configured" Error

**Solution**: Make sure you've set `NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS` in your `.env.local` file and restarted the dev server.

### Wallet Not Prompting for Transaction

**Solution**:
1. Make sure you're connected to the correct network (Base Sepolia)
2. Check that you have enough ETH for gas fees
3. Try refreshing the page

### Swap Not Completing

**Solution**:
1. Wait 5-10 minutes as cross-chain swaps can take time
2. Check the swap status on the page
3. Verify balances to see if tokens have moved
4. Check the transaction on Base Sepolia block explorer

### Balance Not Updating

**Solution**:
1. The page auto-refreshes balances every 10 seconds
2. Try manually refreshing the page
3. Check if you have RUSD tokens in your contract

## Additional Resources

- [OnlySwap Documentation](https://docs.onlyswap.io)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Avalanche Fuji Faucet](https://core.app/tools/testnet-faucet/)
- [MetaMask Setup Guide](https://support.metamask.io/hc/en-us/articles/360043227612)

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure you have testnet tokens for gas
4. Restart the development server after changing `.env.local`

## Next Steps

Once your OnlySwap integration is working:

1. Test the full swap flow end-to-end
2. Monitor balances on both chains
3. Integrate with your existing dApp features
4. Deploy to production (remember to update contract addresses for mainnet)

---

**Note**: This integration is designed for testnet use. For production deployment, you'll need to:
- Deploy contracts to mainnet networks
- Update all contract addresses
- Use real tokens instead of testnet tokens
- Implement additional security measures
