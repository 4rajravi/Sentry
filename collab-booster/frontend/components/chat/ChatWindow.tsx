"use client";

import { useState, useRef, useEffect } from "react";
import { Fragment } from "react";
import { clsx } from "clsx";
import type { ChatMessage } from "@/types/chat";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface ChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (message: string) => void;
  placeholder?: string;
  role?: "ba" | "dev";
}

function renderBoldLine(line: string) {
  const parts = line.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={`b-${idx}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`t-${idx}`}>{part}</Fragment>;
  });
}

function renderMessageContent(content: string) {
  const lines = content.split("\n");
  return lines.map((line, idx) => (
    <Fragment key={`l-${idx}`}>
      {renderBoldLine(line)}
      {idx < lines.length - 1 && <br />}
    </Fragment>
  ));
}

export function ChatWindow({
  messages,
  loading,
  onSend,
  placeholder = "Ask a question about the codebase...",
  role = "dev",
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-full flex-col bg-white text-zinc-900">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="mt-20 text-center text-zinc-500">
            <p className="text-sm uppercase tracking-[0.2em]">Empty conversation</p>
            <p className="mt-3 text-lg font-medium text-zinc-800">Ask anything about this codebase</p>
            <p className="mt-1 text-sm text-zinc-500">
              {role === "ba"
                ? "Responses are written in clear business language."
                : "Responses include technical detail and file-oriented guidance."}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={clsx("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={clsx(
                "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "border border-red-500/50 bg-red-500/10 text-red-700"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-800"
              )}
            >
              <div className="whitespace-pre-wrap font-sans">
                {renderMessageContent(msg.content)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <LoadingSpinner label="Thinking..." />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 border-t border-zinc-200 bg-white p-4 backdrop-blur">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && input.trim()) {
              e.preventDefault();
              onSend(input.trim());
              setInput("");
            }
          }}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="rounded-lg border border-red-700 bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
