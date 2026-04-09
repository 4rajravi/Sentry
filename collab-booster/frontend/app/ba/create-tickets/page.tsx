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
      const res = await api.post<{ tickets: TicketProposal[] }>("/api/ba/doc-to-tickets", {
        requirement_doc: requirementDoc,
      });
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
      const res = await api.post<{ created: { id: string; title: string }[] }>("/api/ba/tickets/bulk-create", {
        tickets: toCreate,
        reporter_id: user?.user_id,
      });
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
    <div className="page-wrap">
      <p className="section-label mb-2">Business Analyst</p>
      <h1 className="text-3xl font-semibold text-zinc-900">Requirements to Tickets</h1>
      <p className="mb-6 mt-2 text-zinc-600">Paste a requirements document and generate structured ticket proposals.</p>

      {created.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="mb-2 font-semibold text-red-700">{created.length} tickets created</p>
          {created.map((t) => (
            <p key={t.id} className="text-sm text-red-700">
              {t.id}: {t.title}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Requirements Document</h2>
          </CardHeader>
          <CardContent>
            <textarea
              value={requirementDoc}
              onChange={(e) => setRequirementDoc(e.target.value)}
              placeholder="Paste your requirements here"
              rows={14}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
            />
            <Button onClick={handleGenerate} disabled={generating || !requirementDoc.trim()} className="mt-3 w-full">
              {generating ? "Generating tickets..." : "Generate Ticket Proposals"}
            </Button>
          </CardContent>
        </Card>

        <div>
          {generating && (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner label="Analyzing requirements..." />
            </div>
          )}

          {proposals.length > 0 && !generating && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">
                  Proposed Tickets ({proposals.length})
                </h2>
                <Button size="sm" onClick={handleCreate} disabled={creating || selected.size === 0}>
                  {creating ? "Creating..." : `Create ${selected.size} ticket${selected.size !== 1 ? "s" : ""}`}
                </Button>
              </div>

              <div className="max-h-[calc(100vh-300px)] space-y-3 overflow-y-auto pr-1">
                {proposals.map((proposal, i) => (
                  <Card key={i} className={selected.has(i) ? "border-red-300" : "opacity-70"}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selected.has(i)}
                          onChange={() => toggleSelect(i)}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant="default">{proposal.story_points} pts</Badge>
                            <Badge variant="secondary">{proposal.priority}</Badge>
                          </div>
                          <p className="text-sm font-medium text-zinc-900">{proposal.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{proposal.description}</p>
                          {proposal.acceptance_criteria.length > 0 && (
                            <ul className="mt-2 space-y-0.5 text-xs text-zinc-500">
                              {proposal.acceptance_criteria.slice(0, 2).map((ac, j) => (
                                <li key={j}>- {ac}</li>
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
            <div className="flex h-64 items-center justify-center text-zinc-500">
              <p>Ticket proposals will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
