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
const REPO_CONTEXT_CACHE_KEY = "repo_context_cache";

export function emitRepoContextUpdated(context?: RepoContextResponse | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REPO_CONTEXT_UPDATED_EVENT, { detail: context }));
}

function readCachedContext(): RepoContextResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REPO_CONTEXT_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RepoContextResponse;
  } catch {
    return null;
  }
}

export function writeCachedRepoContext(context: RepoContextResponse | null) {
  if (typeof window === "undefined") return;
  if (!context) {
    window.localStorage.removeItem(REPO_CONTEXT_CACHE_KEY);
    return;
  }
  window.localStorage.setItem(REPO_CONTEXT_CACHE_KEY, JSON.stringify(context));
}

export function useRepoContext() {
  const [context, setContext] = useState<RepoContextResponse | null>(() => readCachedContext());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<RepoContextResponse>("/repo/current");
      setContext(data);
      writeCachedRepoContext(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load repo context");
      const cached = readCachedContext();
      if (cached) {
        setContext(cached);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<RepoContextResponse | null | undefined>;
      if (typeof custom.detail !== "undefined") {
        setContext(custom.detail ?? null);
        writeCachedRepoContext(custom.detail ?? null);
        setLoading(false);
        return;
      }
      void refresh();
    };
    window.addEventListener(REPO_CONTEXT_UPDATED_EVENT, handler);
    return () => window.removeEventListener(REPO_CONTEXT_UPDATED_EVENT, handler);
  }, [refresh]);

  return {
    context,
    loading,
    error,
    refresh,
    repoReady: Boolean(
      context?.active_repo_id || context?.active_repo_url || context?.active_repo_path
    ),
  };
}
