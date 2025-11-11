import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import WebSocket from 'ws';

// Load environment variables
dotenv.config();

// Contract ABI - extracted from compiled output
const MY_CONTRACT_ABI = [
  "constructor(address _owner)",
  "function executeSwap()",
  "function hasFinishedExecuting() view returns (bool)",
  "function lastRequestId() view returns (bytes32)"
];

function createProvider(rpcUrl: string): ethers.Provider {
  if (rpcUrl.startsWith('wss://') || rpcUrl.startsWith('ws://')) {
    return new ethers.WebSocketProvider(rpcUrl, undefined, { WebSocket: WebSocket as any });
  } else {
    return new ethers.JsonRpcProvider(rpcUrl);
  }
}

async function main() {
  // Get environment variables with defaults
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xDFCE37d029Ef1078fD528E58Da4594afC02fa48e';

  if (!privateKey) {
    throw new Error('Missing required environment variable: PRIVATE_KEY');
  }

  console.log('🔗 Connecting to Base Sepolia...');
  console.log('📡 RPC URL:', rpcUrl);
  const provider = createProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('📝 Wallet address:', wallet.address);
  
  // Get wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Wallet balance:', ethers.formatEther(balance), 'ETH');

  // Connect to the contract
  const contract = new ethers.Contract(contractAddress, MY_CONTRACT_ABI, wallet);
  
  console.log('📄 Contract address:', contractAddress);
  
  // Execute the swap
  console.log('\n🚀 Executing swap...');
  const tx = await contract.executeSwap();
  console.log('⏳ Transaction hash:', tx.hash);
  
  console.log('⏳ Waiting for confirmation...');
  const receipt = await tx.wait();
  
  console.log('✅ Transaction confirmed!');
  console.log('📊 Block number:', receipt.blockNumber);
  console.log('⛽ Gas used:', receipt.gasUsed.toString());
  
  // Get the request ID
  const requestId = await contract.lastRequestId();
  console.log('\n🎫 Request ID:', requestId);
  
  // Check if it's finished (it won't be immediately)
  const isFinished = await contract.hasFinishedExecuting();
  console.log('✓ Swap initiated. Currently finished:', isFinished);
  
  console.log('\n💡 Use "npm run check-status" to check the swap status');
  console.log('💡 Use "npm run check-balances" to check balances on both chains');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

