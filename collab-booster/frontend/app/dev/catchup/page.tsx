"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface CatchupSummary {
  period: string;
  completed_work: string[];
  in_progress_work: string[];
  new_tickets_assigned: string[];
  key_code_changes: string[];
  narrative: string;
}

export default function VacationCatchup() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<CatchupSummary | null>(null);

  const handleCatchup = async () => {
    if (fromDate.length === 0 || toDate.length === 0) return;
    setLoading(true);
    setSummary(null);
    try {
      const res = await api.post<CatchupSummary>("/api/dev/catchup", {
        from_date: fromDate,
        to_date: toDate,
      });
      setSummary(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap max-w-4xl">
      <p className="section-label mb-2">Developer</p>
      <h1 className="text-3xl font-semibold text-zinc-900">Catchup Summary</h1>
      <p className="mb-6 mt-2 text-zinc-600">Select your absence period and generate a concise update.</p>

      <Card className="mb-6">
        <CardContent className="py-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
            </div>
            <Button onClick={handleCatchup} disabled={loading || fromDate.length === 0}>
              {loading ? "Summarizing..." : "Generate Catchup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner label="Reviewing commits and tickets..." />
        </div>
      )}

      {summary && loading === false && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-300 bg-red-50 p-4">
            <p className="mb-2 font-semibold text-red-700">{summary.period}</p>
            <p className="text-sm leading-relaxed text-red-700">{summary.narrative}</p>
          </div>

          {summary.completed_work.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Completed</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {summary.completed_work.map((item, i) => (
                    <li key={i} className="text-sm text-zinc-700">- {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {summary.in_progress_work.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">In Progress</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {summary.in_progress_work.map((item, i) => (
                    <li key={i} className="text-sm text-zinc-700">- {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {summary.new_tickets_assigned.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">New Tickets Assigned</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {summary.new_tickets_assigned.map((item, i) => (
                    <li key={i} className="text-sm text-zinc-700">- {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {summary.key_code_changes.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Key Code Changes</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {summary.key_code_changes.map((item, i) => (
                    <li key={i} className="text-sm font-mono text-zinc-700">- {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
