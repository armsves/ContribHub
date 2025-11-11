import { useAccount } from "wagmi";
import { useDataSets } from "@filoz/synapse-react";
import { calibration } from '@filoz/synapse-core/chains';

/**
 * Wrapper around useDataSets that only calls it when on Filecoin Calibration chain
 * This prevents "Chain with id X not found" errors when on other chains
 */
export const useDataSetsWrapped = () => {
  const { address, chainId } = useAccount();

  // Check if we're on the correct chain for synapse operations
  const isOnCalibration = chainId === calibration.id;

  // Only call the hook when on the correct chain
  // This prevents the hook from running internal chain checks on wrong networks
  const result = useDataSets({
    address: isOnCalibration ? address : undefined,
  });

  // If not on calibration, return safe defaults
  if (!isOnCalibration) {
    return {
      data: [],
      isLoading: false,
      isFetchedAfterMount: true,
      error: null,
    };
  }

  return result;
};
