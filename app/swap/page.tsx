"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import { useSwap, useSwapStatus } from "@/hooks/useSwap";
import { useSwapBalances } from "@/hooks/useSwapBalances";
import { baseSepolia, avalancheFuji } from 'wagmi/chains';
import { ArrowRight, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react";
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

export default function SwapPage() {
  const { isConnected, address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { mutation: swapMutation, status: swapStatus } = useSwap();
  const { data: swapStatusData, isLoading: isLoadingStatus } = useSwapStatus();
  const { data: balances, isLoading: isLoadingBalances } = useSwapBalances();
  const { showConfetti } = useConfetti();

  const handleExecuteSwap = async () => {
    try {
      // Switch to Base Sepolia if not already on it
      if (chainId !== baseSepolia.id) {
        if (!switchChain) {
          throw new Error("Chain switching not available. Please switch network manually in your wallet.");
        }
        await switchChain({ chainId: baseSepolia.id });
        // Wait a bit for the chain to switch
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await swapMutation.mutateAsync();
    } catch (error: any) {
      console.error("Error executing swap:", error);
    }
  };

  const isCorrectChain = chainId === baseSepolia.id;

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
          OnlySwap Integration
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-lg font-semibold mb-6 text-center text-secondary"
        >
          Cross-chain token swap from Base Sepolia to Avalanche Fuji
        </motion.p>

        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="connect"
              variants={itemVariants}
              className="flex flex-col items-center"
            >
              <ConnectButton />
              <p className="mt-3 text-secondary">
                Please connect your wallet to use OnlySwap
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={itemVariants}
              className="mt-3 max-w-4xl w-full"
            >
              {/* Chain Switcher */}
              {!isCorrectChain && (
                <motion.div
                  variants={itemVariants}
                  className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <p className="text-yellow-500 font-semibold">
                      Please switch to Base Sepolia network
                    </p>
                  </div>
                  <button
                    onClick={() => switchChain?.({ chainId: baseSepolia.id })}
                    className="mt-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
                  >
                    Switch to Base Sepolia
                  </button>
                </motion.div>
              )}

              {/* Swap Execution Card */}
              <motion.div
                variants={itemVariants}
                className="card-dark p-6 mb-6"
              >
                <h2 className="text-xl font-bold mb-4">Execute Swap</h2>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1 text-center">
                    <div className="font-semibold text-sm text-secondary mb-2">From</div>
                    <div className="text-lg font-bold">Base Sepolia</div>
                    <div className="text-xs text-secondary mt-1">RUSD Token</div>
                  </div>

                  <ArrowRight className="w-8 h-8 text-primary mx-4" />

                  <div className="flex-1 text-center">
                    <div className="font-semibold text-sm text-secondary mb-2">To</div>
                    <div className="text-lg font-bold">Avalanche Fuji</div>
                    <div className="text-xs text-secondary mt-1">RUSD Token</div>
                  </div>
                </div>

                <button
                  onClick={handleExecuteSwap}
                  disabled={swapMutation.isPending || !isCorrectChain}
                  className="w-full py-3 px-6 btn-orange disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {swapMutation.isPending ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Executing Swap...
                    </>
                  ) : (
                    "Execute Swap"
                  )}
                </button>

                {swapStatus && (
                  <div className="mt-4 p-3 bg-secondary/20 rounded-lg text-sm">
                    {swapStatus}
                  </div>
                )}
              </motion.div>

              {/* Swap Status Card */}
              <motion.div
                variants={itemVariants}
                className="card-dark p-6 mb-6"
              >
                <h2 className="text-xl font-bold mb-4">Swap Status</h2>

                {isLoadingStatus ? (
                  <div className="flex items-center gap-2 text-secondary">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Loading status...
                  </div>
                ) : swapStatusData ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {swapStatusData.isFinished ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="font-semibold">
                        Status: {swapStatusData.isFinished ? "Completed" : "Processing"}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary">Request ID:</span>
                        <span className="font-mono text-xs">
                          {swapStatusData.requestId.slice(0, 10)}...{swapStatusData.requestId.slice(-8)}
                        </span>
                      </div>

                      {swapStatusData.swapDetails && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-secondary">Executed:</span>
                            <span>{swapStatusData.swapDetails.executed ? "Yes" : "No"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary">Requested At:</span>
                            <span>{swapStatusData.swapDetails.requestedAt.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary">Source Chain:</span>
                            <span>Base Sepolia ({swapStatusData.swapDetails.srcChainId})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary">Destination Chain:</span>
                            <span>Avalanche Fuji ({swapStatusData.swapDetails.dstChainId})</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-secondary">
                    No swap has been executed yet. Execute a swap to see its status here.
                  </div>
                )}
              </motion.div>

              {/* Balances Card */}
              <motion.div
                variants={itemVariants}
                className="card-dark p-6"
              >
                <h2 className="text-xl font-bold mb-4">RUSD Token Balances</h2>

                {isLoadingBalances ? (
                  <div className="flex items-center gap-2 text-secondary">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Loading balances...
                  </div>
                ) : balances ? (
                  <div className="space-y-6">
                    {/* Base Sepolia Balances */}
                    <div>
                      <h3 className="font-semibold mb-3 text-primary">Base Sepolia (Source)</h3>
                      <div className="space-y-2 text-sm">
                        {balances.base.userBalance !== undefined && (
                          <div className="flex justify-between p-2 bg-secondary/10 rounded">
                            <span className="text-secondary">Your Balance:</span>
                            <span className="font-mono">{parseFloat(balances.base.userBalance).toFixed(4)} RUSD</span>
                          </div>
                        )}
                        <div className="flex justify-between p-2 bg-secondary/10 rounded">
                          <span className="text-secondary">Contract Balance:</span>
                          <span className="font-mono">{parseFloat(balances.base.contractBalance).toFixed(4)} RUSD</span>
                        </div>
                        <div className="flex justify-between p-2 bg-secondary/10 rounded">
                          <span className="text-secondary">Solver Balance:</span>
                          <span className="font-mono">{parseFloat(balances.base.solverBalance).toFixed(4)} RUSD</span>
                        </div>
                      </div>
                    </div>

                    {/* Avalanche Fuji Balances */}
                    <div>
                      <h3 className="font-semibold mb-3 text-primary">Avalanche Fuji (Destination)</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2 bg-secondary/10 rounded">
                          <span className="text-secondary">Contract Balance:</span>
                          <span className="font-mono">{parseFloat(balances.avalanche.contractBalance).toFixed(4)} RUSD</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-secondary/10 rounded">
                          {balances.avalanche.hasReceivedTokens ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-500">Tokens received on destination chain!</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-yellow-500" />
                              <span className="text-yellow-500">Waiting for tokens on destination chain...</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-secondary">
                    Unable to load balances. Please check your connection.
                  </div>
                )}
              </motion.div>

              {/* Info Card */}
              <motion.div
                variants={itemVariants}
                className="mt-6 p-4 bg-blue-500/10 border border-blue-500 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-500">
                    <p className="font-semibold mb-1">About OnlySwap</p>
                    <p>
                      OnlySwap enables cross-chain token swaps between Base Sepolia and Avalanche Fuji.
                      The swap process is automated by solvers and typically completes within a few minutes.
                      Make sure you have RUSD tokens on Base Sepolia before executing a swap.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
