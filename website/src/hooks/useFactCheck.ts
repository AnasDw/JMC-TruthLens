"use client";

import { useState, useCallback } from "react";
import type { FactCheckResult } from "@/types";

interface UseFactCheckReturn {
  title: string;
  content: string;
  result: FactCheckResult | null;
  loading: boolean;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  submitFactCheck: (showNotifications?: boolean) => Promise<void>;
  resetForm: () => void;
}

const mockFactCheckAPI = async (
  title: string,
  content: string
): Promise<FactCheckResult> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock analysis based on keywords
  let veracity: "true" | "partially-true" | "false" | "misleading" =
    "partially-true";
  let confidence = 75;
  let explanation =
    "Based on available sources, this statement requires additional context for full accuracy.";

  // Simple keyword analysis for demo
  const lowerContent = (title + " " + content).toLowerCase();

  if (lowerContent.includes("climate") && lowerContent.includes("change")) {
    veracity = "true";
    confidence = 92;
    explanation =
      "Climate change and its effects are well-documented by scientific consensus. Multiple peer-reviewed studies support claims about increasing global temperatures and related environmental impacts.";
  } else if (
    lowerContent.includes("vaccine") ||
    lowerContent.includes("covid")
  ) {
    veracity = "true";
    confidence = 95;
    explanation =
      "COVID-19 vaccines have been extensively tested and proven safe and effective by multiple health organizations worldwide, including WHO, CDC, and FDA.";
  } else if (
    lowerContent.includes("election") &&
    lowerContent.includes("fraud")
  ) {
    veracity = "false";
    confidence = 88;
    explanation =
      "Claims of widespread election fraud have been investigated and debunked by election officials, courts, and independent auditors across multiple states.";
  } else if (
    lowerContent.includes("5g") &&
    (lowerContent.includes("cancer") || lowerContent.includes("health"))
  ) {
    veracity = "false";
    confidence = 90;
    explanation =
      "Scientific studies and health organizations have found no credible evidence linking 5G technology to health problems or cancer.";
  }

  return {
    id: Date.now().toString(),
    title,
    content,
    veracity,
    confidence,
    sources: [
      {
        title: "Scientific American - Fact Check Analysis",
        url: "https://www.scientificamerican.com",
        credibility: 0.92,
      },
      {
        title: "Reuters Fact Check Team",
        url: "https://www.reuters.com/fact-check",
        credibility: 0.89,
      },
      {
        title: "Associated Press Fact Check",
        url: "https://apnews.com/hub/ap-fact-check",
        credibility: 0.91,
      },
    ],
    explanation,
    timestamp: new Date(),
  };
};

export const useFactCheck = (): UseFactCheckReturn => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  const submitFactCheck = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const factCheckResult = await mockFactCheckAPI(title, content);
      setResult(factCheckResult);
    } catch (error) {
      console.error("Fact check failed:", error);
      // Handle error - could set an error state here
    } finally {
      setLoading(false);
    }
  }, [title, content]);

  const resetForm = useCallback(() => {
    setTitle("");
    setContent("");
    setResult(null);
    setLoading(false);
  }, []);

  return {
    title,
    content,
    result,
    loading,
    setTitle,
    setContent,
    submitFactCheck,
    resetForm,
  };
};

