"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Ticket, CommitExplanation } from "@/types/ticket";

interface ExplainResponse {
  ticket_id: string;
  commit_explanations: CommitExplanation[];
}

export default function BATicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [explanations, setExplanations] = useState<CommitExplanation[]>([]);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    api
      .get<Ticket>(`/jira/tickets/${id}`)
      .then(setTicket)
      .finally(() => setLoading(false));
  }, [id]);

  const explainCommits = async () => {
    setExplaining(true);
    try {
      const res = await api.post<ExplainResponse>(`/api/ba/tickets/${id}/explain-commits`, {});
      setExplanations(res.commit_explanations);
    } finally {
      setExplaining(false);
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
    <div className="page-wrap max-w-4xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-sm text-zinc-500">{ticket.id}</span>
          <Badge
            variant={
              ticket.status === "done"
                ? "success"
                : ticket.status === "in_progress"
                ? "warning"
                : ticket.status === "in_review"
                ? "purple"
                : "secondary"
            }
          >
            {ticket.status.replace("_", " ").toUpperCase()}
          </Badge>
          <Badge variant="secondary">{ticket.story_points} pts</Badge>
        </div>
        <h1 className="text-3xl font-semibold text-zinc-900">{ticket.title}</h1>
        <p className="mt-1 text-zinc-500">{ticket.sprint}</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Description</h2>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-zinc-700">{ticket.description}</p>
          </CardContent>
        </Card>

        {ticket.acceptance_criteria && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Acceptance Criteria</h2>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700">{ticket.acceptance_criteria}</pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Commits ({ticket.commits.length})</h2>
              {ticket.commits.length > 0 && (
                <Button size="sm" variant="secondary" onClick={explainCommits} disabled={explaining}>
                  {explaining ? "Explaining..." : "Explain in Business Language"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {ticket.commits.length === 0 ? (
              <p className="text-sm text-zinc-500">No commits linked yet.</p>
            ) : (
              <div className="space-y-4">
                {ticket.commits.map((commit, i) => {
                  const explanation = explanations[i];
                  return (
                    <div key={commit.id} className="rounded-lg border border-zinc-200 p-4">
                      <p className="mb-1 font-mono text-xs text-zinc-500">{commit.commit_sha.slice(0, 8)}</p>
                      <p className="mb-2 text-sm text-zinc-700">{commit.commit_message}</p>
                      {commit.files_changed && (
                        <p className="text-xs text-zinc-500">Files: {commit.files_changed.join(", ")}</p>
                      )}
                      {explanation && (
                        <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">Business Explanation</p>
                          <p className="text-sm text-red-700">{explanation.business_summary}</p>
                          {explanation.impact && <p className="mt-1 text-xs text-red-700">Impact: {explanation.impact}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
