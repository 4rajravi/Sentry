"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import type { AuthToken } from "@/types/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DEMO_USERS = [
  { username: "ba_tom", label: "Tom", role: "Business Analyst" },
  { username: "dev_alice", label: "Alice", role: "Developer" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (u?: string) => {
    const user = u || username;
    if (!user) {
      setError("Please enter a username");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await api.post<AuthToken>("/auth/login", {
        username: user,
        password,
      });
      saveAuth(token);
      router.replace(token.role === "business_analyst" ? "/ba" : "/dev");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="section-label mb-3">AI Collaboration Booster</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Workspace Access</h1>
          <p className="mt-2 text-sm text-zinc-600">Sign in with a demo profile or enter credentials manually.</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Quick Login</h2>
            <p className="mt-1 text-xs text-zinc-500">All demo accounts use password: demo1234</p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.username}
                  onClick={() => handleLogin(u.username)}
                  disabled={loading}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left transition-all hover:border-red-300 hover:bg-zinc-50 disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{u.label}</p>
                    <p className="text-xs text-zinc-500">{u.role}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Use</span>
                </button>
              ))}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs text-zinc-500">
                <span className="bg-white px-2">Manual login</span>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <Button onClick={() => handleLogin()} disabled={loading} className="w-full">
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
