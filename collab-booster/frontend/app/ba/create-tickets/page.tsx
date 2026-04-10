"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface ExistingTicketRef {
  id: string;
}

interface GeneratedDoc {
  title: string;
  doc_type: string;
  content: string;
  key_business_rules: string[];
  stakeholder_summary: string;
}

interface AssigneeOption {
  id: string;
  name: string;
  username: string;
}

interface GoogleStatus {
  connected: boolean;
  email: string | null;
}

interface GoogleLoginResponse {
  auth_url: string;
}

interface GoogleImportResponse {
  doc_url: string;
}

interface DraftTicket {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "in_review" | "done";
  ticket_type: "story" | "task" | "bug";
  priority: "low" | "medium" | "high" | "critical";
  story_points: number;
  sprint: string;
  assignee_id: string;
  acceptance_criteria: string;
  affected_files: string;
  due_date: string;
  technical_doc_link: string;
  trs_created: boolean;
}

function toDraft(p: TicketProposal, assignees: AssigneeOption[]): DraftTicket {
  const suggested = (p.suggested_assignee || "").toLowerCase().trim();
  const match = assignees.find(
    (a) => a.id === p.suggested_assignee || a.name.toLowerCase() === suggested || a.username.toLowerCase() === suggested
  );
  return {
    id: "",
    title: p.title || "",
    description: p.description || "",
    status: "todo",
    ticket_type: (["story", "task", "bug"].includes((p.ticket_type || "").toLowerCase())
      ? p.ticket_type.toLowerCase()
      : "story") as DraftTicket["ticket_type"],
    priority: (["low", "medium", "high", "critical"].includes((p.priority || "").toLowerCase())
      ? p.priority.toLowerCase()
      : "medium") as DraftTicket["priority"],
    story_points: p.story_points || 3,
    sprint: "Sprint 2",
    assignee_id: match?.id || "",
    acceptance_criteria: (p.acceptance_criteria || []).join("\n"),
    affected_files: (p.affected_files || []).join("\n"),
    due_date: "",
    technical_doc_link: "",
    trs_created: false,
  };
}

function parseJiraNumber(id: string): number {
  const match = /^JIRA-(\d+)$/i.exec((id || "").trim());
  return match ? Number(match[1]) : 0;
}

export default function CreateTickets() {
  const { user } = useAuth("business_analyst");
  const [requirementDoc, setRequirementDoc] = useState("");
  const [tickets, setTickets] = useState<DraftTicket[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; title: string }[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleBusyIndex, setGoogleBusyIndex] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const refreshGoogleStatus = async (): Promise<boolean> => {
    try {
      const status = await api.get<GoogleStatus>("/api/ba/google/status");
      setGoogleConnected(status.connected);
      setGoogleEmail(status.email);
      return status.connected;
    } catch {
      setGoogleConnected(false);
      setGoogleEmail(null);
      return false;
    }
  };

  const connectGoogle = async (): Promise<boolean> => {
    try {
      const res = await api.get<GoogleLoginResponse>("/api/ba/google/login");
      const popup = window.open(res.auth_url, "_blank", "width=520,height=720");
      if (!popup) {
        setStatusMessage("Popup blocked. Please allow popups.");
        return false;
      }
      const startedAt = Date.now();
      const timeoutMs = 90_000;
      while (Date.now() - startedAt < timeoutMs) {
        const connected = await refreshGoogleStatus();
        if (connected) {
          try {
            popup.close();
          } catch {
            // no-op
          }
          return true;
        }
        if (popup.closed) break;
        await new Promise((r) => window.setTimeout(r, 800));
      }
      return false;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect Google.";
      setStatusMessage(msg);
      return false;
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const devs = await api.get<AssigneeOption[]>("/api/ba/assignees");
        setAssignees(devs);
      } catch {
        setAssignees([]);
      }
      await refreshGoogleStatus();
    })();
  }, []);

  const setTicket = (index: number, patch: Partial<DraftTicket>) => {
    setTickets((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const handleGenerate = async () => {
    if (!requirementDoc.trim()) return;
    setGenerating(true);
    setTickets([]);
    setCreated([]);
    setStatusMessage("");
    try {
      const [res, existing] = await Promise.all([
        api.post<{ tickets: TicketProposal[] }>("/api/ba/doc-to-tickets", {
          requirement_doc: requirementDoc,
        }),
        api.get<ExistingTicketRef[]>("/jira/tickets"),
      ]);
      const proposals = res.tickets || [];
      const maxExisting = existing.reduce((max, t) => Math.max(max, parseJiraNumber(t.id)), 0);
      setTickets(
        proposals.map((p, i) => ({
          ...toDraft(p, assignees),
          id: `JIRA-${maxExisting + i + 1}`,
        }))
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleAttachTrs = async (index: number) => {
    const ticket = tickets[index];
    if (!ticket) return;
    setGoogleBusyIndex(index);
    setStatusMessage("");
    try {
      let connected = googleConnected;
      if (!connected) connected = await connectGoogle();
      if (!connected) {
        setStatusMessage("Google is not connected. Please complete login and retry.");
        return;
      }
      const affectedFiles = ticket.affected_files
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const trsDraft = await api.post<GeneratedDoc>("/api/ba/generate-doc", {
        file_paths: affectedFiles,
        doc_type: "business_requirements",
        code_content: [
          `Ticket Title: ${ticket.title}`,
          `Description: ${ticket.description}`,
          `Acceptance Criteria:`,
          ticket.acceptance_criteria || "-",
          "",
          `Original Requirement:`,
          requirementDoc || "-",
        ].join("\n"),
        document_brief:
          "Generate a concise Technical Requirements Specification (TRS) for this ticket. Include scope, business rules, functional requirements, and acceptance criteria mapping.",
      });
      const trsTitle = trsDraft.title || `TRS - ${ticket.title || "Untitled Ticket"}`;
      const trsContent = trsDraft.content || "";

      const res = await api.post<GoogleImportResponse>("/api/ba/google/import-doc", {
        title: trsTitle,
        content: trsContent,
      });
      setTicket(index, { technical_doc_link: res.doc_url, trs_created: true });
      setStatusMessage("TRS document created and attached.");
      window.open(res.doc_url, "_blank", "noopener,noreferrer");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create TRS doc.";
      setStatusMessage(msg);
    } finally {
      setGoogleBusyIndex(null);
    }
  };

  const handlePost = async () => {
    if (tickets.length === 0) return;
    setCreating(true);
    setStatusMessage("");
    try {
      const payload = tickets.map((t) => ({
        id: t.id.trim() || undefined,
        title: t.title,
        description: t.description,
        status: t.status,
        ticket_type: t.ticket_type,
        priority: t.priority,
        story_points: Number(t.story_points),
        sprint: t.sprint || null,
        assignee_id: t.assignee_id || null,
        acceptance_criteria: t.acceptance_criteria,
        affected_files: t.affected_files,
        due_date: t.due_date || null,
        technical_doc_link: t.technical_doc_link || null,
      }));

      const res = await api.post<{ created: { id: string; title: string }[] }>("/api/ba/tickets/bulk-create", {
        tickets: payload,
        reporter_id: user?.user_id,
      });
      setCreated(res.created);
      setTickets([]);
      setStatusMessage("Tickets posted successfully.");
    } finally {
      setCreating(false);
    }
  };

  const canPost =
    tickets.length > 0 &&
    tickets.every((t) => t.title.trim() && t.description.trim() && t.ticket_type && t.priority && t.assignee_id);

  return (
    <div className="page-wrap">
      <p className="section-label mb-2">Business Analyst</p>
      <h1 className="text-3xl font-semibold text-zinc-900">Create Tickets</h1>
      <p className="mb-6 mt-2 text-zinc-600">
        Add requirement text, generate AI ticket drafts with repo context, edit all fields, attach TRS, then post.
      </p>

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

      {statusMessage && (
        <div className="mb-4 rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          {statusMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Requirement Input</h2>
          </CardHeader>
          <CardContent>
            <textarea
              value={requirementDoc}
              onChange={(e) => setRequirementDoc(e.target.value)}
              placeholder="Write requirement details..."
              rows={16}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Google: {googleConnected ? `connected${googleEmail ? ` as ${googleEmail}` : ""}` : "not connected"}
            </p>
            <Button onClick={handleGenerate} disabled={generating || !requirementDoc.trim()} className="mt-3 w-full">
              {generating ? "Generating AI Drafts..." : "Generate AI Ticket Drafts"}
            </Button>
          </CardContent>
        </Card>

        <div>
          {generating && (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner label="Analyzing requirement and repo context..." />
            </div>
          )}

          {tickets.length > 0 && !generating && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">
                  Editable Ticket Drafts ({tickets.length})
                </h2>
                <Button size="sm" onClick={handlePost} disabled={creating || !canPost}>
                  {creating ? "Posting..." : "Post Tickets"}
                </Button>
              </div>

              <div className="max-h-[calc(100vh-230px)] space-y-3 overflow-y-auto pr-1">
                {tickets.map((t, i) => (
                  <Card key={i} className="border-red-200">
                    <CardContent className="space-y-3 py-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-xs text-zinc-600">
                          Ticket ID
                          <input
                            value={t.id}
                            readOnly
                            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="text-xs text-zinc-600">
                          Title
                          <input
                            value={t.title}
                            onChange={(e) => setTicket(i, { title: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                          />
                        </label>
                      </div>

                      <label className="block text-xs text-zinc-600">
                        AI Description
                        <textarea
                          value={t.description}
                          onChange={(e) => setTicket(i, { description: e.target.value })}
                          rows={3}
                          className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                        />
                      </label>

                      <div className="grid gap-3 md:grid-cols-4">
                        <label className="text-xs text-zinc-600">
                          Status
                          <select
                            value={t.status}
                            onChange={(e) => setTicket(i, { status: e.target.value as DraftTicket["status"] })}
                            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                          >
                            <option value="todo">todo</option>
                            <option value="in_progress">in_progress</option>
                            <option value="in_review">in_review</option>
                            <option value="done">done</option>
                          </select>
                        </label>
                        <label className="text-xs text-zinc-600">
                          Type
                          <select
                            value={t.ticket_type}
                            onChange={(e) => setTicket(i, { ticket_type: e.target.value as DraftTicket["ticket_type"] })}
                            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                          >
                            <option value="story">story</option>
                            <option value="task">task</option>
                            <option value="bug">bug</option>
                          </select>
                        </label>
                        <label className="text-xs text-zinc-600">
                          Priority
                          <select
                            value={t.priority}
                            onChange={(e) => setTicket(i, { priority: e.target.value as DraftTicket["priority"] })}
                            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                          >
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                            <option value="critical">critical</option>
                          </select>
                        </label>
                        <label className="text-xs text-zinc-600">
                          Story Points
                          <input
                            type="number"
                            min={1}
                            max={13}
                            value={t.story_points}
                            onChange={(e) => setTicket(i, { story_points: Number(e.target.value || 1) })}
                            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                          />
                        </label>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="text-xs text-zinc-600">
                          Sprint
                          <input
                            value={t.sprint}
                            onChange={(e) => setTicket(i, { sprint: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="text-xs text-zinc-600">
                          Assignee
                          <select
                            value={t.assignee_id}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTicket(i, { assignee_id: val });
                            }}
                            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                          >
                            <option value="">Select assignee</option>
                            {assignees.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-zinc-600">
                          Due Date
                          <input
                            type="date"
                            value={t.due_date}
                            onChange={(e) => setTicket(i, { due_date: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                          />
                        </label>
                      </div>

                      <label className="block text-xs text-zinc-600">
                        Acceptance Criteria (one per line)
                        <textarea
                          rows={4}
                          value={t.acceptance_criteria}
                          onChange={(e) => setTicket(i, { acceptance_criteria: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                        />
                      </label>

                      <label className="block text-xs text-zinc-600">
                        Affected Files (one per line)
                        <textarea
                          rows={3}
                          value={t.affected_files}
                          onChange={(e) => setTicket(i, { affected_files: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm font-mono"
                        />
                      </label>

                      <label className="block text-xs text-zinc-600">
                        Technical Document Link (TRS)
                        <input
                          value={t.technical_doc_link}
                          onChange={(e) => setTicket(i, { technical_doc_link: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                        />
                      </label>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAttachTrs(i)}
                          disabled={googleBusyIndex === i || t.trs_created}
                        >
                          {googleBusyIndex === i
                            ? "Creating TRS..."
                            : t.trs_created
                            ? "TRS Attached"
                            : "Create & Attach TRS Doc"}
                        </Button>
                        {t.trs_created && (
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700">TRS created</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!tickets.length && !generating && (
            <div className="flex h-64 items-center justify-center text-zinc-500">
              <p>AI ticket drafts will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
