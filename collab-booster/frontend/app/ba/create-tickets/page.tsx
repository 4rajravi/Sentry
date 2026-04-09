"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface TicketProposal {
  title: string;
  description: string;
  acceptance_criteria: string[];
  story_points: number;
  ticket_type: string;
  priority: string;
  suggested_assignee: string | null;
  affected_files: string[];
}

export default function CreateTickets() {
  const { user } = useAuth("business_analyst");
  const [requirementDoc, setRequirementDoc] = useState("");
  const [proposals, setProposals] = useState<TicketProposal[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; title: string }[]>([]);

  const handleGenerate = async () => {
    if (!requirementDoc.trim()) return;
    setGenerating(true);
    setProposals([]);
    setCreated([]);
    try {
      const res = await api.post<{ tickets: TicketProposal[] }>(
        "/api/ba/doc-to-tickets",
        { requirement_doc: requirementDoc }
      );
      setProposals(res.tickets || []);
      setSelected(new Set(res.tickets.map((_, i) => i)));
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    const toCreate = proposals.filter((_, i) => selected.has(i));
    setCreating(true);
    try {
      const res = await api.post<{ created: { id: string; title: string }[] }>(
        "/api/ba/tickets/bulk-create",
        { tickets: toCreate, reporter_id: user?.user_id }
      );
      setCreated(res.created);
      setProposals([]);
    } finally {
      setCreating(false);
    }
  };

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        ➕ Requirements → Jira Tickets
      </h1>
      <p className="text-gray-500 mb-6">
        Paste your requirements document and AI will create structured Jira tickets.
      </p>

      {created.length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="font-semibold text-green-800 mb-2">
            ✅ {created.length} tickets created!
          </p>
          {created.map((t) => (
            <p key={t.id} className="text-sm text-green-700">
              {t.id}: {t.title}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">Requirements Document</h2>
          </CardHeader>
          <CardContent>
            <textarea
              value={requirementDoc}
              onChange={(e) => setRequirementDoc(e.target.value)}
              placeholder="Paste your requirements document here...&#10;&#10;Example:&#10;We need to add a loan term calculation feature. Users should be able to enter their desired monthly payment and see how many months they need to repay..."
              rows={14}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={handleGenerate}
              disabled={generating || !requirementDoc.trim()}
              className="w-full mt-3"
            >
              {generating ? "Generating tickets..." : "🤖 Generate Ticket Proposals"}
            </Button>
          </CardContent>
        </Card>

        <div>
          {generating && (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner label="AI is analyzing your requirements..." />
            </div>
          )}

          {proposals.length > 0 && !generating && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800">
                  Proposed Tickets ({proposals.length})
                </h2>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={creating || selected.size === 0}
                >
                  {creating
                    ? "Creating..."
                    : `✅ Create ${selected.size} ticket${selected.size !== 1 ? "s" : ""}`}
                </Button>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                {proposals.map((proposal, i) => (
                  <Card
                    key={i}
                    className={
                      selected.has(i) ? "border-blue-400" : "opacity-60"
                    }
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selected.has(i)}
                          onChange={() => toggleSelect(i)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="default">
                              {proposal.story_points} pts
                            </Badge>
                            <Badge variant="secondary">
                              {proposal.priority}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm text-gray-900">
                            {proposal.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {proposal.description}
                          </p>
                          {proposal.acceptance_criteria.length > 0 && (
                            <ul className="text-xs text-gray-400 mt-2 space-y-0.5">
                              {proposal.acceptance_criteria
                                .slice(0, 2)
                                .map((ac, j) => (
                                  <li key={j}>✓ {ac}</li>
                                ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!proposals.length && !generating && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-3">🎫</p>
                <p>Ticket proposals will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
