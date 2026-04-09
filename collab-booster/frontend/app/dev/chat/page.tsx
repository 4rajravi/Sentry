"use client";

import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function DevChat() {
  const { messages, loading, sendMessage } = useChat("/api/dev/chat");

  return (
    <div className="flex flex-col h-screen">
      <div className="px-8 py-5 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">💬 Chat with the Codebase</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Get precise technical answers with file paths, line numbers, and code snippets
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
