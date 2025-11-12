"use client";

import { useDataSetsWrapped } from "@/hooks/useDataSetsWrapped";
import { useAccount, useSwitchChain } from "wagmi";
import { calibration } from '@filoz/synapse-core/chains';
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataSetWithPieces, PieceWithMetadata } from "@filoz/synapse-react";
import { getPieceInfoFromCidBytes, getDatasetSizeMessageFromPieces } from "@/utils/storageCalculations";
import { CopyableURL } from "@/components/ui/CopyableURL";
import { ContributionPieceDetails } from "./ContributionPieceDetails";

export default function ContributionsTablePage() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const router = useRouter();
  const isOnCalibration = chainId === calibration.id;
  const { data: datasetsData, isLoading: isLoadingDatasets } = useDataSetsWrapped();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedPieces, setExpandedPieces] = useState<Set<string>>(new Set());
  const [pieceContents, setPieceContents] = useState<Record<string, { content: any; contentType: string | null; error: string | null }>>({});

  const handleSwitchChain = async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: calibration.id });
      }
    } catch (error) {
      console.error("Error switching chain:", error);
    }
  };

  const handleProcessContribution = (data: Record<string, any>) => {
    // Build URL params from contribution data
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        params.append(key, value);
      }
    });
    router.push(`/contribute/process?${params.toString()}`);
  };

  const fetchPieceContent = async (piece: PieceWithMetadata, pieceKey: string) => {
    if (expandedPieces.has(pieceKey)) {
      setExpandedPieces(prev => {
        const next = new Set(prev);
        next.delete(pieceKey);
        return next;
      });
      return;
    }

    setExpandedPieces(prev => new Set(prev).add(pieceKey));
    
    if (pieceContents[pieceKey]) {
      return; // Already loaded
    }

    try {
      const response = await fetch(piece.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.statusText}`);
      }

      const contentTypeHeader = response.headers.get("content-type");
      
      if (contentTypeHeader?.includes("json") || contentTypeHeader?.includes("text")) {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          setPieceContents(prev => ({
            ...prev,
            [pieceKey]: { content: json, contentType: contentTypeHeader, error: null }
          }));
        } catch {
          setPieceContents(prev => ({
            ...prev,
            [pieceKey]: { content: text, contentType: contentTypeHeader, error: null }
          }));
        }
      } else {
        setPieceContents(prev => ({
          ...prev,
          [pieceKey]: { content: null, contentType: contentTypeHeader, error: "Not a JSON/text file" }
        }));
      }
    } catch (err) {
      setPieceContents(prev => ({
        ...prev,
        [pieceKey]: { content: null, contentType: null, error: err instanceof Error ? err.message : "Failed to load content" }
      }));
    }
  };

  const isContributionJson = (content: any): boolean => {
    return content && 
           typeof content === 'object' && 
           ('title' in content || 'websiteUrl' in content || 'category' in content) &&
           ('contributor' in content || 'timestamp' in content);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full mx-auto px-6 py-8 max-w-7xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-3xl font-bold"
          >
            Contributions Table
          </motion.h1>
          <Link href="/contribute">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-lg font-medium text-white transition-all"
              style={{
                backgroundColor: "#FF6A00",
              }}
            >
              New Contribution
            </motion.button>
          </Link>
        </div>

        {/* Chain Validation */}
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-dark p-12 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-base mb-6" style={{ color: "var(--secondary)" }}>
              Please connect your wallet to view stored contributions.
            </p>
          </motion.div>
        ) : !isOnCalibration ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-dark p-12 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Switch to Calibration Network</h2>
            <p className="text-base mb-6" style={{ color: "var(--secondary)" }}>
              Please switch to the Filecoin Calibration network to view stored files.
            </p>
            <motion.button
              onClick={handleSwitchChain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all"
              style={{
                backgroundColor: "#FF6A00",
              }}
            >
              Switch to Calibration
            </motion.button>
          </motion.div>
        ) : isLoadingDatasets ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-dark p-12 text-center"
          >
            <p className="text-secondary text-lg">Loading datasets...</p>
          </motion.div>
        ) : !datasetsData || datasetsData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-dark p-12 text-center"
          >
            <p className="text-secondary text-lg mb-4">No datasets found</p>
            <Link href="/contribute">
              <button
                className="px-6 py-3 rounded-lg font-medium text-white transition-all"
                style={{
                  backgroundColor: "#FF6A00",
                }}
              >
                Create Your First Contribution
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {datasetsData.map((dataset: DataSetWithPieces, idx: number) => (
              <motion.div
                key={dataset.dataSetId.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-lg p-6 border flex flex-col justify-between w-full"
                style={{
                  backgroundColor: "var(--muted)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex sm:flex-row flex-col justify-between mb-4">
                  <div>
                    <h4
                      className="text-lg font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      Dataset #{dataset.dataSetId}
                    </h4>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Status:{" "}
                      <span
                        className="font-medium"
                        style={{
                          color: dataset.live
                            ? "var(--success)"
                            : "var(--destructive)",
                        }}
                      >
                        {dataset.live ? "Live" : "Inactive"}
                      </span>
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      With CDN:{" "}
                      <span
                        className="font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {dataset.cdn ? "⚡ Yes ⚡" : "No"}
                      </span>
                    </p>
                    <div
                      className="text-sm mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      PDP URL: <CopyableURL url={dataset.pdp.serviceURL} />
                    </div>
                  </div>
                  <div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {getDatasetSizeMessageFromPieces(dataset)}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Commission: {Number(dataset.commissionBps) / 100}%
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Managed: {dataset.managed ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                {/* Stored Files Section */}
                <div className="mt-4">
                  <div
                    className="rounded-lg border p-4"
                    style={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {dataset.pieces && dataset.pieces.length > 0 ? (
                      <div className="w-full">
                        <div className="sm:flex flex-col sm:justify-between items-start mb-2 w-full">
                          <h6
                            className="text-sm font-medium"
                            style={{ color: "var(--foreground)" }}
                          >
                            {`contributions: #${dataset.pieces.length}`}
                          </h6>
                        </div>
                        <div className="space-y-2">
                          {dataset.pieces.reverse().map((piece) => {
                            const pieceKey = `${dataset.dataSetId}-${piece.id}`;
                            const pieceSizeMiB = getPieceInfoFromCidBytes(piece.cid).sizeMiB;
                            const pieceContent = pieceContents[pieceKey];
                            const isExpanded = expandedPieces.has(pieceKey);
                            const isContribution = pieceContent && isContributionJson(pieceContent.content);
                            
                            return (
                              <ContributionPieceDetails
                                key={piece.id.toString()}
                                dataset={dataset}
                                piece={piece}
                                pieceSizeMiB={pieceSizeMiB}
                                pieceKey={pieceKey}
                                isExpanded={isExpanded}
                                pieceContent={pieceContent}
                                isContribution={isContribution}
                                onToggleContent={() => fetchPieceContent(piece, pieceKey)}
                                onProcessContribution={() => {
                                  if (pieceContent && isContribution) {
                                    handleProcessContribution(pieceContent.content);
                                  }
                                }}
                                onCopy={(text) => copyToClipboard(text, pieceKey)}
                                copiedId={copiedId}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        No files stored in this dataset yet.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {isConnected && isOnCalibration && datasetsData && datasetsData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="card-dark p-4">
              <div className="text-2xl font-bold">{datasetsData.length}</div>
              <div className="text-sm text-secondary">Total Datasets</div>
            </div>
            <div className="card-dark p-4">
              <div className="text-2xl font-bold text-green-500">
                {datasetsData.reduce((acc, d) => acc + (d.pieces?.length || 0), 0)}
              </div>
              <div className="text-sm text-secondary">Total Files</div>
            </div>
            <div className="card-dark p-4">
              <div className="text-2xl font-bold text-blue-500">
                {datasetsData.filter((d) => d.live).length}
              </div>
              <div className="text-sm text-secondary">Live Datasets</div>
            </div>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}

