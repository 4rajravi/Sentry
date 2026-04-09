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
    Promise.all([
      api.get<Dashboard>("/api/ba/dashboard"),
      api.get<Ticket[]>("/api/ba/tickets"),
    ])
      .then(([d, t]) => {
        setDashboard(d);
        setTickets(t);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-8">
        <LoadingSpinner label="Loading dashboard..." />
      </div>
    );

  const columns: { key: string; label: string; color: string }[] = [
    { key: "todo", label: "To Do", color: "bg-gray-100" },
    { key: "in_progress", label: "In Progress", color: "bg-blue-50" },
    { key: "in_review", label: "In Review", color: "bg-purple-50" },
    { key: "done", label: "Done", color: "bg-green-50" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sprint Dashboard</h1>

      {dashboard && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {dashboard.completion_percentage}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Completion</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-gray-900">
                {dashboard.total_tickets}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total Tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {dashboard.done_story_points}
              </p>
              <p className="text-sm text-gray-500 mt-1">Points Done</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-orange-600">
                {dashboard.total_story_points - dashboard.done_story_points}
              </p>
              <p className="text-sm text-gray-500 mt-1">Points Remaining</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sprint Board */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.key);
          return (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-gray-700">{col.label}</h3>
                <Badge variant="secondary">{colTickets.length}</Badge>
              </div>
              <div className={`rounded-xl p-3 min-h-40 ${col.color} space-y-3`}>
                {colTickets.map((t) => (
                  <TicketCard key={t.id} ticket={t} basePath="/ba/tickets" />
                ))}
                {colTickets.length === 0 && (
                  <p className="text-xs text-gray-400 text-center pt-8">Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
