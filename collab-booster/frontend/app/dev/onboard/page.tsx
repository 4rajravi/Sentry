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
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        🚀 New Developer Onboarding
      </h1>
      <p className="text-gray-500 mb-6">
        Get a personalized guide to this project — architecture, key files, and your assigned tickets.
      </p>

      {!guide && !loading && (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-4">🚀</p>
          <p className="text-lg font-medium text-gray-700 mb-2">
            Ready to get started?
          </p>
          <p className="text-gray-500 mb-6">
            AI will analyze the codebase and your assigned tickets to create a personalized guide.
          </p>
          <Button size="lg" onClick={handleGenerate}>
            Generate My Onboarding Guide
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner label="AI is exploring the project for you..." />
        </div>
      )}

      {guide && !loading && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800">📖 Project Overview</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{guide.project_overview}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800">🏗️ Architecture</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{guide.architecture_summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800">📂 Read These Files First</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guide.recommended_reading_order.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-blue-500 font-mono text-sm font-bold mt-0.5">
                      {i + 1}.
                    </span>
                    <div>
                      <p className="font-mono text-sm text-gray-800">{f}</p>
                      {guide.key_files.find((kf) => kf.path === f) && (
                        <p className="text-xs text-gray-500 mt-0.5">
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
              <h2 className="font-semibold text-gray-800">⚙️ Getting Started</h2>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {guide.getting_started_steps.map((step, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-3">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0 mt-0.5">
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
              <h2 className="font-semibold text-gray-800">🎫 Your Tickets</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {guide.assigned_tickets_guidance}
              </p>
            </CardContent>
          </Card>

          <Button variant="secondary" onClick={handleGenerate}>
            Regenerate Guide
          </Button>
        </div>
      )}
    </div>
  );
}
