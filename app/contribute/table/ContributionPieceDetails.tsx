"use client";

import { DataSetWithPieces, PieceWithMetadata } from "@filoz/synapse-react";
import { useDownloadPiece } from "@/hooks/useDownloadPiece";
import { useDeletePiece } from "@filoz/synapse-react";
import { DownloadIcon, EyeIcon, Loader2Icon, TrashIcon, FileTextIcon, XIcon, Send, Copy } from "lucide-react";
import * as Piece from "@filoz/synapse-core/piece";

interface ContributionPieceDetailsProps {
  dataset: DataSetWithPieces;
  piece: PieceWithMetadata;
  pieceSizeMiB: number;
  pieceKey: string;
  isExpanded: boolean;
  pieceContent: { content: any; contentType: string | null; error: string | null } | undefined;
  isContribution: boolean;
  onToggleContent: () => void;
  onProcessContribution: () => void;
  onCopy: (text: string) => void;
  copiedId: string | null;
}

export function ContributionPieceDetails({
  dataset,
  piece,
  pieceSizeMiB,
  pieceKey,
  isExpanded,
  pieceContent,
  isContribution,
  onToggleContent,
  onProcessContribution,
  onCopy,
  copiedId,
}: ContributionPieceDetailsProps) {
  const filename = `piece-${piece.cid.toString()}`;
  const { downloadMutation } = useDownloadPiece(piece.url, filename);
  const { mutate: deletePiece, isPending: isDeletingPiece } = useDeletePiece({
    onHash: (hash) => {
      console.log("Piece deleted", hash);
    },
  });

  const isLoadingContent = !pieceContent && isExpanded;

  return (
    <div
      className="sm:flex flex-col justify-between p-2 rounded border"
      style={{
        backgroundColor: "var(--muted)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          Contribution #{piece.id}
        </p>
        <p
          className="text-xs truncate"
          style={{ color: "var(--muted-foreground)" }}
        >
          {Piece.isPieceCID(piece.cid) ? piece.cid.toString() : ""}
        </p>
        <p
          className="text-xs truncate"
          style={{ color: "var(--muted-foreground)" }}
        >
          {`File size: ${Number(pieceSizeMiB.toFixed(4))} MB`}
        </p>
      </div>
      <div className="flex flex-row justify-end gap-2 p-2">
        <button
          onClick={onToggleContent}
          disabled={isLoadingContent}
          className="sm:ml-4 sm:p-2 p-1 text-sm rounded-lg border-2 cursor-pointer transition-all disabled:cursor-not-allowed"
          style={{
            borderColor: isLoadingContent
              ? "var(--muted)"
              : isExpanded
              ? "var(--destructive)"
              : "var(--primary)",
            backgroundColor: isLoadingContent
              ? "var(--muted)"
              : isExpanded
              ? "var(--destructive)"
              : "var(--primary)",
            color: isLoadingContent
              ? "var(--muted-foreground)"
              : isExpanded
              ? "var(--destructive-foreground)"
              : "var(--primary-foreground)",
          }}
          title={isExpanded ? "Hide content" : "Show content in frontend"}
        >
          {isLoadingContent ? (
            <Loader2Icon className="sm:size-4 size-2 animate-spin" />
          ) : isExpanded ? (
            <XIcon className="sm:size-4 size-2" />
          ) : (
            <FileTextIcon className="sm:size-4 size-2" />
          )}
        </button>
        <button
          onClick={() => downloadMutation.mutate()}
          disabled={downloadMutation.isPending}
          className="sm:ml-4 sm:p-2 p-1 text-sm rounded-lg border-2 cursor-pointer transition-all disabled:cursor-not-allowed"
          style={{
            borderColor: downloadMutation.isPending
              ? "var(--muted)"
              : "var(--primary)",
            backgroundColor: downloadMutation.isPending
              ? "var(--muted)"
              : "var(--primary)",
            color: downloadMutation.isPending
              ? "var(--muted-foreground)"
              : "var(--primary-foreground)",
          }}
          title="Download file"
        >
          {downloadMutation.isPending ? (
            <Loader2Icon className="sm:size-4 size-2 animate-spin" />
          ) : (
            <DownloadIcon className="sm:size-4 size-2" />
          )}
        </button>
        <button
          onClick={() => window.open(piece.url, "_blank")}
          className="sm:ml-4 sm:p-2 p-1 text-sm rounded-lg border-2 cursor-pointer transition-all disabled:cursor-not-allowed"
          style={{
            borderColor: "var(--primary)",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
          title="View in external tab"
        >
          <EyeIcon className="sm:size-4 size-2" />
        </button>
        <button
          onClick={() => deletePiece({ dataSet: dataset, pieceId: piece.id })}
          className="sm:ml-4 sm:p-2 p-1 text-sm rounded-lg border-2 border-red-600 text-red-600 hover:text-white hover:bg-red-600 cursor-pointer transition-all disabled:cursor-not-allowed"
          disabled={isDeletingPiece}
          title="Delete piece"
        >
          {isDeletingPiece ? (
            <Loader2Icon className="sm:size-4 size-2 animate-spin" />
          ) : (
            <TrashIcon className="sm:size-4 size-2" />
          )}
        </button>
      </div>

      {/* Content Display Section */}
      {isExpanded && pieceContent && (
        <div
          className="mt-2 p-4 rounded border max-h-[500px] overflow-auto"
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--border)",
          }}
        >
          {pieceContent.error ? (
            <p
              className="text-sm"
              style={{ color: "var(--destructive)" }}
            >
              {pieceContent.error}
            </p>
          ) : pieceContent.content ? (
            <>
              {isContribution && (
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-green-500">Contribution Data</span>
                  </div>
                  <button
                    onClick={onProcessContribution}
                    className="px-3 py-1 rounded-lg font-medium text-white text-xs transition-all flex items-center gap-1"
                    style={{
                      backgroundColor: "#FF6A00",
                    }}
                  >
                    <Send className="w-3 h-3" />
                    Process Contribution
                  </button>
                </div>
              )}
              {typeof pieceContent.content === 'object' ? (
                <pre
                  className="text-xs whitespace-pre-wrap break-words"
                  style={{ color: "var(--foreground)" }}
                >
                  {JSON.stringify(pieceContent.content, null, 2)}
                </pre>
              ) : (
                <pre
                  className="text-xs whitespace-pre-wrap break-words"
                  style={{ color: "var(--foreground)" }}
                >
                  {pieceContent.content}
                </pre>
              )}
              {isContribution && pieceContent.content && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="text-xs space-y-1">
                    {pieceContent.content.title && (
                      <p><strong>Title:</strong> {pieceContent.content.title}</p>
                    )}
                    {pieceContent.content.category && (
                      <p><strong>Category:</strong> {pieceContent.content.category}</p>
                    )}
                    {pieceContent.content.websiteUrl && (
                      <p><strong>URL:</strong> {pieceContent.content.websiteUrl}</p>
                    )}
                    {pieceContent.content.contributor && (
                      <p><strong>Contributor:</strong> {pieceContent.content.contributor}</p>
                    )}
                    {pieceContent.content.timestamp && (
                      <p><strong>Date:</strong> {new Date(pieceContent.content.timestamp).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

