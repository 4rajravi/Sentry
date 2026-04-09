"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { CommitDetail, CommitExplanation, CommitListItem } from "@/types/commit";

interface ExplainResponse {
  commit: CommitDetail;
  explanation: CommitExplanation;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function DevCommitsPage() {
  const [search, setSearch] = useState("");
  const [fileFilter, setFileFilter] = useState("");
  const [commits, setCommits] = useState<CommitListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [selectedSha, setSelectedSha] = useState<string | null>(null);
  const [commitDetail, setCommitDetail] = useState<CommitDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<CommitExplanation | null>(null);
  const [error, setError] = useState<string>("");

  const selectedCommit = useMemo(
    () => commits.find((c) => c.sha === selectedSha) ?? null,
    [commits, selectedSha]
  );

  const loadCommits = async (next?: { query?: string; filePath?: string }) => {
    setLoadingList(true);
    setError("");
    setExplanation(null);
    setCommitDetail(null);
    setSelectedSha(null);

    const queryValue = next?.query ?? search;
    const filePathValue = next?.filePath ?? fileFilter;
    const params = new URLSearchParams();
    if (queryValue.trim()) params.set("q", queryValue.trim());
    if (filePathValue.trim()) params.set("file_path", filePathValue.trim());
    params.set("limit", "200");

    try {
      const data = await api.get<CommitListItem[]>(`/api/dev/commits?${params.toString()}`);
      setCommits(data);
      if (data.length > 0) {
        setSelectedSha(data[0].sha);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load commits");
      setCommits([]);
    } finally {
      setLoadingList(false);
    }
  };

  const loadCommitDetail = async (sha: string) => {
    setLoadingDetail(true);
    setError("");
    setExplanation(null);
    try {
      const detail = await api.get<CommitDetail>(`/api/dev/commits/${sha}`);
      setCommitDetail(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load commit details");
      setCommitDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const explainChange = async () => {
    if (!selectedSha) return;
    setExplaining(true);
    setError("");
    try {
      const data = await api.post<ExplainResponse>(`/api/dev/commits/${selectedSha}/explain`, {});
      setCommitDetail(data.commit);
      setExplanation(data.explanation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to explain commit");
    } finally {
      setExplaining(false);
    }
  };

  useEffect(() => {
    void (async () => {
      setLoadingList(true);
      setError("");
      try {
        const data = await api.get<CommitListItem[]>("/api/dev/commits?limit=200");
        setCommits(data);
        if (data.length > 0) {
          setSelectedSha(data[0].sha);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load commits");
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSha) return;
    void loadCommitDetail(selectedSha);
  }, [selectedSha]);

  return (
    <div className="page-wrap">
      <p className="section-label mb-2">Developer</p>
      <h1 className="mb-2 text-3xl font-semibold text-zinc-900">Commit Explorer</h1>
      <p className="mb-6 text-zinc-600">Search commits, filter by file, inspect full diffs, and explain changes.</p>

      <Card className="mb-4">
        <CardContent className="py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadCommits();
            }}
            className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SHA, message, author, or file"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            <input
              type="text"
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              placeholder="Filter by file path (e.g. src/routes.py)"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            <Button type="submit" disabled={loadingList || loadingDetail}>
              {loadingList ? "Searching..." : "Search"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearch("");
                setFileFilter("");
                void loadCommits({ query: "", filePath: "" });
              }}
              disabled={loadingList || loadingDetail}
            >
              Reset
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="h-[70vh]">
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Commits</h2>
          </CardHeader>
          <CardContent className="h-[calc(70vh-84px)] overflow-auto">
            {loadingList ? (
              <LoadingSpinner label="Loading commits..." />
            ) : commits.length === 0 ? (
              <p className="text-sm text-zinc-500">No commits found for current filters.</p>
            ) : (
              <div className="space-y-2">
                {commits.map((commit) => {
                  const active = commit.sha === selectedSha;
                  return (
                    <button
                      key={commit.sha}
                      onClick={() => setSelectedSha(commit.sha)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        active
                          ? "border-red-300 bg-red-50"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-red-700">{commit.short_sha}</span>
                        <span className="text-[11px] text-zinc-500">{formatDate(commit.date)}</span>
                      </div>
                      <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                        Jira: <span className="font-semibold text-zinc-700">{commit.jira_ticket_id || "--"}</span>
                      </p>
                      <p className="line-clamp-2 text-sm font-medium text-zinc-900">{commit.message}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {commit.author} - {commit.files_changed_count} file(s)
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-[70vh]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Commit Detail</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={explainChange}
                disabled={!selectedSha || loadingDetail || explaining}
              >
                {explaining ? "Explaining..." : "Explain Code Change"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-[calc(70vh-84px)] overflow-auto">
            {loadingDetail ? (
              <LoadingSpinner label="Loading commit diff..." />
            ) : !selectedCommit ? (
              <p className="text-sm text-zinc-500">Select a commit to view details.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="font-mono text-xs text-red-700">{selectedCommit.sha}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                    Jira: <span className="font-semibold text-zinc-700">{(commitDetail?.jira_ticket_id ?? selectedCommit.jira_ticket_id) || "--"}</span>
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-900">{selectedCommit.message}</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    {selectedCommit.author} - {formatDate(selectedCommit.date)}
                  </p>
                </div>

                {explanation && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-700">AI Summary</p>
                    <p className="mt-2 text-sm text-zinc-800">{explanation.business_summary}</p>
                    {explanation.impact && <p className="mt-2 text-sm text-zinc-700">{explanation.impact}</p>}
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Files Changed ({commitDetail?.files_changed_count ?? selectedCommit.files_changed_count})
                  </p>
                  <div className="max-h-44 overflow-auto rounded-lg border border-zinc-200 bg-white p-2">
                    <ul className="space-y-1">
                      {(commitDetail?.files_changed ?? selectedCommit.files_changed).map((file) => (
                        <li key={file} className="font-mono text-xs text-zinc-700">
                          {file}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Git Diff / Changes</p>
                  <pre className="max-h-[36vh] overflow-auto rounded-lg border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-800">
                    {commitDetail?.patch || "No diff content available."}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
