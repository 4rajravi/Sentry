"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/types/chat";

export function useChat(endpoint: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (question: string, extra?: Record<string, unknown>) => {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: question,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const res = await api.post<{ answer: string }>(endpoint, {
          question,
          ...extra,
        });
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: res.answer,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error getting response";
        const errMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${msg}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  return { messages, loading, sendMessage };
}
