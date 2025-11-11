import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { baseSepolia, avalancheFuji } from 'wagmi/chains';
import { formatEther, createPublicClient, http } from 'viem';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const;

// RUSD token address (same on both chains)
const RUSD_ADDRESS = (process.env.NEXT_PUBLIC_RUSD_ADDRESS || '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b') as `0x${string}`;

// Solver address for checking
const SOLVER_ADDRESS = '0xeBF1B841eFF6D50d87d4022372Bc1191E781aB68' as `0x${string}`;

// Contract address from env
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ONLYSWAP_CONTRACT_ADDRESS as `0x${string}`;

export interface SwapBalances {
  base: {
    contractBalance: string;
    contractBalanceRaw: bigint;
    solverBalance: string;
    solverBalanceRaw: bigint;
    userBalance?: string;
    userBalanceRaw?: bigint;
  };
  avalanche: {
    contractBalance: string;
    contractBalanceRaw: bigint;
    hasReceivedTokens: boolean;
  };
}

/**
 * Custom hook for checking RUSD token balances on Base Sepolia and Avalanche Fuji
 *
 * @description
 * Queries RUSD token balances for:
 * - Base Sepolia: Contract balance, Solver balance, User balance (if connected)
 * - Avalanche Fuji: Contract balance (destination chain)
 *
 * This helps track the swap progress as tokens move from Base to Avalanche.
 */
export const useSwapBalances = () => {
  const { address } = useAccount();

  // Create dedicated public clients for each chain
  const basePublicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const avaxPublicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(),
  });

  return useQuery({
    queryKey: ["onlyswap-balances", address, CONTRACT_ADDRESS],
    queryFn: async (): Promise<SwapBalances | null> => {

      try {
        // Base Sepolia balances
        const contractBaseBalance = CONTRACT_ADDRESS
          ? await basePublicClient.readContract({
              address: RUSD_ADDRESS,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [CONTRACT_ADDRESS],
            })
          : 0n;

        const solverBaseBalance = await basePublicClient.readContract({
          address: RUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [SOLVER_ADDRESS],
        });

        let userBaseBalance = 0n;
        if (address) {
          userBaseBalance = await basePublicClient.readContract({
            address: RUSD_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          });
        }

        // Avalanche Fuji balances
        const contractAvaxBalance = CONTRACT_ADDRESS
          ? await avaxPublicClient.readContract({
              address: RUSD_ADDRESS,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [CONTRACT_ADDRESS],
            })
          : 0n;

        return {
          base: {
            contractBalance: formatEther(contractBaseBalance as bigint),
            contractBalanceRaw: contractBaseBalance as bigint,
            solverBalance: formatEther(solverBaseBalance as bigint),
            solverBalanceRaw: solverBaseBalance as bigint,
            userBalance: address ? formatEther(userBaseBalance) : undefined,
            userBalanceRaw: address ? userBaseBalance : undefined,
          },
          avalanche: {
            contractBalance: formatEther(contractAvaxBalance as bigint),
            contractBalanceRaw: contractAvaxBalance as bigint,
            hasReceivedTokens: contractAvaxBalance > 0n,
          },
        };
      } catch (error) {
        console.error("Error fetching swap balances:", error);
        return null;
      }
    },
    enabled: true,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};
