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
      const res = await api.post<ExplainResponse>(
        `/api/ba/tickets/${id}/explain-commits`,
        {}
      );
      setExplanations(res.commit_explanations);
    } finally {
      setExplaining(false);
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
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-sm text-gray-400">{ticket.id}</span>
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
        <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
        <p className="text-gray-500 mt-1">{ticket.sprint}</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">Description</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
          </CardContent>
        </Card>

        {ticket.acceptance_criteria && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800">Acceptance Criteria</h2>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {ticket.acceptance_criteria}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">
                Commits ({ticket.commits.length})
              </h2>
              {ticket.commits.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={explainCommits}
                  disabled={explaining}
                >
                  {explaining ? "Explaining..." : "🤖 Explain in Business Language"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {ticket.commits.length === 0 ? (
              <p className="text-gray-400 text-sm">No commits linked yet.</p>
            ) : (
              <div className="space-y-4">
                {ticket.commits.map((commit, i) => {
                  const explanation = explanations[i];
                  return (
                    <div
                      key={commit.id}
                      className="border border-gray-100 rounded-lg p-4"
                    >
                      <p className="font-mono text-xs text-gray-400 mb-1">
                        {commit.commit_sha.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        {commit.commit_message}
                      </p>
                      {commit.files_changed && (
                        <p className="text-xs text-gray-400">
                          Files: {commit.files_changed.join(", ")}
                        </p>
                      )}
                      {explanation && (
                        <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <p className="text-xs font-semibold text-blue-700 mb-1">
                            🤖 Business Explanation
                          </p>
                          <p className="text-sm text-blue-900">
                            {explanation.business_summary}
                          </p>
                          {explanation.impact && (
                            <p className="text-xs text-blue-700 mt-1">
                              Impact: {explanation.impact}
                            </p>
                          )}
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
