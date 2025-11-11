import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import WebSocket from 'ws';

// Load environment variables
dotenv.config();

// Contract ABIs
const MY_CONTRACT_ABI = [
  "function hasFinishedExecuting() view returns (bool)",
  "function lastRequestId() view returns (bytes32)"
];

const ROUTER_ABI = [
  "function getSwapRequestParameters(bytes32 requestId) view returns (tuple(address sender, address recipient, address tokenIn, address tokenOut, uint256 amountOut, uint256 srcChainId, uint256 dstChainId, uint256 verificationFee, uint256 solverFee, uint256 nonce, bool executed, uint256 requestedAt))"
];

function createProvider(rpcUrl: string): ethers.Provider {
  if (rpcUrl.startsWith('wss://') || rpcUrl.startsWith('ws://')) {
    // Use WebSocketProvider for WebSocket URLs
    return new ethers.WebSocketProvider(rpcUrl, undefined, { WebSocket: WebSocket as any });
  } else {
    // Use JsonRpcProvider for HTTP(S) URLs
    return new ethers.JsonRpcProvider(rpcUrl);
  }
}

async function main() {
  // Use default HTTP URL if not provided
  const rpcUrl = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xDFCE37d029Ef1078fD528E58Da4594afC02fa48e';
  const routerAddress = process.env.ROUTER_ADDRESS || '0xC69DD549B037215BA1Ea9866FFa59603862bf986';

  console.log('🔗 Connecting to Base Sepolia...');
  console.log('📡 RPC URL:', rpcUrl);
  const provider = createProvider(rpcUrl);

  // Connect to contracts
  const myContract = new ethers.Contract(contractAddress, MY_CONTRACT_ABI, provider);
  const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);

  console.log('📄 Checking swap status...\n');

  // Get the request ID
  const requestId = await myContract.lastRequestId();
  console.log('🎫 Request ID:', requestId);

  if (requestId === ethers.ZeroHash) {
    console.log('⚠️  No swap has been executed yet.');
    return;
  }

  // Check if finished via MyContract
  const isFinished = await myContract.hasFinishedExecuting();
  console.log('✓ Has finished executing:', isFinished ? '✅ YES' : '⏳ NO (still processing)');

  // Get detailed parameters from router
  try {
    const params = await router.getSwapRequestParameters(requestId);
    console.log('\n📊 Swap Details:');
    console.log('   Sender:', params.sender);
    console.log('   Recipient:', params.recipient);
    console.log('   Token In:', params.tokenIn);
    console.log('   Token Out:', params.tokenOut);
    console.log('   Amount Out:', ethers.formatEther(params.amountOut), 'tokens');
    console.log('   Source Chain ID:', params.srcChainId.toString());
    console.log('   Destination Chain ID:', params.dstChainId.toString());
    console.log('   Verification Fee:', ethers.formatEther(params.verificationFee), 'tokens');
    console.log('   Solver Fee:', ethers.formatEther(params.solverFee), 'tokens');
    console.log('   Nonce:', params.nonce.toString());
    console.log('   Executed:', params.executed ? '✅ YES' : '⏳ NO');
    console.log('   Requested At:', new Date(Number(params.requestedAt) * 1000).toLocaleString());
  } catch (error) {
    console.log('\n⚠️  Could not fetch swap parameters from router');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

