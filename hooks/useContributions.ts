import { useState, useEffect } from "react";

export interface Contribution {
  id: string;
  contributor: string;
  timestamp: number;
  data: Record<string, any>;
  status: "pending" | "analyzing" | "approved" | "rejected" | "completed";
  aiAnalysis?: {
    approved: boolean;
    reason: string;
    score: number;
  };
  swapTxHash?: string;
  ipfsCid?: string;
  prMerged?: boolean;
}

const STORAGE_KEY = "contributions";

/**
 * Hook for managing contributions storage
 * Stores contributions in localStorage (can be upgraded to IPFS later)
 */
export const useContributions = () => {
  const [contributions, setContributions] = useState<Contribution[]>([]);

  // Load contributions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setContributions(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading contributions:", error);
    }
  }, []);

  // Save contributions to localStorage whenever they change
  const saveContributions = (newContributions: Contribution[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newContributions));
      setContributions(newContributions);
    } catch (error) {
      console.error("Error saving contributions:", error);
    }
  };

  const addContribution = (contribution: Omit<Contribution, "id" | "timestamp">) => {
    const newContribution: Contribution = {
      ...contribution,
      id: `contrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    const updated = [newContribution, ...contributions];
    saveContributions(updated);
    return newContribution;
  };

  const updateContribution = (id: string, updates: Partial<Contribution>) => {
    const updated = contributions.map((contrib) =>
      contrib.id === id ? { ...contrib, ...updates } : contrib
    );
    saveContributions(updated);
  };

  const getContribution = (id: string) => {
    return contributions.find((contrib) => contrib.id === id);
  };

  return {
    contributions,
    addContribution,
    updateContribution,
    getContribution,
  };
};

