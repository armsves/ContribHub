"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Send, AlertCircle, Plus } from "lucide-react";
import Confetti from "@/components/ui/Confetti";
import { useConfetti } from "@/hooks/useConfetti";

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
  const [formData, setFormData] = useState<FormData>({
    title: "",
    websiteUrl: "",
    category: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Log the submission (in real app, this would be an API call)
    console.log("Tool submitted:", formData);

    setIsSubmitting(false);
    setIsSuccess(true);
    triggerConfetti();

    // Reset form after success
    setTimeout(() => {
      setFormData({ title: "", websiteUrl: "", category: "" });
      setIsSuccess(false);
    }, 3000);
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
                <h3 className="text-2xl font-bold mb-2">Submission Successful!</h3>
                <p className="text-secondary text-center">
                  Thank you for your contribution. We'll review your submission and add it to our toolbox soon.
                </p>
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

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-orange disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3"
                  whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
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
