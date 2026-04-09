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
  basePath: string; // "/ba/tickets" or "/dev/tickets"
}

export function TicketCard({ ticket, basePath }: TicketCardProps) {
  return (
    <Link href={`${basePath}/${ticket.id}`}>
      <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-gray-400">{ticket.id}</span>
                <Badge variant={STATUS_VARIANT[ticket.status]}>
                  {STATUS_LABEL[ticket.status]}
                </Badge>
                <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
                  {ticket.priority}
                </Badge>
              </div>
              <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {ticket.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              {ticket.story_points && (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">
                  {ticket.story_points}
                </span>
              )}
              {ticket.sprint && (
                <p className="text-xs text-gray-400 mt-1">{ticket.sprint}</p>
              )}
            </div>
          </div>
          {ticket.commits.length > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              {ticket.commits.length} commit{ticket.commits.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
