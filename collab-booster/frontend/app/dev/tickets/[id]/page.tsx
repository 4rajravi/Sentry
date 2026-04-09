"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useChat } from "@/hooks/useChat";
import type { Ticket, ImplementationGuidance } from "@/types/ticket";

interface ContextResponse {
  ticket_id: string;
  guidance: ImplementationGuidance;
}

export default function DevTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [guidance, setGuidance] = useState<ImplementationGuidance | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { messages, loading: chatLoading, sendMessage } = useChat("/api/dev/chat");

  useEffect(() => {
    api
      .get<Ticket>(`/jira/tickets/${id}`)
      .then(setTicket)
      .finally(() => setLoading(false));
  }, [id]);

  const loadGuidance = async () => {
    setLoadingGuidance(true);
    try {
      const res = await api.get<ContextResponse>(`/api/dev/tickets/${id}/context`);
      setGuidance(res.guidance);
    } finally {
      setLoadingGuidance(false);
    }
  };

  if (loading)
    return (
      <div className="p-8">
        <LoadingSpinner label="Loading ticket..." />
      </div>
    );
  if (!ticket)
    return <div className="p-8 text-red-600">Ticket not found.</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-sm text-gray-400">{ticket.id}</span>
          <Badge
            variant={
              ticket.status === "done"
                ? "success"
                : ticket.status === "in_progress"
                ? "warning"
                : "secondary"
            }
          >
            {ticket.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800">Requirements</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
              {ticket.acceptance_criteria && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Acceptance Criteria
                  </p>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {ticket.acceptance_criteria}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">
                  🤖 Implementation Guidance
                </h2>
                {!guidance && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={loadGuidance}
                    disabled={loadingGuidance}
                  >
                    {loadingGuidance ? "Analyzing..." : "Get AI Guidance"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingGuidance && (
                <LoadingSpinner label="AI is analyzing the codebase..." />
              )}
              {guidance && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      What to Implement
                    </p>
                    <ol className="space-y-1">
                      {guidance.what_to_implement.map((item, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-blue-500 font-mono">{i + 1}.</span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {guidance.formula_or_algorithm && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Formula / Algorithm
                      </p>
                      <code className="block bg-gray-50 rounded-lg p-3 text-sm font-mono text-gray-800">
                        {guidance.formula_or_algorithm}
                      </code>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Technical Hints
                    </p>
                    <ul className="space-y-1">
                      {guidance.technical_hints.map((hint, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <span className="text-yellow-500">→</span> {hint}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Checklist
                    </p>
                    <ul className="space-y-1">
                      {guidance.checklist.map((item, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-400">☐</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {!guidance && !loadingGuidance && (
                <p className="text-gray-400 text-sm">
                  Click &quot;Get AI Guidance&quot; to analyze the codebase and get implementation hints.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sprint</span>
                  <span className="font-medium">{ticket.sprint || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Points</span>
                  <span className="font-medium">{ticket.story_points || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Priority</span>
                  <span className="font-medium capitalize">{ticket.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Commits</span>
                  <span className="font-medium">{ticket.commits.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {ticket.affected_files && ticket.affected_files.length > 0 && (
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Affected Files
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {ticket.affected_files.map((f, i) => (
                    <li key={i} className="text-xs font-mono text-gray-600">
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? "Hide Chat" : "💬 Ask about this ticket"}
          </Button>
        </div>
      </div>

      {showChat && (
        <div className="mt-6 border border-gray-200 rounded-xl h-96 overflow-hidden">
          <ChatWindow
            messages={messages}
            loading={chatLoading}
            onSend={(q) => sendMessage(q, { ticket_id: id })}
            placeholder="Ask about the requirements, implementation, or codebase..."
            role="dev"
          />
        </div>
      )}
    </div>
  );
}
