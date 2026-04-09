"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { TicketCard } from "@/components/tickets/TicketCard";
import type { Ticket } from "@/types/ticket";

export default function DevTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Ticket[]>("/api/dev/tickets")
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="page-wrap">
        <LoadingSpinner label="Loading your tickets..." />
      </div>
    );

  return (
    <div className="page-wrap max-w-4xl">
      <p className="section-label mb-2">Developer</p>
      <h1 className="mb-6 text-3xl font-semibold text-zinc-900">My Tickets</h1>
      {tickets.length === 0 ? (
        <p className="text-zinc-600">No tickets assigned.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} basePath="/dev/tickets" />
          ))}
        </div>
      )}
    </div>
  );
}
