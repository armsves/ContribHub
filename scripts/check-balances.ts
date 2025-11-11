import * as dotenv from 'dotenv';
import { ethers } from 'ethers';

// Load environment variables
dotenv.config();

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

function createProvider(rpcUrl: string): ethers.Provider {
  if (rpcUrl.startsWith('wss://') || rpcUrl.startsWith('ws://')) {
    return new ethers.WebSocketProvider(rpcUrl, undefined);
  } else {
    return new ethers.JsonRpcProvider(rpcUrl);
  }
}

async function main() {
  const baseRpcUrl = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
  const avaxRpcUrl = process.env.AVAX_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xDFCE37d029Ef1078fD528E58Da4594afC02fa48e';
  const rusdAddress = process.env.RUSD_ADDRESS || '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b';
  const solverAddress = '0xeBF1B841eFF6D50d87d4022372Bc1191E781aB68';

  console.log('🔗 Connecting to networks...\n');

  // Base Sepolia Provider
  const baseProvider = createProvider(baseRpcUrl);
  const baseRusd = new ethers.Contract(rusdAddress, ERC20_ABI, baseProvider);

  // Avalanche Fuji Provider
  const avaxProvider = createProvider(avaxRpcUrl);
  const avaxRusd = new ethers.Contract(rusdAddress, ERC20_ABI, avaxProvider);

  console.log('💰 Base Sepolia (Source Chain):');
  console.log('   ─────────────────────────────');

  try {
    // Contract balance on Base
    const contractBaseBalance = await baseRusd.balanceOf(contractAddress);
    console.log('   Contract Balance:', ethers.formatEther(contractBaseBalance), 'RUSD');

    // Solver balance on Base
    const solverBaseBalance = await baseRusd.balanceOf(solverAddress);
    console.log('   Solver Balance:  ', ethers.formatEther(solverBaseBalance), 'RUSD');
  } catch (error) {
    console.log('   ⚠️  Error fetching Base balances');
  }

  console.log('\n💰 Avalanche Fuji (Destination Chain):');
  console.log('   ─────────────────────────────────────');

  try {
    // Contract balance on Avalanche
    const contractAvaxBalance = await avaxRusd.balanceOf(contractAddress);
    console.log('   Contract Balance:', ethers.formatEther(contractAvaxBalance), 'RUSD');

    if (contractAvaxBalance > 0n) {
      console.log('   ✅ Tokens have been received on destination chain!');
    } else {
      console.log('   ⏳ Waiting for tokens on destination chain...');
    }
  } catch (error) {
    console.log('   ⚠️  Error fetching Avalanche balances');
  }

  console.log('\n📝 Contract Address:', contractAddress);
  console.log('🏦 RUSD Token Address:', rusdAddress);
  console.log('🤖 Solver Address:', solverAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

