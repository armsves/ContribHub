import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAccount, useConfig as useWagmiConfig, useWalletClient } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useConfetti } from "@/hooks/useConfetti";
import { baseSepolia } from 'wagmi/chains';
import { createPublicClient, http } from 'viem';

// Contract ABIs for OnlySwap
const MY_CONTRACT_ABI = [
  {
    name: 'executeSwap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'hasFinishedExecuting',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'lastRequestId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
  },
] as const;

const ROUTER_ABI = [
  {
    name: 'getSwapRequestParameters',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'requestId', type: 'bytes32' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'sender', type: 'address' },
          { name: 'recipient', type: 'address' },
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountOut', type: 'uint256' },
          { name: 'srcChainId', type: 'uint256' },
          { name: 'dstChainId', type: 'uint256' },
          { name: 'verificationFee', type: 'uint256' },
          { name: 'solverFee', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'executed', type: 'bool' },
          { name: 'requestedAt', type: 'uint256' },
        ],
      },
    ],
  },
] as const;

// Environment variables - these should be set in .env.local
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS as `0x${string}`;
const ROUTER_ADDRESS = (process.env.NEXT_PUBLIC_ONLYSWAP_ROUTER_ADDRESS || '0xC69DD549B037215BA1Ea9866FFa59603862bf986') as `0x${string}`;

export interface SwapStatus {
  requestId: string;
  isFinished: boolean;
  swapDetails?: {
    sender: string;
    recipient: string;
    tokenIn: string;
    tokenOut: string;
    amountOut: string;
    srcChainId: string;
    dstChainId: string;
    verificationFee: string;
    solverFee: string;
    nonce: string;
    executed: boolean;
    requestedAt: Date;
  };
}

/**
 * Custom hook for executing OnlySwap cross-chain swaps
 *
 * @description
 * This hook manages the cross-chain swap flow using OnlySwap protocol.
 * It executes swaps from Base Sepolia to Avalanche Fuji using RUSD tokens.
 *
 * @returns {Object} Swap mutation and status
 * @returns {Object} mutation - TanStack Query mutation object with mutateAsync function
 * @returns {string} status - Human-readable status message for UI display
 */
export const useSwap = (ignoreConfetti = false) => {
  const [status, setStatus] = useState<string>("");
  const { triggerConfetti } = useConfetti();
  const { address, chainId } = useAccount();
  const wagmiConfig = useWagmiConfig();
  const queryClient = useQueryClient();
  const { data: walletClient } = useWalletClient();

  const mutation = useMutation({
    mutationKey: ["onlyswap-execute", address],
    mutationFn: async () => {
      // Validation
      if (!address) throw new Error("Wallet not connected");
      if (!walletClient) throw new Error("Wallet client not found");
      if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured. Please set NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS in .env.local");
      if (chainId !== baseSepolia.id) throw new Error("Please switch to Base Sepolia network");

      setStatus("🔗 Preparing swap transaction...");

      // Execute swap
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: MY_CONTRACT_ABI,
        functionName: 'executeSwap',
        chain: baseSepolia,
      });

      setStatus(`⏳ Swap transaction submitted: ${hash.slice(0, 10)}...`);

      // Wait for confirmation
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        chainId: baseSepolia.id,
      });

      setStatus("✅ Swap initiated successfully!");

      return {
        hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    },
    onSuccess: (data) => {
      setStatus(`✅ Swap initiated! Block: ${data.blockNumber}`);
      if (!ignoreConfetti) {
        triggerConfetti();
      }
      // Invalidate queries to refresh swap status
      queryClient.invalidateQueries({
        queryKey: ["onlyswap-status", address],
      });
    },
    onError: (error: any) => {
      console.error("Swap failed:", error);
      setStatus(
        `❌ ${error.message || "Swap failed. Please try again."}`
      );
    },
  });

  return { mutation, status };
};

/**
 * Custom hook for checking OnlySwap status
 *
 * @description
 * Queries the current status of the last swap request including
 * request ID, completion status, and detailed swap parameters.
 */
export const useSwapStatus = () => {
  const { address } = useAccount();

  // Create dedicated public client for Base Sepolia
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  return useQuery({
    queryKey: ["onlyswap-status", address],
    queryFn: async (): Promise<SwapStatus | null> => {
      if (!CONTRACT_ADDRESS) return null;

      try {
        // Get last request ID
        const requestId = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: MY_CONTRACT_ABI,
          functionName: 'lastRequestId',
        }) as `0x${string}`;

        // Check if any swap has been executed
        if (requestId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          return null;
        }

        // Check if finished
        const isFinished = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: MY_CONTRACT_ABI,
          functionName: 'hasFinishedExecuting',
        }) as boolean;

        // Get detailed parameters from router
        let swapDetails;
        try {
          const params = await publicClient.readContract({
            address: ROUTER_ADDRESS,
            abi: ROUTER_ABI,
            functionName: 'getSwapRequestParameters',
            args: [requestId],
          }) as any;

          swapDetails = {
            sender: params.sender,
            recipient: params.recipient,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountOut: params.amountOut.toString(),
            srcChainId: params.srcChainId.toString(),
            dstChainId: params.dstChainId.toString(),
            verificationFee: params.verificationFee.toString(),
            solverFee: params.solverFee.toString(),
            nonce: params.nonce.toString(),
            executed: params.executed,
            requestedAt: new Date(Number(params.requestedAt) * 1000),
          };
        } catch (error) {
          console.warn("Could not fetch swap parameters from router:", error);
        }

        return {
          requestId,
          isFinished,
          swapDetails,
        };
      } catch (error) {
        console.error("Error fetching swap status:", error);
        return null;
      }
    },
    enabled: !!address && !!CONTRACT_ADDRESS,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};
