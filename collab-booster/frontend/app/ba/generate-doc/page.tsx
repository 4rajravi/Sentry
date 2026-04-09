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
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        📄 Generate Business Document
      </h1>
      <p className="text-gray-500 mb-6">
        Paste code and get a business document — no technical jargon.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800">Input</h2>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Code
                </label>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="Paste code here, or describe the feature you want documented..."
                  rows={12}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !codeContent.trim()}
                className="w-full"
              >
                {loading ? "Generating..." : "Generate Document"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          {loading && (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner label="AI is writing your document..." />
            </div>
          )}
          {result && !loading && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">{result.title}</h2>
                  <button
                    onClick={() => navigator.clipboard.writeText(result.content)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    📋 Copy
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed max-h-96 overflow-y-auto">
                  {result.content}
                </pre>

                {result.key_business_rules.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Key Business Rules
                    </p>
                    <ul className="space-y-1">
                      {result.key_business_rules.map((rule, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-blue-500">•</span> {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {!result && !loading && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-3">📄</p>
                <p>Your document will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
