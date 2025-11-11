# OnlySwaps TypeScript Scripts

These scripts allow you to interact with your deployed MyContract using TypeScript and ethers.js.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Make sure your `.env` file has all required variables:**
   ```env
   PRIVATE_KEY=0xyour_private_key
   MY_ADDRESS=0xyour_address
   BASE_RPC_URL=https://sepolia.base.org
   AVAX_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
   RUSD_ADDRESS=0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b
   ROUTER_ADDRESS=0xC69DD549B037215BA1Ea9866FFa59603862bf986
   CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ```

## Usage

### Execute a Swap

Calls the `executeSwap()` function on your deployed contract:

```bash
npm run execute-swap
```

This will:
- Connect to Base Sepolia
- Call the executeSwap function
- Display the transaction hash and request ID
- Show gas used

### Check Swap Status

Checks whether your swap has been fulfilled and verified:

```bash
npm run check-status
```

This will:
- Display the request ID
- Show if the swap has finished executing
- Display detailed swap parameters from the router

### Check Balances

Checks token balances on both chains:

```bash
npm run check-balances
```

This will display:
- Your contract's RUSD balance on Base Sepolia (source)
- The Randamu solver's RUSD balance on Base Sepolia
- Your contract's RUSD balance on Avalanche Fuji (destination)

## Alternative: Using `npx tsx` directly

You can also run the scripts directly without npm:

```bash
npx tsx scripts/execute-swap.ts
npx tsx scripts/check-status.ts
npx tsx scripts/check-balances.ts
```

## Comparison with Cast Commands

These TypeScript scripts do the same thing as the cast commands from the workshop:

| Cast Command | TypeScript Script |
|--------------|------------------|
| `cast send $CONTRACT_ADDRESS "executeSwap()" ...` | `npm run execute-swap` |
| `cast call $CONTRACT_ADDRESS "hasFinishedExecuting()" ...` | `npm run check-status` |
| `cast call $RUSD_ADDRESS "balanceOf(address)" ...` | `npm run check-balances` |

## Benefits of TypeScript Scripts

- **Better error handling**: Clear error messages and proper error handling
- **Formatted output**: Human-readable output with emojis and formatting
- **Multiple operations**: One script can perform multiple related operations
- **Type safety**: TypeScript provides type checking
- **Reusable code**: Easy to extend and modify for your needs

## Example Output

```
🔗 Connecting to Base Sepolia...
📝 Wallet address: 0xEC9ccF7fA3a469F2273AC44e509eA3a4E864dfe9
💰 Wallet balance: 0.5 ETH
📄 Contract address: 0xDFCE37d029Ef1078fD528E58Da4594afC02fa48e

🚀 Executing swap...
⏳ Transaction hash: 0x1f486f35c37934cf9fa4687f441ead6b119581ad0b597a16d513be569ec74185
⏳ Waiting for confirmation...
✅ Transaction confirmed!
📊 Block number: 33514230
⛽ Gas used: 427153

🎫 Request ID: 0x71587ad7e69f6a4b77de718a47511fb9d5a4227de9b8cec22a534935934f5f47
✓ Swap initiated. Currently finished: true
```

