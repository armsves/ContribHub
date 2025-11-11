"use client";

import { StorageManager } from "@/components/StorageManager";
import { FileUploader } from "@/components/FileUploader";
import { DatasetsViewer } from "@/components/DatasetsViewer";
import { motion, AnimatePresence } from "framer-motion";
import { useDataSets } from "@filoz/synapse-react";
import { useAccount } from "wagmi";

type Tab = "manage-storage" | "upload" | "datasets";

interface StorageContentProps {
  activeTab: Tab;
  balances: any;
  isBalanceLoading: boolean;
}

/**
 * Component that handles storage operations - only rendered when on Calibration chain
 * This prevents synapse hooks from running on incompatible chains
 */
export function StorageContent({ activeTab, balances, isBalanceLoading }: StorageContentProps) {
  const { address } = useAccount();

  const {
    data: datasetsData,
    isLoading,
    isFetchedAfterMount,
  } = useDataSets({
    address,
  });

  const isLoadingDatasets = isLoading || !isFetchedAfterMount;

  return (
    <motion.div
      key="content"
      className="mt-3 max-w-5xl w-full card-dark p-8"
    >
      <div className="flex mb-6">
        <div className="flex-1 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const event = new CustomEvent('changeTab', { detail: 'manage-storage' });
              window.dispatchEvent(event);
            }}
            className={`flex-1 py-3 px-4 text-center rounded-lg sm:text-base text-xs transition-all font-semibold ${
              activeTab === "manage-storage"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-secondary hover:text-foreground hover:bg-muted"
            }`}
          >
            Manage Storage
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const event = new CustomEvent('changeTab', { detail: 'upload' });
              window.dispatchEvent(event);
            }}
            className={`flex-1 py-3 px-4 text-center rounded-lg sm:text-base text-xs transition-all font-semibold ${
              activeTab === "upload"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-secondary hover:text-foreground hover:bg-muted"
            }`}
          >
            Upload File
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const event = new CustomEvent('changeTab', { detail: 'datasets' });
              window.dispatchEvent(event);
            }}
            className={`flex-1 py-3 px-4 text-center rounded-lg sm:text-base text-xs transition-all font-semibold ${
              activeTab === "datasets"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-secondary hover:text-foreground hover:bg-muted"
            }`}
          >
            View Datasets
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="deposit"
          className={`${
            activeTab === "manage-storage" ? "opacity-100" : "hidden"
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
        >
          <StorageManager
            balances={balances}
            datasetsData={datasetsData ?? []}
            isBalanceLoading={isBalanceLoading}
          />
        </motion.div>
        <motion.div
          key="upload"
          className={`${
            activeTab === "upload" ? "opacity-100" : "hidden"
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: +20 }}
          transition={{
            type: "smooth",
          }}
        >
          <FileUploader
            datasetsData={datasetsData ?? []}
            isLoadingDatasets={isLoadingDatasets}
          />
        </motion.div>

        <motion.div
          key="datasets"
          className={`${
            activeTab === "datasets" ? "opacity-100" : "hidden"
          }`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
        >
          <DatasetsViewer
            datasetsData={datasetsData ?? []}
            isLoadingDatasets={isLoadingDatasets}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
