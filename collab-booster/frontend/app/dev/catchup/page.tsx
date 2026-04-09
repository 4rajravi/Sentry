"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface CatchupSummary {
  period: string;
  completed_work: string[];
  in_progress_work: string[];
  new_tickets_assigned: string[];
  key_code_changes: string[];
  narrative: string;
}

export default function VacationCatchup() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<CatchupSummary | null>(null);

  const handleCatchup = async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    setSummary(null);
    try {
      const res = await api.post<CatchupSummary>("/api/dev/catchup", {
        from_date: fromDate,
        to_date: toDate,
      });
      setSummary(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        🏖️ Vacation Catchup
      </h1>
      <p className="text-gray-500 mb-6">
        Select when you were away — AI will summarize everything that happened.
      </p>

      <Card className="mb-6">
        <CardContent className="py-5">
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              onClick={handleCatchup}
              disabled={loading || !fromDate}
            >
              {loading ? "Summarizing..." : "Catch me up!"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner label="AI is reviewing commits and tickets..." />
        </div>
      )}

      {summary && !loading && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold text-blue-900 mb-2">
              📋 {summary.period}
            </p>
            <p className="text-sm text-blue-800 leading-relaxed">{summary.narrative}</p>
          </div>

          {summary.completed_work.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800">✅ Completed</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {summary.completed_work.map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-green-500">•</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {summary.in_progress_work.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800">⏳ In Progress</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {summary.in_progress_work.map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-blue-500">•</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {summary.new_tickets_assigned.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800">
                  🎫 New Tickets Assigned to You
                </h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {summary.new_tickets_assigned.map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-orange-500">→</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {summary.key_code_changes.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800">🔧 Key Code Changes</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {summary.key_code_changes.map((item, i) => (
                    <li key={i} className="text-sm font-mono text-gray-700 flex gap-2">
                      <span className="text-purple-500">•</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
