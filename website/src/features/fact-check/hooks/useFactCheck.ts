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
  setContent: (content: string) => void;
  submitFactCheck: (inputValue: string) => Promise<void>;
  resetForm: () => void;
  contextHolder: React.ReactElement;
  setFactCheckTaskId: Dispatch<SetStateAction<string | null>>;
}

export const useFactCheck = (): UseFactCheckReturn => {
  const router = useRouter();
  const [content, setContent] = useState<string>("");
  const [factCheckTaskId, setFactCheckTaskId] = useState<string | null>(null);
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
    setFactCheckTaskId(null);
    mutation.reset();
    router.push({
      pathname: "/",
    });
  }, [mutation, router]);

  return {
    content,
    factCheckTaskId,
    loading: mutation.isPending,
    setContent,
    submitFactCheck,
    resetForm,
    contextHolder,
    setFactCheckTaskId,
  };
};

