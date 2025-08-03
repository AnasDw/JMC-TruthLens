"use client";

import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { useMutation } from "@tanstack/react-query";
import type { FactCheckTask } from "../types";
import { useNotification } from "../../../hooks/useNotification";
import { useRouter } from "next/router";

interface UseFactCheckReturn {
  content: string;
  factCheckTaskId: string | null;
  loading: boolean;
  hasInputError: boolean;
  setContent: (content: string) => void;
  submitFactCheck: (inputValue: string) => Promise<void>;
  resetForm: () => void;
  clearState: () => void;
  contextHolder: React.ReactElement;
  setFactCheckTaskId: Dispatch<SetStateAction<string | null>>;
}

export const useFactCheck = (): UseFactCheckReturn => {
  const router = useRouter();
  const [content, setContent] = useState<string>("");
  const [factCheckTaskId, setFactCheckTaskId] = useState<string | null>(null);
  const [hasInputError, setHasInputError] = useState<boolean>(false);
  const { contextHolder, error: showError, warning } = useNotification();

  const mutation = useMutation<FactCheckTask, Error, { content: string }>({
    mutationFn: async (data: { content: string }) => {
      const response = await fetch("http://localhost:8000/api/verify/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return response.json();
    },
    onSuccess: (data) => {
      setHasInputError(false);

      if (data.status === "skipped") {
        setHasInputError(true);
        showError({
          message: "Not a Factual Claim",
          description:
            "The content you entered is not a factual claim that can be verified. Please enter a specific statement or claim.",
        });
        return;
      }

      router.push({
        pathname: "/",
        query: { task_id: data.task_id },
      });
      setFactCheckTaskId(data.task_id);
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

      // Clear input error when submitting
      setHasInputError(false);

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

  const clearState = useCallback(() => {
    setContent("");
    setFactCheckTaskId(null);
    setHasInputError(false);
    mutation.reset();
  }, []);

  const resetForm = useCallback(() => {
    clearState();
    router.push({
      pathname: "/",
    });
  }, []);

  const handleSetContent = useCallback((newContent: string) => {
    setContent(newContent);
    if (hasInputError) {
      setHasInputError(false);
    }
  }, []);

  return {
    content,
    factCheckTaskId,
    loading: mutation.isPending,
    hasInputError,
    setContent: handleSetContent,
    submitFactCheck,
    resetForm,
    clearState,
    contextHolder,
    setFactCheckTaskId,
  };
};

