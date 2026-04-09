export interface CommitListItem {
  sha: string;
  short_sha: string;
  message: string;
  author: string;
  date: string | null;
  files_changed: string[];
  files_changed_count: number;
}

export interface CommitDetail extends CommitListItem {
  parent_sha: string | null;
  patch: string;
}

export interface CommitExplanation {
  commit_sha: string;
  business_summary: string;
  impact: string;
  files_changed: string[];
}
