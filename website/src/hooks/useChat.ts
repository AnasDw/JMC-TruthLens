"use client";

import { useState, useCallback } from "react";
import type { Message } from "@/types";

interface UseChatReturn {
  messages: Message[];
  inputValue: string;
  isLoading: boolean;
  setInputValue: (value: string) => void;
  sendMessage: () => void;
  resetChat: () => void;
}

const INITIAL_MESSAGE: Message = {
  id: 1,
  content: "Hello! I'm TruthLens AI. How can I help you today?",
  isUser: false,
  timestamp: new Date(),
};

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      setIsLoading(true);

      const userMessage: Message = {
        id: Date.now(), // Using timestamp for unique ID
        content: inputValue,
        isUser: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");

      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: Date.now() + 1,
          content:
            "Thank you for your message! I'm processing your request and will provide you with accurate, truthful information.",
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1000);
    }
  }, [inputValue, isLoading]);

  const resetChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setInputValue("");
    setIsLoading(false);
  }, []);

  return {
    messages,
    inputValue,
    isLoading,
    setInputValue,
    sendMessage,
    resetChat,
  };
};

