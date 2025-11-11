import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { calibration } from '@filoz/synapse-core/chains'
import { baseSepolia } from 'wagmi/chains'
import { Chain } from '@rainbow-me/rainbowkit';

// Extend Base Sepolia with custom metadata for RainbowKit
const baseSepoliaChain: Chain = {
  ...baseSepolia,
  iconUrl: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4',
  iconBackground: '#0052FF',
};

// Extend Calibration with custom metadata for RainbowKit
const calibrationChain: Chain = {
  ...calibration,
  iconUrl: 'https://cryptologos.cc/logos/filecoin-fil-logo.png',
  iconBackground: '#0090FF',
};

export const config = createConfig({
  chains: [calibrationChain, baseSepoliaChain],
  connectors: [injected()],
  transports: {
    [calibration.id]: http(undefined, {
      batch: false,
    }),
    [baseSepolia.id]: http(undefined, {
      batch: false,
    }),
  },
  batch: {
    multicall: false,
  },
})
