import { createConfig, http } from "wagmi";
import { injected, metaMask, coinbaseWallet } from "wagmi/connectors";
import { calibration, mainnet } from '@filoz/synapse-core/chains'

// Note: Base Sepolia and Avalanche Fuji are used separately in the swap hooks
// via usePublicClient with specific chain IDs, not through the main config
export const config = createConfig({
  chains: [calibration],
  connectors: [injected()],
  transports: {
    [calibration.id]: http(undefined, {
      batch: false,
    }),
  },
  batch: {
    multicall: false,
  },
})
