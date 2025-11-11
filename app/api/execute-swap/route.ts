import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from 'wagmi/chains';

// Contract ABI for OnlySwap - matching the frontend
const MY_CONTRACT_ABI = [
    {
        name: 'executeSwap',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
    },
] as const;

export async function POST(request: NextRequest) {
    try {
        // Get environment variables
        const privateKey = process.env.PRIVATE_KEY;
        const myAddress = process.env.MY_ADDRESS;
        const contractAddress = process.env.NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS;
        const rpcUrl = process.env.BASE_RPC_URL || 'https://sepolia.base.org';

        // Validate required environment variables
        if (!privateKey) {
            return NextResponse.json(
                { error: 'PRIVATE_KEY not configured in environment variables' },
                { status: 500 }
            );
        }

        if (!contractAddress) {
            return NextResponse.json(
                { error: 'NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS not configured' },
                { status: 500 }
            );
        }

        // Ensure RPC URL is HTTP (not WebSocket) and use a reliable RPC
        let httpRpcUrl = rpcUrl.startsWith('wss://') || rpcUrl.startsWith('ws://')
            ? rpcUrl.replace('wss://', 'https://').replace('ws://', 'http://')
            : rpcUrl;

        // Use a more reliable RPC if the default one times out
        // Fallback to public RPC if custom one fails
        if (httpRpcUrl.includes('drpc.org')) {
            httpRpcUrl = 'https://sepolia.base.org';
        }

        console.log('🔗 Executing swap from backend...');
        console.log('📡 RPC URL:', httpRpcUrl);
        console.log('📄 Contract address:', contractAddress);

        // Create account from private key
        const account = privateKeyToAccount(privateKey as `0x${string}`);

        console.log('📝 Wallet address:', account.address);

        // Create wallet client with HTTP transport and timeout
        const walletClient = createWalletClient({
            account,
            chain: baseSepolia,
            transport: http(httpRpcUrl, {
                timeout: 30000, // 30 second timeout
            }),
        });

        // Create public client for reading with timeout
        const publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(httpRpcUrl, {
                timeout: 30000, // 30 second timeout
            }),
        });

        console.log('⏳ Getting current nonce...');
        
        // Get current nonce to avoid "nonce too low" errors
        const nonce = await publicClient.getTransactionCount({
            address: account.address,
            blockTag: 'pending',
        });
        
        console.log('📊 Current nonce:', nonce);

        console.log('⏳ Executing swap transaction...');

        // Execute swap with explicit nonce
        const hash = await walletClient.writeContract({
            address: contractAddress as `0x${string}`,
            abi: MY_CONTRACT_ABI,
            functionName: 'executeSwap',
            nonce: nonce,
        });

        console.log('⏳ Transaction hash:', hash);
        console.log('⏳ Waiting for confirmation...');

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
        });

        console.log('✅ Transaction confirmed!');
        console.log('📊 Block number:', receipt.blockNumber);
        console.log('⛽ Gas used:', receipt.gasUsed.toString());

        // Return transaction details
        return NextResponse.json({
            success: true,
            hash,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed.toString(),
            from: account.address,
            to: contractAddress,
        });
    } catch (error: any) {
        console.error('Error executing swap:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to execute swap',
                details: error.toString()
            },
            { status: 500 }
        );
    }
}

