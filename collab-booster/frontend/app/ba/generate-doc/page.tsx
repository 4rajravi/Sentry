"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const DOC_TYPES = [
  { value: "feature_summary", label: "Feature Summary" },
  { value: "business_requirements", label: "Business Requirements Document" },
  { value: "process_flow", label: "Process Flow Description" },
  { value: "stakeholder_update", label: "Stakeholder Update" },
];

interface GeneratedDoc {
  title: string;
  doc_type: string;
  content: string;
  key_business_rules: string[];
  stakeholder_summary: string;
}

export default function GenerateDoc() {
  const [codeContent, setCodeContent] = useState("");
  const [docType, setDocType] = useState("feature_summary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedDoc | null>(null);

  const handleGenerate = async () => {
    if (!codeContent.trim()) return;
    setLoading(true);
    try {
      const res = await api.post<GeneratedDoc>("/api/ba/generate-doc", {
        file_paths: [],
        doc_type: docType,
        code_content: codeContent,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <p className="section-label mb-2">Business Analyst</p>
      <h1 className="text-3xl font-semibold text-zinc-900">Generate Business Document</h1>
      <p className="mb-6 mt-2 text-zinc-600">Paste code context and produce non-technical documentation.</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Input</h2>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-zinc-700">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-zinc-700">Paste Code</label>
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="Paste code or describe the feature"
                rows={12}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
            </div>

            <Button onClick={handleGenerate} disabled={loading || !codeContent.trim()} className="w-full">
              {loading ? "Generating..." : "Generate Document"}
            </Button>
          </CardContent>
        </Card>

        <div>
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner label="Writing document..." />
            </div>
          )}
          {result && !loading && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">{result.title}</h2>
                  <button onClick={() => navigator.clipboard.writeText(result.content)} className="text-xs text-red-700">
                    Copy
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800">
                  {result.content}
                </pre>

                {result.key_business_rules.length > 0 && (
                  <div className="mt-4 border-t border-zinc-200 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Key Business Rules</p>
                    <ul className="space-y-1">
                      {result.key_business_rules.map((rule, i) => (
                        <li key={i} className="text-sm text-zinc-700">
                          - {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {!result && !loading && (
            <div className="flex h-64 items-center justify-center text-zinc-500">
              <p>Your document will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
