"use client";

import { useEffect, useMemo, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { api } from "@/lib/api";
import type { Ticket } from "@/types/ticket";

export default function DevChat() {
  const { messages, loading, sendMessage } = useChat("/api/dev/chat");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<Ticket[]>("/api/dev/tickets")
      .then((tickets) => {
        if (!mounted || tickets.length === 0) return;
        const preferred =
          tickets.find((t) => t.status === "in_progress") ??
          tickets.find((t) => t.status === "todo") ??
          tickets[0];
        setActiveTicketId(preferred.id);
      })
      .catch(() => {
        if (mounted) setActiveTicketId(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const onSend = useMemo(
    () => (message: string) =>
      activeTicketId ? sendMessage(message, { ticket_id: activeTicketId }) : sendMessage(message),
    [activeTicketId, sendMessage]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-zinc-200 bg-white px-8 py-5">
        <p className="section-label mb-1">Developer</p>
        <h1 className="text-xl font-semibold text-zinc-900">Chat with the Codebase</h1>
        <p className="mt-0.5 text-sm text-zinc-600">
          Ask technical questions and get file-level implementation guidance.
        </p>
        {activeTicketId && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-red-700">
            Using assigned ticket context: {activeTicketId}
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <ChatWindow
          messages={messages}
          loading={loading}
          onSend={onSend}
          placeholder="How does calculate_monthly_payment work? Where is the loan validation logic?"
          role="dev"
        />
      </div>
    </div>
  );
}
