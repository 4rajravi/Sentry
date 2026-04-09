"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { TicketCard } from "@/components/tickets/TicketCard";
import type { Ticket } from "@/types/ticket";

export default function BATickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Ticket[]>("/api/ba/tickets")
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-8">
        <LoadingSpinner label="Loading tickets..." />
      </div>
    );

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tickets</h1>
      {tickets.length === 0 ? (
        <p className="text-gray-500">No tickets found.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} basePath="/ba/tickets" />
          ))}
        </div>
      )}
    </div>
  );
}
