"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Send, AlertCircle, Plus } from "lucide-react";
import Confetti from "@/components/ui/Confetti";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount } from "wagmi";
import { useContributions } from "@/hooks/useContributions";
import { useDataSetsWrapped } from "@/hooks/useDataSetsWrapped";
import { Select } from "@/components/ui/Select";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

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
}

interface FormErrors {
  title?: string;
  websiteUrl?: string;
  category?: string;
}

export default function ContributePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { addContribution } = useContributions();
  const { data: datasetsData, isLoading: isLoadingDatasets } = useDataSetsWrapped();
  const { uploadFileMutation, uploadedInfo, handleReset, status, progress } = useFileUpload();
  const { mutateAsync: uploadFile } = uploadFileMutation;

  const [formData, setFormData] = useState<FormData>({
    title: "",
    websiteUrl: "",
    category: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!isConnected || !address) {
      alert("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);

    try {
      let fileCid: string | undefined;
      let fileTxHash: string | undefined;

      // Upload file if provided (must happen before creating contribution)
      if (file && selectedDatasetId) {
        try {
          await uploadFile({
            file,
            datasetId: selectedDatasetId,
          });
          // Get uploaded info after upload completes
          fileCid = uploadedInfo?.pieceCid;
          fileTxHash = uploadedInfo?.txHash;
        } catch (uploadError) {
          console.error("File upload failed:", uploadError);
          // Continue with contribution creation even if file upload fails
        }
      }

      // Create contribution (PR entry) - represents a GitHub PR waiting for AI processing
      const contribution = addContribution({
        contributor: address,
        data: {
          ...formData,
          fileCid,
          fileTxHash,
          fileName: file?.name,
          fileSize: file?.size,
          datasetId: selectedDatasetId,
        },
        status: "pending", // Waiting for AI processing (like a PR waiting for review)
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      triggerConfetti();

      // Reset form after success
      setTimeout(() => {
        setFormData({ title: "", websiteUrl: "", category: "" });
        setFile(null);
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

                {/* File Upload Section - Only show if connected */}
                {isConnected && (
                  <>
                    <div className="border-t pt-6 mt-6" style={{ borderColor: "var(--border)" }}>
                      <h3 className="text-lg font-semibold mb-4">Upload Supporting File (Optional)</h3>
                      
                      {/* Dataset Selection */}
                      {isLoadingDatasets ? (
                        <div className="p-4 rounded-lg border text-center mb-4" style={{ backgroundColor: "var(--muted)", borderColor: "var(--border)" }}>
                          Loading datasets...
                        </div>
                      ) : datasetsData && datasetsData.length > 0 ? (
                        <div className="mb-4">
                          <Select
                            label="Select Dataset"
                            value={selectedDatasetId}
                            onChange={setSelectedDatasetId}
                            disabled={isSubmitting || uploadFileMutation.isPending}
                            placeholder="Select a dataset to upload to"
                            helperText="Choose which dataset to store your file in"
                            options={datasetsData.map((dataset) => ({
                              value: dataset.dataSetId.toString(),
                              label: `Dataset #${dataset.dataSetId} ${dataset.cdn ? "⚡" : ""}`,
                            }))}
                          />
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg border text-center mb-4" style={{ backgroundColor: "var(--muted)", borderColor: "var(--border)" }}>
                          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                            No datasets found. Go to Storage page to create a dataset first.
                          </p>
                        </div>
                      )}

                      {/* File Drop Zone */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDragging
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-gray-300 hover:border-gray-400"
                        } ${
                          isSubmitting || uploadFileMutation.isPending || !selectedDatasetId
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                        onDragEnter={handleDragIn}
                        onDragLeave={handleDragOut}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => {
                          if (isSubmitting || uploadFileMutation.isPending || !selectedDatasetId) return;
                          document.getElementById("contributeFileInput")?.click();
                        }}
                      >
                        <input
                          id="contributeFileInput"
                          type="file"
                          onChange={(e) => {
                            e.target.files && setFile(e.target.files[0]);
                            e.target.value = "";
                          }}
                          className="hidden"
                          disabled={isSubmitting || uploadFileMutation.isPending || !selectedDatasetId}
                        />
                        <div className="flex flex-col items-center gap-2">
                          <svg
                            className={`w-10 h-10 ${
                              isDragging ? "text-blue-500" : "text-gray-400"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="text-lg font-medium">
                            {file
                              ? file.name
                              : "Drop your file here, or click to select"}
                          </p>
                          {!file && (
                            <p className="text-sm text-gray-500">
                              Drag and drop your file, or click to browse
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Upload Status */}
                      {uploadFileMutation.isPending && (
                        <div className="mt-4">
                          <p className="text-sm text-secondary mb-2">{status}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting || uploadFileMutation.isPending}
                  className="w-full btn-orange disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3"
                  whileHover={!isSubmitting && !uploadFileMutation.isPending ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting && !uploadFileMutation.isPending ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
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
