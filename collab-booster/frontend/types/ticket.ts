export type TicketStatus = "todo" | "in_progress" | "in_review" | "done";
export type TicketType = "story" | "task" | "bug";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface Commit {
  id: number;
  ticket_id: string;
  commit_sha: string;
  commit_message: string;
  author: string;
  files_changed: string[] | null;
  diff_summary: string | null;
  created_at: string;
  ai_explanation?: CommitExplanation;
}

export interface CommitExplanation {
  commit_sha: string;
  business_summary: string;
  impact: string;
  files_changed: string[];
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  ticket_type: TicketType;
  priority: TicketPriority;
  story_points: number | null;
  sprint: string | null;
  assignee_id: string | null;
  reporter_id: string;
  acceptance_criteria: string | null;
  affected_files: string[] | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  commits: Commit[];
}

export interface ImplementationGuidance {
  ticket_id: string;
  what_to_implement: string[];
  technical_hints: string[];
  relevant_files: string[];
  formula_or_algorithm: string | null;
  checklist: string[];
}
