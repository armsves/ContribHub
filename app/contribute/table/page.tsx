"use client";

import { useContributions } from "@/hooks/useContributions";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, ExternalLink, Copy, Send, FileText } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ContributionsTablePage() {
  const { contributions } = useContributions();
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleProcessContribution = (contrib: any) => {
    // Build URL params from contribution data
    const params = new URLSearchParams();
    Object.entries(contrib.data).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        params.append(key, value);
      }
    });
    router.push(`/contribute/process?${params.toString()}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500";
      case "approved":
        return "bg-blue-500/10 text-blue-500 border-blue-500";
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500";
    }
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

        {contributions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-dark p-12 text-center"
          >
            <p className="text-secondary text-lg mb-4">No contributions yet</p>
            <Link href="/contribute">
              <button
                className="px-6 py-3 rounded-lg font-medium text-white transition-all"
                style={{
                  backgroundColor: "#FF6A00",
                }}
              >
                Make Your First Contribution
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {contributions.map((contrib, idx) => (
              <motion.div
                key={contrib.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-lg p-6 border flex flex-col justify-between w-full"
                style={{
                  backgroundColor: "var(--muted)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex sm:flex-row flex-col justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4
                        className="text-lg font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        Contribution #{contrib.id.slice(-8)}
                      </h4>
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-semibold ${getStatusColor(
                          contrib.status
                        )}`}
                      >
                        {getStatusIcon(contrib.status)}
                        {contrib.status}
                      </div>
                    </div>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <strong>Title:</strong> {contrib.data.title || "N/A"}
                    </p>
                    {contrib.data.category && (
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <strong>Category:</strong> {contrib.data.category}
                      </p>
                    )}
                    {contrib.data.websiteUrl && (
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <strong>URL:</strong>{" "}
                        <a
                          href={contrib.data.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {contrib.data.websiteUrl}
                          <ExternalLink className="w-3 h-3 inline ml-1" />
                        </a>
                      </p>
                    )}
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <strong>Contributor:</strong>{" "}
                      <span className="font-mono">{formatAddress(contrib.contributor)}</span>
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <strong>Date:</strong> {formatDate(contrib.timestamp)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {contrib.aiAnalysis && (
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          AI Score: {contrib.aiAnalysis.score}/100
                        </p>
                        <p className="text-xs text-secondary">
                          {contrib.aiAnalysis.approved ? "✓ Approved" : "✗ Rejected"}
                        </p>
                      </div>
                    )}
                    {contrib.status === "pending" && (
                      <motion.button
                        onClick={() => handleProcessContribution(contrib)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-lg font-medium text-white transition-all flex items-center gap-2 text-sm"
                        style={{
                          backgroundColor: "#FF6A00",
                        }}
                      >
                        <Send className="w-4 h-4" />
                        Process Contribution
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* File Information */}
                {contrib.data.fileName && (
                  <div
                    className="mt-4 rounded-lg border p-4"
                    style={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <h6
                      className="text-sm font-medium mb-2"
                      style={{ color: "var(--foreground)" }}
                    >
                      Stored File
                    </h6>
                    <div className="space-y-1 text-sm">
                      <p style={{ color: "var(--muted-foreground)" }}>
                        <strong>File:</strong> {contrib.data.fileName}
                      </p>
                      {contrib.data.fileSize && (
                        <p style={{ color: "var(--muted-foreground)" }}>
                          <strong>Size:</strong>{" "}
                          {(contrib.data.fileSize / 1024 / 1024).toFixed(4)} MB
                        </p>
                      )}
                      {contrib.data.fileCid && (
                        <div className="flex items-center gap-2">
                          <p style={{ color: "var(--muted-foreground)" }}>
                            <strong>CID:</strong>{" "}
                            <span className="font-mono text-xs">
                              {contrib.data.fileCid.slice(0, 20)}...
                            </span>
                          </p>
                          <button
                            onClick={() => copyToClipboard(contrib.data.fileCid!, contrib.id)}
                            className="text-secondary hover:text-foreground transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transaction & IPFS Info */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  {contrib.swapTxHash && (
                    <div>
                      <strong>Swap TX:</strong>{" "}
                      <a
                        href={`https://sepolia.basescan.org/tx/${contrib.swapTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline inline-flex items-center gap-1"
                      >
                        {contrib.swapTxHash.slice(0, 10)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {contrib.ipfsCid && (
                    <div className="flex items-center gap-2">
                      <strong>IPFS CID:</strong>{" "}
                      <span className="font-mono text-xs">
                        {contrib.ipfsCid.slice(0, 12)}...
                      </span>
                      <button
                        onClick={() => copyToClipboard(contrib.ipfsCid!, contrib.id)}
                        className="text-secondary hover:text-foreground transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="card-dark p-4">
            <div className="text-2xl font-bold">{contributions.length}</div>
            <div className="text-sm text-secondary">Total Contributions</div>
          </div>
          <div className="card-dark p-4">
            <div className="text-2xl font-bold text-green-500">
              {contributions.filter((c) => c.status === "completed").length}
            </div>
            <div className="text-sm text-secondary">Completed</div>
          </div>
          <div className="card-dark p-4">
            <div className="text-2xl font-bold text-yellow-500">
              {contributions.filter((c) => c.status === "pending" || c.status === "analyzing").length}
            </div>
            <div className="text-sm text-secondary">Pending</div>
          </div>
          <div className="card-dark p-4">
            <div className="text-2xl font-bold text-red-500">
              {contributions.filter((c) => c.status === "rejected").length}
            </div>
            <div className="text-sm text-secondary">Rejected</div>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}

