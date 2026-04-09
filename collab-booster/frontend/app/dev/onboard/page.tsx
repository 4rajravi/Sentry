"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface OnboardingGuide {
  project_overview: string;
  architecture_summary: string;
  key_files: { path: string; purpose: string }[];
  recent_commits: { commit_id: string; summary: string; date?: string | null; author?: string | null }[];
  getting_started_steps: string[];
  assigned_tickets_guidance: string;
  recommended_reading_order: string[];
}

export default function Onboarding() {
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<OnboardingGuide | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.post<OnboardingGuide>("/api/dev/onboard", {});
      setGuide(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap max-w-4xl">
      <p className="section-label mb-2">Developer</p>
      <h1 className="text-3xl font-semibold text-zinc-900">Onboarding Guide</h1>
      <p className="mb-6 mt-2 text-zinc-600">Generate a personalized project briefing from real repository context.</p>

      {guide === null && loading === false && (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
          <p className="text-lg font-medium text-zinc-800">Ready to start</p>
          <p className="mx-auto mt-2 mb-6 max-w-xl text-zinc-600">
            AI will map architecture, recommend reading order, and summarize your assigned work.
          </p>
          <Button size="lg" onClick={handleGenerate}>
            Generate Onboarding Guide
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner label="Analyzing project structure..." />
        </div>
      )}

      {guide && loading === false && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Project Overview</h2>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-zinc-700">{guide.project_overview}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Architecture</h2>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-zinc-700">{guide.architecture_summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Read These Files First</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guide.recommended_reading_order.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-sm font-bold text-red-700">{i + 1}.</span>
                    <div>
                      <p className="font-mono text-sm text-zinc-800">{f}</p>
                      {guide.key_files.find((kf) => kf.path === f) && (
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {guide.key_files.find((kf) => kf.path === f)?.purpose}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Getting Started</h2>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {guide.getting_started_steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-700">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-red-300 bg-red-50 text-xs font-bold text-red-700">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Assigned Tickets</h2>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-zinc-700">{guide.assigned_tickets_guidance}</p>
            </CardContent>
          </Card>

          {guide.recent_commits && guide.recent_commits.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Recent Commits</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {guide.recent_commits.map((commit, i) => (
                    <li key={`${commit.commit_id}-${i}`} className="text-sm text-zinc-700">
                      <span className="font-mono text-xs font-semibold text-red-700">{commit.commit_id}</span>{" "}
                      - {commit.summary}
                      {(commit.date || commit.author) && (
                        <span className="text-zinc-500"> | {commit.date || "-"} | by {commit.author || "-"}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button variant="secondary" onClick={handleGenerate}>
            Regenerate Guide
          </Button>
        </div>
      )}
    </div>
  );
}
