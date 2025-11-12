"use client";

import { StorageContent } from "@/components/StorageContent";
import { useAccount, useSwitchChain } from "wagmi";
import { useBalances } from "@/hooks/useBalances";
import { calibration } from '@filoz/synapse-core/chains';
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "manage-storage" | "upload" | "datasets";

/**
 * Inner component that only renders when on Calibration chain
 * This prevents hooks from being called on wrong chains
 */
function StorageContentWrapper() {
  const { data: balances, isLoading: isLoadingBalances } = useBalances();
  const [activeTab, setActiveTab] = useState<Tab>("manage-storage");
  const router = useRouter();
  const searchParams = useSearchParams();

  /** Type guard to validate tab parameter from URL */
  const isTab = (value: string | null): value is Tab =>
    value === "manage-storage" || value === "upload" || value === "datasets";

  /** Updates URL query parameter to reflect active tab (enables shareable links) */
  const updateUrl = (tab: Tab) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`);
  };

  // Bidirectional sync: URL param ↔ local state
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
  }, [router, searchParams]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl w-full mx-auto"
    >
      <StorageContent
        activeTab={activeTab}
        balances={balances}
        isBalanceLoading={isLoadingBalances}
      />
    </motion.div>
  );
}

/**
 * Manage Storage Page
 * Dedicated page for managing Filecoin storage operations
 */
export default function ManageStoragePage() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const isOnCalibration = chainId === calibration.id;

  const handleSwitchChain = async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: calibration.id });
      }
    } catch (error) {
      console.error("Error switching chain:", error);
    }
  };

  // Show message if not connected
  if (!isConnected) {
    return (
      <div className="w-full flex flex-col min-h-screen items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-base mb-6" style={{ color: "var(--secondary)" }}>
            Please connect your wallet to manage your storage.
          </p>
        </motion.div>
      </div>
    );
  }

  // Show switch chain message if not on Calibration
  // This prevents hooks from being called on wrong chains
  if (!isOnCalibration) {
    return (
      <div className="w-full flex flex-col min-h-screen items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Switch to Calibration Network</h2>
          <p className="text-base mb-6" style={{ color: "var(--secondary)" }}>
            Please switch to the Filecoin Calibration network to manage your storage.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSwitchChain}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all"
            style={{
              backgroundColor: "#FF6A00",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FF7A10";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FF6A00";
            }}
          >
            Switch to Calibration
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Only render StorageContentWrapper when on Calibration
  // This ensures hooks are only called when on the correct chain
  return (
    <div className="w-full flex flex-col min-h-fit" style={{ backgroundColor: "var(--background)" }}>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full mx-auto px-6 py-8 max-w-7xl"
      >
        <StorageContentWrapper />
      </motion.main>
    </div>
  );
}

