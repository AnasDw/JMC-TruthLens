"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FactCheckResult } from "../types";
import { useNotification } from "../../../hooks/useNotification";

interface UseFactCheckReturn {
  content: string;
  result: FactCheckResult | null;
  loading: boolean;
  setContent: (content: string) => void;
  submitFactCheck: (inputValue: string) => Promise<void>;
  resetForm: () => void;
  contextHolder: React.ReactElement;
}

export const useFactCheck = (): UseFactCheckReturn => {
  const [content, setContent] = useState<string>("");
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const queryClient = useQueryClient();
  const {
    contextHolder,
    success,
    error: showError,
    warning,
  } = useNotification();

  const mutation = useMutation<FactCheckResult, Error, { content: string }>({
    mutationFn: async (data: { content: string }) => {
      const response = await fetch("/api/fact-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["fact-checks"] });
      success({
        message: "Fact-Check Complete!",
        description: `Analysis completed for "${
          data.title
        }". The claim appears to be ${data.veracity.toUpperCase()}.`,
      });
    },
    onError: () => {
      showError({
        message: "Fact-Check Failed",
        description:
          "We encountered an error while analyzing your statement. Please try again.",
      });
    },
  });

  const submitFactCheck = useCallback(
    async (inputValue: string) => {
      if (!inputValue.trim()) {
        warning({
          message: "Content Required",
          description: "Please enter a statement or claim to fact-check.",
        });
        throw new Error("Content is required for fact-checking");
      }

      try {
        const factCheckData = {
          content: inputValue.trim(),
        };

        await mutation.mutateAsync(factCheckData);
      } catch (error) {
        console.error("Fact-check submission failed:", error);
      }
    },
    [mutation, warning]
  );

  const resetForm = useCallback(() => {
    setContent("");
    setResult(null);
    mutation.reset();
  }, [mutation]);

  return {
    content,
    result,
    loading: mutation.isPending,
    setContent,
    submitFactCheck,
    resetForm,
    contextHolder,
  };
};

