"use client";

import { useMemo, useState } from "react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { emitRepoContextUpdated, useRepoContext } from "@/hooks/useRepoContext";

interface GitHubAuthUrlResponse {
  auth_url: string;
}

interface IngestResponse {
  files_processed: number;
  chunks_indexed: number;
  message: string;
  active_repo_id: string;
  active_repo_url: string | null;
}

function formatRepoLabel(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com") {
      return parsed.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    }
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
}

export function RepoConnector() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const { context, refresh } = useRepoContext();

  const githubStatus = useMemo(() => {
    if (!context) return "Loading GitHub status...";
    if (context.github_connected && context.github_username) {
      return `GitHub: ${context.github_username}`;
    }
    if (context.github_connected) {
      return "GitHub connected";
    }
    return "GitHub not connected";
  }, [context]);

  const connectGitHub = async () => {
    setGithubLoading(true);
    setError("");
    setStatus("");

    try {
      const res = await api.get<GitHubAuthUrlResponse>("/repo/github/login");
      const popup = window.open(res.auth_url, "github_oauth", "width=620,height=740");
      if (!popup) {
        throw new Error("Popup blocked by browser. Allow popups and try again.");
      }

      let attempts = 0;
      const maxAttempts = 45;

      const interval = window.setInterval(async () => {
        attempts += 1;
        try {
          await refresh();
          emitRepoContextUpdated();
          const latest = await api.get<{ github_connected: boolean }>("/repo/current");
          if (latest.github_connected) {
            window.clearInterval(interval);
            setGithubLoading(false);
            setStatus("GitHub connected successfully.");
            if (!popup.closed) popup.close();
            return;
          }
        } catch {
          // ignore transient polling issues
        }

        if (attempts >= maxAttempts || popup.closed) {
          window.clearInterval(interval);
          setGithubLoading(false);
        }
      }, 2000);
    } catch (e) {
      setGithubLoading(false);
      setError(e instanceof Error ? e.message : "Failed to start GitHub login");
    }
  };

  const logoutGitHub = async () => {
    setGithubLoading(true);
    setError("");
    setStatus("");
    try {
      await api.post<{ ok: boolean }>("/repo/github/logout", {});
      await refresh();
      emitRepoContextUpdated();
      setStatus("GitHub disconnected.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to logout from GitHub");
    } finally {
      setGithubLoading(false);
    }
  };

  const ingestRepo = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const res = await api.post<IngestResponse>("/repo/ingest", {
        repo_url: repoUrl.trim(),
      });
      await refresh();
      emitRepoContextUpdated();
      setStatus(
        `Repository ingested: ${res.files_processed} files, ${res.chunks_indexed} indexed chunks.`
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to ingest repository";
      const isPrivateRepoError =
        message.toLowerCase().includes("failed to clone") && !context?.github_connected;

      if (isPrivateRepoError) {
        setError("Repository appears private. Please login with GitHub first.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <h2 className="text-base font-semibold text-zinc-900">Repository Connection</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Add a GitHub repository to power chat, onboarding, ticket guidance, and document generation.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repository"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
          <Button onClick={ingestRepo} disabled={loading || githubLoading}>
            {loading ? "Cloning and indexing..." : "Add Repo"}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {context?.github_connected ? (
            <Button variant="secondary" onClick={logoutGitHub} disabled={githubLoading || loading}>
              {githubLoading ? "Processing..." : "Logout GitHub"}
            </Button>
          ) : (
            <Button variant="secondary" onClick={connectGitHub} disabled={githubLoading || loading}>
              {githubLoading ? "Waiting for GitHub..." : "Login with GitHub"}
            </Button>
          )}

          <span className="text-sm text-zinc-600">{githubStatus}</span>
        </div>

        {context?.active_repo_url && (
          <p className="mt-3 text-sm text-zinc-700">
            Active repo: <span className="font-medium">{formatRepoLabel(context.active_repo_url)}</span>
          </p>
        )}

        {status && <p className="mt-3 text-sm text-red-700">{status}</p>}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </CardContent>
    </Card>
  );
}
