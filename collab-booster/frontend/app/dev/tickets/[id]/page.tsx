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
      <div className="page-wrap">
        <LoadingSpinner label="Loading ticket..." />
      </div>
    );
  if (ticket === null) return <div className="page-wrap text-red-700">Ticket not found.</div>;

  return (
    <div className="page-wrap">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-sm text-zinc-500">{ticket.id}</span>
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
        <h1 className="text-3xl font-semibold text-zinc-900">{ticket.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Assigned to: <span className="font-semibold text-zinc-800">{ticket.assignee_name || ticket.assignee_id || "-"}</span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Requirements</h2>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-zinc-700">{ticket.description}</p>
              {ticket.technical_doc_link && (
                <p className="mt-3 text-sm text-zinc-700">
                  Technical document:{" "}
                  <a
                    href={ticket.technical_doc_link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-red-700 underline underline-offset-2"
                  >
                    Open TRS
                  </a>
                </p>
              )}
              {ticket.acceptance_criteria && (
                <div className="mt-4 border-t border-zinc-200 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Acceptance Criteria</p>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700">{ticket.acceptance_criteria}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Implementation Guidance</h2>
                {guidance === null && (
                  <Button size="sm" variant="secondary" onClick={loadGuidance} disabled={loadingGuidance}>
                    {loadingGuidance ? "Analyzing..." : "Get AI Guidance"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingGuidance && <LoadingSpinner label="Analyzing codebase..." />}
              {guidance && (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">What to Implement</p>
                    <ol className="space-y-1">
                      {guidance.what_to_implement.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-zinc-700">
                          <span className="font-mono text-red-700">{i + 1}.</span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {guidance.formula_or_algorithm && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Formula / Algorithm</p>
                      <code className="block rounded-lg border border-zinc-200 bg-white p-3 font-mono text-sm text-zinc-800">
                        {guidance.formula_or_algorithm}
                      </code>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Technical Hints</p>
                    <ul className="space-y-1">
                      {guidance.technical_hints.map((hint, i) => (
                        <li key={i} className="text-sm text-zinc-700">- {hint}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Checklist</p>
                    <ul className="space-y-1">
                      {guidance.checklist.map((item, i) => (
                        <li key={i} className="text-sm text-zinc-700">[ ] {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {guidance === null && loadingGuidance === false && (
                <p className="text-sm text-zinc-500">Run AI guidance to get implementation direction for this ticket.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sprint</span>
                  <span className="font-medium text-zinc-800">{ticket.sprint || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Points</span>
                  <span className="font-medium text-zinc-800">{ticket.story_points || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Priority</span>
                  <span className="font-medium capitalize text-zinc-800">{ticket.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Commits</span>
                  <span className="font-medium text-zinc-800">{ticket.commits.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {ticket.affected_files && ticket.affected_files.length > 0 && (
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Affected Files</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {ticket.affected_files.map((f, i) => (
                    <li key={i} className="font-mono text-xs text-zinc-700">
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button variant="secondary" className="w-full" onClick={() => setShowChat((prev) => !prev)}>
            {showChat ? "Hide Ticket Chat" : "Ask About This Ticket"}
          </Button>
        </div>
      </div>

      {showChat && (
        <div className="mt-6 h-96 overflow-hidden rounded-xl border border-zinc-200">
          <ChatWindow
            messages={messages}
            loading={chatLoading}
            onSend={(q) => sendMessage(q, { ticket_id: id })}
            placeholder="Ask about requirements, implementation, or related files"
            role="dev"
          />
        </div>
      )}
    </div>
  );
}
