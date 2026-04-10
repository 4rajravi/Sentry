"use client";

import { useEffect, useMemo, useState } from "react";
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

interface GoogleStatus {
  connected: boolean;
  email: string | null;
}

interface GoogleLoginResponse {
  auth_url: string;
}

interface GoogleImportResponse {
  doc_url: string;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileTreeNode[];
}

function flattenFiles(nodes: FileTreeNode[]): string[] {
  const files: string[] = [];
  for (const node of nodes) {
    if (node.type === "file") {
      files.push(node.path);
      continue;
    }
    if (node.children?.length) {
      files.push(...flattenFiles(node.children));
    }
  }
  return files;
}

export default function GenerateDoc() {
  const [codeContent, setCodeContent] = useState("");
  const [documentBrief, setDocumentBrief] = useState("");
  const [docType, setDocType] = useState("feature_summary");
  const [treeFiles, setTreeFiles] = useState<string[]>([]);
  const [fileSearch, setFileSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedDoc | null>(null);
  const [importMessage, setImportMessage] = useState<string>("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  const copyWithFallback = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const refreshGoogleStatus = async () => {
    try {
      const status = await api.get<GoogleStatus>("/api/ba/google/status");
      setGoogleConnected(status.connected);
      setGoogleEmail(status.email);
      return status.connected;
    } catch {
      setGoogleConnected(false);
      setGoogleEmail(null);
      return false;
    }
  };

  const connectGoogle = async (): Promise<boolean> => {
    setGoogleBusy(true);
    try {
      const res = await api.get<GoogleLoginResponse>("/api/ba/google/login");
      const popup = window.open(res.auth_url, "_blank", "width=520,height=720");
      if (!popup) {
        setImportMessage("Popup blocked. Please allow popups and try again.");
        return false;
      }

      // Poll status so flow continues even if popup doesn't auto-close.
      const startedAt = Date.now();
      const timeoutMs = 90_000;
      while (Date.now() - startedAt < timeoutMs) {
        const connected = await refreshGoogleStatus();
        if (connected) {
          try {
            popup.close();
          } catch {
            // no-op
          }
          return true;
        }
        if (popup.closed) {
          // User closed popup before connection completed.
          break;
        }
        await new Promise((r) => window.setTimeout(r, 800));
      }
      return false;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect Google.";
      setImportMessage(msg);
      return false;
    } finally {
      setGoogleBusy(false);
    }
  };

  useEffect(() => {
    api
      .get<FileTreeNode[]>("/repo/tree")
      .then((nodes) => setTreeFiles(flattenFiles(nodes)))
      .catch(() => setTreeFiles([]))
      .finally(() => setLoadingFiles(false));
    void refreshGoogleStatus();
  }, []);

  const filteredFiles = useMemo(() => {
    const q = fileSearch.trim().toLowerCase();
    if (!q) return treeFiles;
    return treeFiles.filter((p) => p.toLowerCase().includes(q));
  }, [fileSearch, treeFiles]);

  const toggleFile = (path: string) => {
    setSelectedFiles((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const canGenerate =
    !!documentBrief.trim() && (selectedFiles.length > 0 || !!codeContent.trim());

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    try {
      const res = await api.post<GeneratedDoc>("/api/ba/generate-doc", {
        file_paths: selectedFiles,
        doc_type: docType,
        code_content: codeContent.trim() || null,
        document_brief: documentBrief.trim(),
      });
      setResult(res);
      setImportMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleImportToGoogleDoc = async () => {
    if (!result) return;
    // Open immediately within user gesture so popup blockers allow it.
    const docWindow = window.open("about:blank", "_blank");
    setGoogleBusy(true);
    try {
      let connected = googleConnected;
      if (!connected) {
        connected = await connectGoogle();
      }
      if (!connected) {
        setImportMessage("Google is not connected yet. Complete login and ensure redirect URI is correct, then try again.");
        return;
      }
      const res = await api.post<GoogleImportResponse>("/api/ba/google/import-doc", {
        title: result.title,
        content: result.content,
      });
      if (docWindow) {
        docWindow.location.href = res.doc_url;
      } else {
        window.open(res.doc_url, "_blank", "noopener,noreferrer");
      }
      setImportMessage("Google Doc created with title and content.");
    } catch (e) {
      if (docWindow && !docWindow.closed) {
        docWindow.close();
      }
      const msg = e instanceof Error ? e.message : "Failed to import document to Google.";
      setImportMessage(msg);
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleCopyContent = async () => {
    if (!result) return;
    const payload = `${result.title}\n\n${result.content}`;
    const copied = await copyWithFallback(payload);
    setImportMessage(copied ? "Content copied to clipboard." : "Copy blocked by browser permissions.");
  };

  return (
    <div className="page-wrap">
      <p className="section-label mb-2">Business Analyst</p>
      <h1 className="text-3xl font-semibold text-zinc-900">Generate Business Document</h1>
      <p className="mb-6 mt-2 text-zinc-600">Select repo files or paste a snippet, then describe the document you want.</p>

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
              <label className="mb-2 block text-sm font-medium text-zinc-700">Describe Document to Generate</label>
              <textarea
                value={documentBrief}
                onChange={(e) => setDocumentBrief(e.target.value)}
                placeholder="Example: Generate a BRD for loan term calculation for product and QA stakeholders. Include goals, scope, assumptions, business rules, and acceptance criteria."
                rows={4}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
            </div>

            <div className="mb-4 rounded-lg border border-zinc-200 p-3">
              <label className="mb-2 block text-sm font-medium text-zinc-700">Select Repo Files</label>
              <input
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                placeholder="Search files"
                className="mb-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-2">
                {loadingFiles && <p className="text-sm text-zinc-500">Loading files...</p>}
                {!loadingFiles && filteredFiles.length === 0 && (
                  <p className="text-sm text-zinc-500">No files found.</p>
                )}
                {!loadingFiles &&
                  filteredFiles.map((path) => (
                    <label key={path} className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(path)}
                        onChange={() => toggleFile(path)}
                        className="h-4 w-4 rounded border-zinc-300 text-red-700 focus:ring-red-600"
                      />
                      <span className="truncate font-mono text-xs">{path}</span>
                    </label>
                  ))}
              </div>
              <p className="mt-2 text-xs text-zinc-500">Selected: {selectedFiles.length}</p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-zinc-700">Optional Snippet</label>
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="Optional: paste a focused snippet if it is not covered by selected files"
                rows={8}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
            </div>

            <Button onClick={handleGenerate} disabled={loading || !canGenerate} className="w-full">
              {loading ? "Generating..." : "Generate Document"}
            </Button>
            {!canGenerate && (
              <p className="mt-2 text-xs text-zinc-500">
                Add a document brief and provide at least one source (selected file(s) or optional snippet).
              </p>
            )}
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
                  <button onClick={handleCopyContent} className="text-xs text-red-700">
                    Copy
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800">
                  {result.content}
                </pre>
                <button
                  onClick={handleImportToGoogleDoc}
                  disabled={googleBusy}
                  className="mt-4 w-full rounded-lg border border-red-700 bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {googleBusy ? "Importing..." : "Import to Google Doc"}
                </button>
                <p className="mt-2 text-xs text-zinc-600">
                  {googleConnected
                    ? `Google connected${googleEmail ? ` as ${googleEmail}` : ""}.`
                    : "Google not connected. Import will ask you to connect first."}
                </p>
                <button
                  onClick={handleCopyContent}
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  Copy Document Content
                </button>
                {importMessage && (
                  <p className="mt-2 text-xs text-zinc-600">{importMessage}</p>
                )}

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
