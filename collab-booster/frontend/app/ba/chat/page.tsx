"use client";

import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function BAChat() {
  const { messages, loading, sendMessage } = useChat("/api/ba/chat");

  return (
    <div className="flex flex-col h-screen">
      <div className="px-8 py-5 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">💬 Chat with the Codebase</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ask anything — I'll explain in plain business language, no code
        </p>
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
