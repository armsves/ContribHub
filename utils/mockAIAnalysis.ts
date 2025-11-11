/**
 * Mock AI Agent Analysis
 * Analyzes contribution data and determines if it should be approved
 */
export interface AIAnalysisResult {
  approved: boolean;
  reason: string;
  score: number; // 0-100
}

export const mockAIAnalysis = async (
  data: Record<string, any>
): Promise<AIAnalysisResult> => {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock analysis logic - 5 independent checks
  const checks = {
    hasTitle: !!data.title && data.title.trim().length >= 3,
    titleLength: data.title?.trim().length >= 3 && data.title?.trim().length <= 100,
    hasUrl: !!data.websiteUrl && data.websiteUrl.trim().length > 0,
    urlIsValid: isValidUrl(data.websiteUrl || ""),
    hasCategory: !!data.category && data.category.trim().length > 0,
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = passedChecks * 20; // Each check is worth 20 points
  const approved = score >= 80; // Need at least 4/5 checks to pass (80+ points)

  let reason = "";
  if (approved) {
    reason = "✅ Contribution meets quality standards. Approved for processing.";
  } else {
    const missing = Object.entries(checks)
      .filter(([_, passed]) => !passed)
      .map(([key]) => key);
    reason = `❌ Contribution rejected. Missing or invalid: ${missing.join(", ")}`;
  }

  return {
    approved,
    reason,
    score,
  };
};

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol.startsWith("http");
  } catch {
    return false;
  }
};

