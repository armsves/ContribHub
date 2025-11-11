"use client";
import { StorageManager } from "@/components/StorageManager";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "@/components/ui/Confetti";
import { useConfetti } from "@/hooks/useConfetti";
import { DatasetsViewer } from "@/components/DatasetsViewer";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useBalances } from "@/hooks/useBalances";
import Github from "@/components/ui/icons/Github";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { calibration } from '@filoz/synapse-core/chains';
import { StorageContent } from "@/components/StorageContent";
/** Valid tab identifiers for application navigation */
type Tab = "manage-storage" | "upload" | "datasets";

// Animation variants for smooth tab transitions using Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "smooth",
    },
  },
};

/**
 * Root page component orchestrating the main application UI.
 * Manages tab-based navigation, data fetching, and distribution to child components.
 * Synchronizes active tab with URL parameters for shareable links.
 *
 * @example
 * URL patterns:
 * - /?tab=manage-storage - Storage management dashboard
 * - /?tab=upload - File upload interface
 * - /?tab=datasets - Dataset viewer
 */
export default function Home() {
  const { isConnected, address, chainId } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("manage-storage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showConfetti } = useConfetti();

  // Check if we're on the correct chain for synapse operations
  const isOnCalibration = chainId === calibration.id;

  // Fetch data at top level and distribute via props for centralized loading state
  const { data: balances, isLoading: isLoadingBalances } = useBalances();

  /** Type guard to validate tab parameter from URL */
  const isTab = (value: string | null): value is Tab =>
    value === "manage-storage" || value === "upload" || value === "datasets";

  /** Updates URL query parameter to reflect active tab (enables shareable links) */
  const updateUrl = (tab: Tab) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`);
  };

  /** Handles tab switching with URL synchronization */
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    updateUrl(tab);
  };

  // Bidirectional sync: URL param ↔ local state
  // URL is source of truth on mount, state updates URL on change
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (isTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      updateUrl(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Listen for tab change events from StorageContent
  useEffect(() => {
    const onTabChange = (e: any) => {
      if (isTab(e.detail)) {
        setActiveTab(e.detail);
        updateUrl(e.detail);
      }
    };
    window.addEventListener('changeTab', onTabChange);
    return () => window.removeEventListener('changeTab', onTabChange);
  }, []);

  return (
    <div className="w-full flex flex-col justify-center min-h-fit">
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        />
      )}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center my-10  w-full mx-auto"
      >
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="sm:text-3xl text-xl font-bold uppercase tracking-tighter text-foreground flex flex-col sm:flex-row items-center gap-2"
        >
          <div className="flex items-center gap-2">
            <Image src="/filecoin.svg" alt="Filecoin" width={30} height={30} />
            <span>Filecoin onchain cloud</span>
          </div>
          <motion.p
            variants={itemVariants}
            className="text-lg font-medium lowercase transition-colors duration-50 hover:text-foreground flex flex-row items-center gap-2 text-secondary"
          >
            <motion.a
              whileHover={{ scale: 1.3 }}
              href="https://github.com/FIL-Builders/fs-upload-dapp"
              className="text-primary transition-colors duration-200 hover:underline cursor-pointer rounded-md hover:text-[#008cf6]"
              target="_blank"
            >
              <Github />
            </motion.a>
            <span>powered by</span>
            <motion.a
              href="https://github.com/FilOzone/synapse-sdk"
              className="text-primary transition-colors duration-200 hover:underline cursor-pointer hover:text-[#008cf6] rounded-md p-1"
              target="_blank"
            >
              synapse-sdk
            </motion.a>
          </motion.p>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-base font-medium capitalize-none transition-colors duration-50 mb-2 mt-1 hover:text-foreground flex flex-col sm:flex-row items-center gap-2 text-center text-secondary"
        >
          <span>
            upload files to filecoin with{" "}
            <motion.a
              href="https://docs.secured.finance/usdfc-stablecoin/getting-started"
              className="text-[#e9ac00] hover:underline cursor-pointer"
              target="_blank"
            >
              USDFC
            </motion.a>
          </span>

          <span className="hidden sm:inline">your balance is</span>
          <span className="font-bold hidden sm:inline">
            {isLoadingBalances || !isConnected
              ? "..."
              : balances?.usdfcBalanceFormatted.toFixed(1) + "$"}
          </span>
        </motion.p>
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="connect"
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="flex flex-col items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ConnectButton />
              </motion.div>
              <motion.p variants={itemVariants} className="mt-3 text-secondary">
                <span className="hidden sm:inline">
                  Please connect your wallet to upload dApp
                </span>
                <span className="sm:hidden">Connect wallet to continue</span>
              </motion.p>
            </motion.div>
          ) : !isOnCalibration ? (
            <motion.div
              key="wrong-network"
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center max-w-2xl"
            >
              <div className="p-6 bg-yellow-500/10 border border-yellow-500 rounded-lg text-center">
                <h3 className="text-xl font-bold text-yellow-500 mb-2">
                  Wrong Network
                </h3>
                <p className="text-yellow-500 mb-4">
                  Storage features require Filecoin Calibration network. Please switch your network using the wallet button above.
                </p>
                <p className="text-sm text-secondary">
                  For cross-chain swaps, visit the <a href="/swap" className="text-primary hover:underline">OnlySwap page</a>.
                </p>
              </div>
            </motion.div>
          ) : (
            <StorageContent
              activeTab={activeTab}
              balances={balances}
              isBalanceLoading={isLoadingBalances}
            />
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
