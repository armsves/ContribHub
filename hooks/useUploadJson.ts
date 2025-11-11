import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount, usePublicClient } from "wagmi";
import { useConfig } from "@/providers/ConfigProvider";
import { usePayment } from "@/hooks/usePayment";
import { calculateStorageMetrics } from "@/utils/calculateStorageMetrics";
import { useUpload } from "@filoz/synapse-react";
import * as Piece from "@filoz/synapse-core/piece";
import * as Payments from "@filoz/synapse-core/pay";
import * as WarmStorage from "@filoz/synapse-core/warm-storage";

export type UploadedJsonInfo = {
  fileName?: string;
  fileSize?: number;
  pieceCid?: string;
  txHash?: string;
};

/**
 * Hook for uploading JSON data to Filecoin with automatic payment handling and progress tracking.
 * Similar to useFileUpload but creates a JSON file from the provided data.
 * 
 * @returns Mutation object with progress (0-100), status message, uploaded info, and reset function
 */
export const useUploadJson = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [uploadedInfo, setUploadedInfo] = useState<UploadedJsonInfo | null>(null);
  const { triggerConfetti } = useConfetti();
  const { address, chainId } = useAccount();
  const { config } = useConfig();
  const { mutation: paymentMutation } = usePayment(true);
  const client = usePublicClient();
  const { mutateAsync: upload } = useUpload({
    onHash: (hash) => {
      setUploadedInfo((prev) => ({
        ...prev,
        txHash: hash,
      }));
      setStatus(`🔗 Data upload transaction submitted`);
      setProgress(70);
    },
  });

  const mutation = useMutation({
    mutationKey: ["upload-json", address],
    mutationFn: async ({
      data,
      datasetId,
      fileName = "contribution.json",
    }: {
      data: Record<string, any>;
      datasetId: string;
      fileName?: string;
    }) => {
      if (!address) throw new Error("Address not found");
      if (!chainId) throw new Error("Chain id not found");
      if (!client) throw new Error("Public client not found");

      setProgress(0);
      setUploadedInfo(null);
      setStatus("🔄 Preparing data for Filecoin storage...");

      // Convert JSON data to a File object
      const jsonString = JSON.stringify(data, null, 2);
      const jsonBlob = new Blob([jsonString], { type: "application/json" });
      const jsonFile = new File([jsonBlob], fileName, { type: "application/json" });

      const { availableFunds: paymentsRaw } = await Payments.accountInfo(client, {
        address,
      });

      const prices = await WarmStorage.servicePrice(client);

      const operatorApprovals = await Payments.operatorApprovals(client, {
        address,
      });

      const pieceCid = Piece.calculate(new Uint8Array(await jsonFile.arrayBuffer()));

      // Validate user has sufficient USDFC for storage
      setStatus(
        "💰 Checking if you have enough USDFC to cover the storage costs..."
      );
      setProgress(5);

      const { isSufficient, depositNeeded } =
        await calculateStorageMetrics({
          prices,
          operatorApprovals,
          availableFunds: paymentsRaw,
          config,
          fileSize: jsonFile.size,
        });

      // Automatically top up storage allowances if insufficient
      if (!isSufficient) {
        setStatus(
          "💰 Insufficient storage balance, setting up your storage configuration..."
        );

        await paymentMutation.mutateAsync({
          amount: depositNeeded,
        });
        setStatus("💰 Storage configuration setup complete");
      }

      setStatus("📁 Uploading data to storage provider...");
      setProgress(55);

      await upload({
        files: [jsonFile],
        dataSetId: BigInt(datasetId),
      });

      // Wait a bit for the transaction to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setProgress(95);
      setUploadedInfo({
        fileName: jsonFile.name,
        fileSize: jsonFile.size,
        pieceCid: pieceCid.toV1().toString(),
      });
      
      // Complete the upload
      setStatus("🎉 Data successfully stored on Filecoin!");
      setProgress(100);
    },
    onSuccess: () => {
      // Ensure progress is 100% on success
      setProgress(100);
      setStatus("🎉 Data successfully stored on Filecoin!");
      triggerConfetti();
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      setStatus(`❌ Upload failed: ${error.message || "Please try again"}`);
      setProgress(0);
    },
  });

  /** Resets upload state for new upload */
  const handleReset = () => {
    setProgress(0);
    setUploadedInfo(null);
    setStatus("");
  };

  return {
    uploadJsonMutation: mutation,
    progress,
    uploadedInfo,
    handleReset,
    status,
  };
};

