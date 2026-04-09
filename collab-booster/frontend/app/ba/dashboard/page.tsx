"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { TicketCard } from "@/components/tickets/TicketCard";
import type { Ticket } from "@/types/ticket";

interface Dashboard {
  total_tickets: number;
  status_counts: Record<string, number>;
  total_story_points: number;
  done_story_points: number;
  completion_percentage: number;
}

export default function BADashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<Dashboard>("/api/ba/dashboard"), api.get<Ticket[]>("/api/ba/tickets")])
      .then(([d, t]) => {
        setDashboard(d);
        setTickets(t);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="page-wrap">
        <LoadingSpinner label="Loading dashboard..." />
      </div>
    );

  const columns: { key: string; label: string }[] = [
    { key: "todo", label: "To Do" },
    { key: "in_progress", label: "In Progress" },
    { key: "in_review", label: "In Review" },
    { key: "done", label: "Done" },
  ];

  return (
    <div className="page-wrap max-w-none">
      <p className="section-label mb-2">Business Analyst</p>
      <h1 className="mb-8 text-3xl font-semibold text-zinc-900">Sprint Dashboard</h1>

      {dashboard && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-red-700">{dashboard.completion_percentage}%</p>
              <p className="mt-1 text-sm text-zinc-500">Completion</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-zinc-900">{dashboard.total_tickets}</p>
              <p className="mt-1 text-sm text-zinc-500">Total Tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-red-700">{dashboard.done_story_points}</p>
              <p className="mt-1 text-sm text-zinc-500">Points Done</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-red-700">
                {dashboard.total_story_points - dashboard.done_story_points}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Points Remaining</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="rounded-xl border border-zinc-200 bg-white p-3">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="font-semibold text-zinc-800">{col.label}</h3>
                <Badge variant="secondary">{colTickets.length}</Badge>
              </div>
              <div className="min-h-40 space-y-3">
                {colTickets.map((t) => (
                  <TicketCard key={t.id} ticket={t} basePath="/ba/tickets" />
                ))}
                {colTickets.length === 0 && <p className="pt-8 text-center text-xs text-zinc-500">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
