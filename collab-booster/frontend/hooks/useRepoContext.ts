"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";

export interface RepoContextResponse {
  github_connected: boolean;
  github_username: string | null;
  active_repo_id: string | null;
  active_repo_url: string | null;
  active_repo_path: string | null;
}

const REPO_CONTEXT_UPDATED_EVENT = "repo-context-updated";

export function emitRepoContextUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REPO_CONTEXT_UPDATED_EVENT));
}

export function useRepoContext() {
  const [context, setContext] = useState<RepoContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<RepoContextResponse>("/repo/current");
      setContext(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load repo context");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => {
      refresh();
    };
    window.addEventListener(REPO_CONTEXT_UPDATED_EVENT, handler);
    return () => window.removeEventListener(REPO_CONTEXT_UPDATED_EVENT, handler);
  }, [refresh]);

  return {
    context,
    loading,
    error,
    refresh,
    repoReady: Boolean(context?.active_repo_id),
  };
}
