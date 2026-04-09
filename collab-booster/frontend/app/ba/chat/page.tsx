"use client";

import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function BAChat() {
  const { messages, loading, sendMessage } = useChat("/api/ba/chat");

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-zinc-200 bg-white px-8 py-5">
        <p className="section-label mb-1">Business Analyst</p>
        <h1 className="text-xl font-semibold text-zinc-900">Chat with the Codebase</h1>
        <p className="mt-0.5 text-sm text-zinc-600">Ask anything and get business-language explanations.</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          messages={messages}
          loading={loading}
          onSend={sendMessage}
          placeholder="What does the loan calculator do? How is the monthly payment calculated?"
          role="ba"
        />
      </div>
    </div>
  );
}
