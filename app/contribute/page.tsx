"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Send, AlertCircle, Plus } from "lucide-react";
import Confetti from "@/components/ui/Confetti";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount, useSwitchChain } from "wagmi";
import { useContributions } from "@/hooks/useContributions";
import { useDataSetsWrapped } from "@/hooks/useDataSetsWrapped";
import { Select } from "@/components/ui/Select";
import { useUploadJson } from "@/hooks/useUploadJson";
import { useRouter } from "next/navigation";
import { calibration } from '@filoz/synapse-core/chains';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

interface FormData {
  title: string;
  websiteUrl: string;
  category: string;
  paymentNetwork: string;
}

interface FormErrors {
  title?: string;
  websiteUrl?: string;
  category?: string;
  paymentNetwork?: string;
}

export default function ContributePage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const router = useRouter();
  const { addContribution } = useContributions();
  const { data: datasetsData, isLoading: isLoadingDatasets } = useDataSetsWrapped();
  const { uploadJsonMutation, uploadedInfo, handleReset, status, progress } = useUploadJson();
  const { mutateAsync: uploadJson } = uploadJsonMutation;
  const isOnCalibration = chainId === calibration.id;

  const [formData, setFormData] = useState<FormData>({
    title: "",
    websiteUrl: "",
    category: "",
    paymentNetwork: "base",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const { triggerConfetti, showConfetti } = useConfetti();

  const categories = [
    "Storage Provider",
    "DeFi Protocol",
    "NFT Marketplace",
    "Cross-Chain Bridge",
    "Wallet",
    "Analytics Tool",
    "Development Tool",
    "Other"
  ];

  const paymentNetworks = [
    { value: "base", label: "Base" },
    { value: "avalanche", label: "Avalanche" },
    { value: "arbitrum", label: "Arbitrum" },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    // Validate URL
    if (!formData.websiteUrl.trim()) {
      newErrors.websiteUrl = "Website URL is required";
    } else {
      try {
        const url = new URL(formData.websiteUrl);
        if (!url.protocol.startsWith('http')) {
          newErrors.websiteUrl = "URL must start with http:// or https://";
        }
      } catch {
        newErrors.websiteUrl = "Please enter a valid URL";
      }
    }

    // Validate category
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    // Validate payment network
    if (!formData.paymentNetwork) {
      newErrors.paymentNetwork = "Please select a payment network";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSwitchChain = async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: calibration.id });
      }
    } catch (error) {
      console.error("Error switching chain:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!isConnected || !address) {
      alert("Please connect your wallet");
      return;
    }

    if (!isOnCalibration) {
      alert("Please switch to Filecoin Calibration network");
      if (switchChain) {
        await switchChain({ chainId: calibration.id });
      }
      return;
    }

    if (!selectedDatasetId) {
      alert("Please select a dataset to store your contribution");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload form data as JSON to Filecoin storage
      // The status and progress are managed by the uploadJsonMutation hook
      const uploadResult = await uploadJson({
        data: {
          title: formData.title,
          websiteUrl: formData.websiteUrl,
          category: formData.category,
          paymentNetwork: formData.paymentNetwork,
          contributor: address,
          timestamp: new Date().toISOString(),
        },
        datasetId: selectedDatasetId,
        fileName: `contribution-${formData.title.replace(/\s+/g, '-').toLowerCase()}.json`,
      });

      // Get uploaded info after upload completes
      // Note: uploadedInfo might not be updated immediately, so we wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));
      const pieceCid = uploadedInfo?.pieceCid;
      const txHash = uploadedInfo?.txHash;
      const fileSize = uploadedInfo?.fileSize;

      // Create contribution (PR entry) - represents a GitHub PR waiting for AI processing
      const contribution = await addContribution({
        contributor: address,
        data: {
          ...formData,
          pieceCid,
          txHash,
          fileSize,
          fileName: `contribution-${formData.title.replace(/\s+/g, '-').toLowerCase()}.json`,
          datasetId: selectedDatasetId,
        },
        status: "pending", // Waiting for AI processing (like a PR waiting for review)
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      triggerConfetti();

      // Reset form after success
      setTimeout(() => {
        setFormData({ title: "", websiteUrl: "", category: "", paymentNetwork: "base" });
        setSelectedDatasetId("");
        setIsSuccess(false);
        handleReset();
      }, 3000);
    } catch (error) {
      console.error("Error submitting contribution:", error);
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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
        className="flex flex-col items-center my-10 w-full mx-auto px-4"
      >
        <motion.div
          variants={itemVariants}
          className="text-3xl font-bold uppercase tracking-tighter text-foreground mb-2"
        >
          Contribute a Tool
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-base font-medium mb-6 text-center text-secondary max-w-2xl"
        >
          Help grow the ecosystem by submitting tools and services that can benefit the community.
          Your contribution will be reviewed and added to our toolbox.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mb-6 flex gap-4 justify-center"
        >
          <motion.a
            href="/contribute/table"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              className="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 border-2"
              style={{
                borderColor: "#FF6A00",
                color: "#FF6A00",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FF6A0010";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              View Contributions Table
            </button>
          </motion.a>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-3 max-w-2xl w-full card-dark p-8"
        >
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Contribution Created!</h3>
                <p className="text-secondary text-center mb-4">
                  Your contribution has been created and is waiting for AI processing.
                </p>
                <motion.button
                  onClick={() => router.push("/contribute/table")}
                  className="px-6 py-2 rounded-lg font-medium text-white transition-all"
                  style={{
                    backgroundColor: "#FF6A00",
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Contributions Table
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Title Input */}
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold mb-2">
                    Tool Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className={`input-dark w-full ${errors.title ? "border-red-500" : ""}`}
                    placeholder="e.g., Filecoin Storage Dashboard"
                    disabled={isSubmitting}
                  />
                  {errors.title && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.title}
                    </motion.p>
                  )}
                </div>

                {/* Website URL Input */}
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-semibold mb-2">
                    Website URL *
                  </label>
                  <input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => handleChange("websiteUrl", e.target.value)}
                    className={`input-dark w-full ${errors.websiteUrl ? "border-red-500" : ""}`}
                    placeholder="https://example.com"
                    disabled={isSubmitting}
                  />
                  {errors.websiteUrl && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.websiteUrl}
                    </motion.p>
                  )}
                </div>

                {/* Category Select */}
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className={`input-dark w-full ${errors.category ? "border-red-500" : ""}`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.category}
                    </motion.p>
                  )}
                </div>

                {/* Payment Network Select */}
                <div>
                  <label htmlFor="paymentNetwork" className="block text-sm font-semibold mb-2">
                    Preferred Receiving Payment Network *
                  </label>
                  <select
                    id="paymentNetwork"
                    value={formData.paymentNetwork}
                    onChange={(e) => handleChange("paymentNetwork", e.target.value)}
                    className={`input-dark w-full ${errors.paymentNetwork ? "border-red-500" : ""}`}
                    disabled={isSubmitting}
                  >
                    {paymentNetworks.map((network) => (
                      <option key={network.value} value={network.value}>
                        {network.label}
                      </option>
                    ))}
                  </select>
                  {errors.paymentNetwork && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.paymentNetwork}
                    </motion.p>
                  )}
                </div>

                {/* Dataset Selection - Required for storing contribution data */}
                {isConnected && (
                  <div className="border-t pt-6 mt-6" style={{ borderColor: "var(--border)" }}>
                    <h3 className="text-lg font-semibold mb-4">Storage Configuration</h3>
                    
                    {/* Chain Validation */}
                    {!isOnCalibration ? (
                      <div className="p-4 rounded-lg border mb-4" style={{ backgroundColor: "var(--muted)", borderColor: "var(--border)" }}>
                        <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
                          Please switch to Filecoin Calibration network to store your contribution.
                        </p>
                        {switchChain && (
                          <motion.button
                            onClick={handleSwitchChain}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 rounded-lg font-medium text-white text-sm transition-all"
                            style={{
                              backgroundColor: "#FF6A00",
                            }}
                          >
                            Switch to Calibration
                          </motion.button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Dataset Selection */}
                        {isLoadingDatasets ? (
                          <div className="p-4 rounded-lg border text-center mb-4" style={{ backgroundColor: "var(--muted)", borderColor: "var(--border)" }}>
                            Loading datasets...
                          </div>
                        ) : datasetsData && datasetsData.length > 0 ? (
                          <div className="mb-4">
                            <Select
                              label="Select Dataset *"
                              value={selectedDatasetId}
                              onChange={setSelectedDatasetId}
                              disabled={isSubmitting || uploadJsonMutation.isPending}
                              placeholder="Select a dataset to upload to"
                              helperText="Choose which dataset to store your contribution data in"
                              options={datasetsData.map((dataset) => ({
                                value: dataset.dataSetId.toString(),
                                label: `Dataset #${dataset.dataSetId} ${dataset.cdn ? "⚡" : ""}`,
                              }))}
                            />
                            {!selectedDatasetId && (
                              <p className="text-xs text-red-500 mt-1">Dataset selection is required</p>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg border text-center mb-4" style={{ backgroundColor: "var(--muted)", borderColor: "var(--border)" }}>
                            <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
                              No datasets found. Go to Storage page to create a dataset first.
                            </p>
                            <motion.a
                              href="/manage-storage"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <button
                                className="px-4 py-2 rounded-lg font-medium text-white text-sm transition-all"
                                style={{
                                  backgroundColor: "#FF6A00",
                                }}
                              >
                                Go to Storage
                              </button>
                            </motion.a>
                          </div>
                        )}

                        {/* Upload Status */}
                        {(uploadJsonMutation.isPending || status) && (
                          <div className="mt-4">
                            <p className={`text-sm mb-2 ${
                              status.includes("❌")
                                ? "text-red-500"
                                : status.includes("✅") || status.includes("🎉")
                                ? "text-green-500"
                                : "text-secondary"
                            }`}>
                              {status || "Preparing upload..."}
                            </p>
                            {uploadJsonMutation.isPending && (
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting || uploadJsonMutation.isPending || !selectedDatasetId || !isOnCalibration}
                  className="w-full btn-orange disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3"
                  whileHover={!isSubmitting && !uploadJsonMutation.isPending ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting && !uploadJsonMutation.isPending ? { scale: 0.98 } : {}}
                >
                  {isSubmitting || uploadJsonMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {uploadJsonMutation.isPending ? "Uploading to Filecoin..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Submit Tool
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Info Box */}
          <motion.div
            variants={itemVariants}
            className="mt-6 p-4 bg-blue-500/10 border border-blue-500 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-500">
                <p className="font-semibold mb-1">Submission Guidelines</p>
                <ul className="space-y-1 text-xs">
                  <li>• Ensure the tool is actively maintained and functional</li>
                  <li>• Provide the official website URL for the tool</li>
                  <li>• Choose the most appropriate category</li>
                  <li>• All submissions are reviewed before being added</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.main>
    </div>
  );
}
