"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useContributions } from "@/hooks/useContributions";
import { mockAIAnalysis } from "@/utils/mockAIAnalysis";
import { CheckCircle, XCircle, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import Confetti from "@/components/ui/Confetti";
import { useConfetti } from "@/hooks/useConfetti";

type ProcessStep = "receiving" | "analyzing" | "approving" | "swapping" | "completing" | "completed" | "rejected";

export default function ProcessContributionPage() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addContribution, updateContribution } = useContributions();
  const { showConfetti, triggerConfetti } = useConfetti();

  const [step, setStep] = useState<ProcessStep>("receiving");
  const [contributionData, setContributionData] = useState<Record<string, any>>({});
  const [contributionId, setContributionId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [swapHash, setSwapHash] = useState<string | null>(null);

  // Extract data from URL params
  useEffect(() => {
    const params: Record<string, any> = {};
    searchParams?.forEach((value, key) => {
      params[key] = value;
    });

    if (Object.keys(params).length > 0) {
      setContributionData(params);
      if (address) {
        processContribution(params);
      }
    }
  }, [searchParams, address]);

  const processContribution = async (data: Record<string, any>) => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    try {
      // Step 1: Store contribution data
      setStep("receiving");
      const contribution = addContribution({
        contributor: address,
        data,
        status: "pending",
      });
      setContributionId(contribution.id);

      // Step 2: AI Analysis
      setStep("analyzing");
      updateContribution(contribution.id, { status: "analyzing" });
      
      const analysis = await mockAIAnalysis(data);
      setAiResult(analysis);
      updateContribution(contribution.id, {
        status: analysis.approved ? "approved" : "rejected",
        aiAnalysis: analysis,
      });

      if (!analysis.approved) {
        setStep("rejected");
        return;
      }

      // Step 3: Execute OnlySwap bridge (as payment) via backend
      setStep("swapping");
      
      // Call backend API to execute swap
      const swapResponse = await fetch("/api/execute-swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!swapResponse.ok) {
        const errorData = await swapResponse.json();
        throw new Error(errorData.error || "Failed to execute swap");
      }

      const swapResult = await swapResponse.json();
      setSwapHash(swapResult.hash);
      updateContribution(contribution.id, {
        swapTxHash: swapResult.hash,
      });

      // Step 4: "Merge PR" (mock)
      setStep("completing");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Store to IPFS (mock - in production, upload JSON to IPFS)
      const mockIpfsCid = `Qm${Math.random().toString(36).substr(2, 43)}`;
      updateContribution(contribution.id, {
        status: "completed",
        ipfsCid: mockIpfsCid,
        prMerged: true,
      });

      setStep("completed");
      triggerConfetti();
    } catch (error: any) {
      console.error("Error processing contribution:", error);
      if (contributionId) {
        updateContribution(contributionId, {
          status: "rejected",
        });
      }
      setStep("rejected");
    }
  };

  // Show wallet connection message if no address but has data
  if (!address && Object.keys(contributionData).length > 0) {
    return (
      <div className="w-full flex flex-col justify-center min-h-screen">
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center my-10 w-full mx-auto px-4 max-w-2xl"
        >
          <div className="card-dark p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-2xl font-bold mb-2">Wallet Not Connected</h3>
            <p className="text-secondary mb-4">
              Please connect your wallet to process this contribution.
            </p>
            <button
              onClick={() => router.push("/contribute")}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Go Back
            </button>
          </div>
        </motion.main>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case "receiving":
        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="text-xl font-bold mb-2">Receiving Contribution Data</h3>
            <p className="text-secondary">Storing your contribution...</p>
            <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(contributionData, null, 2)}
              </pre>
            </div>
          </div>
        );

      case "analyzing":
        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-500" />
            <h3 className="text-xl font-bold mb-2">AI Agent Analyzing</h3>
            <p className="text-secondary">Validating contribution quality...</p>
          </div>
        );

      case "swapping":
        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-500" />
            <h3 className="text-xl font-bold mb-2">Processing Payment</h3>
            <p className="text-secondary">Executing OnlySwap bridge via backend...</p>
            {swapHash && (
              <div className="mt-4">
                <p className="text-sm text-green-500 mb-2">✅ Transaction submitted!</p>
                <a
                  href={`https://sepolia.basescan.org/tx/${swapHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                >
                  View Transaction on BaseScan <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-xs text-secondary mt-2">TX: {swapHash}</p>
              </div>
            )}
          </div>
        );

      case "completing":
        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">Merging Contribution</h3>
            <p className="text-secondary">Storing to IPFS and merging PR...</p>
          </div>
        );

      case "completed":
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-2xl font-bold mb-2">Contribution Completed!</h3>
            <p className="text-secondary mb-4">
              Your contribution has been processed and merged successfully.
            </p>
            {contributionId && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left space-y-2">
                <p className="text-sm">
                  <strong>Contribution ID:</strong> {contributionId}
                </p>
                {swapHash && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500 rounded">
                    <p className="text-sm font-semibold text-green-500 mb-2">
                      ✅ Payment Transaction Successful
                    </p>
                    <p className="text-xs text-secondary mb-2">
                      <strong>Transaction Hash:</strong>
                    </p>
                    <a
                      href={`https://sepolia.basescan.org/tx/${swapHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm font-mono break-all inline-flex items-center gap-1"
                    >
                      {swapHash}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-xs text-secondary mt-2">
                      View on BaseScan to verify transaction
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 flex gap-3 justify-center">
              <motion.button
                onClick={() => router.push("/contribute/table")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 rounded-lg font-medium text-white transition-all"
                style={{
                  backgroundColor: "#FF6A00",
                }}
              >
                View Contributions Table
              </motion.button>
              <motion.button
                onClick={() => router.push("/contribute")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 rounded-lg font-medium transition-all border-2"
                style={{
                  borderColor: "#FF6A00",
                  color: "#FF6A00",
                  backgroundColor: "transparent",
                }}
              >
                Close
              </motion.button>
            </div>
          </div>
        );

      case "rejected":
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-2xl font-bold mb-2">Contribution Rejected</h3>
            {aiResult && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-500 mb-2">
                  <strong>AI Analysis Score:</strong> {aiResult.score}/100
                </p>
                <p className="text-red-500">{aiResult.reason}</p>
              </div>
            )}
            <button
              onClick={() => router.push("/contribute")}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Go Back
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col justify-center min-h-screen">
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center my-10 w-full mx-auto px-4 max-w-2xl"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-3xl font-bold uppercase tracking-tighter text-foreground mb-8"
        >
          Processing Contribution
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full card-dark p-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Progress Steps */}
          <div className="mt-8 flex items-center justify-between">
            {[
              { key: "receiving", label: "Receive" },
              { key: "analyzing", label: "Analyze" },
              { key: "swapping", label: "Pay" },
              { key: "completing", label: "Merge" },
            ].map((s, idx) => {
              const stepIndex = ["receiving", "analyzing", "swapping", "completing"].indexOf(step);
              const isActive = idx <= stepIndex;
              const isCurrent = idx === stepIndex;

              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : "bg-gray-700 text-gray-400"
                      } ${isCurrent ? "ring-2 ring-orange-300" : ""}`}
                    >
                      {isActive && !isCurrent ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className="text-xs mt-1 text-secondary">{s.label}</span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        isActive ? "bg-orange-500" : "bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}

