"use client";

import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function DevChat() {
  const { messages, loading, sendMessage } = useChat("/api/dev/chat");

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-zinc-200 bg-white px-8 py-5">
        <p className="section-label mb-1">Developer</p>
        <h1 className="text-xl font-semibold text-zinc-900">Chat with the Codebase</h1>
        <p className="mt-0.5 text-sm text-zinc-600">
          Ask technical questions and get file-level implementation guidance.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          messages={messages}
          loading={loading}
          onSend={sendMessage}
          placeholder="How does calculate_monthly_payment work? Where is the loan validation logic?"
          role="dev"
        />
      </div>
    </div>
  );
}
