import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Ticket } from "@/types/ticket";

const STATUS_VARIANT: Record<string, "default" | "warning" | "purple" | "success" | "secondary"> = {
  todo: "secondary",
  in_progress: "warning",
  in_review: "purple",
  done: "success",
};

const STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

const PRIORITY_VARIANT: Record<string, "default" | "danger" | "warning" | "secondary"> = {
  low: "secondary",
  medium: "default",
  high: "warning",
  critical: "danger",
};

interface TicketCardProps {
  ticket: Ticket;
  basePath: string;
}

export function TicketCard({ ticket, basePath }: TicketCardProps) {
  return (
    <Link href={`${basePath}/${ticket.id}`}>
      <Card className="cursor-pointer">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-zinc-500">{ticket.id}</span>
                <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
                <Badge variant={PRIORITY_VARIANT[ticket.priority]}>{ticket.priority}</Badge>
              </div>
              <p className="text-base font-medium text-zinc-900">{ticket.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{ticket.description}</p>
              {ticket.technical_doc_link && (
                <p className="mt-2 text-xs text-zinc-500">
                  TRS:{" "}
                  <span className="font-medium text-red-700">
                    linked
                  </span>
                </p>
              )}
            </div>
            <div className="shrink-0 self-start text-left sm:text-right">
              {ticket.story_points && (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-500/40 bg-red-500/10 text-sm font-bold text-red-700">
                  {ticket.story_points}
                </span>
              )}
              {ticket.sprint && <p className="mt-1 text-xs text-zinc-500">{ticket.sprint}</p>}
            </div>
          </div>
          {ticket.commits.length > 0 && (
            <p className="mt-3 text-xs text-zinc-500">
              {ticket.commits.length} commit{ticket.commits.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
