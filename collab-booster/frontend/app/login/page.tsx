"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import type { AuthToken } from "@/types/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DEMO_USERS = [
  { username: "ba_sarah", label: "Sarah (BA)", role: "Business Analyst", icon: "📊" },
  { username: "ba_tom", label: "Tom (BA)", role: "Business Analyst", icon: "📊" },
  { username: "dev_alice", label: "Alice (Dev)", role: "Developer", icon: "💻" },
  { username: "dev_bob", label: "Bob (Dev)", role: "Developer", icon: "💻" },
  { username: "dev_newbie", label: "Chris (New Dev)", role: "Developer", icon: "🚀" },
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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🤝</span>
          <h1 className="text-2xl font-bold text-white mt-4">AI Collab Booster</h1>
          <p className="text-gray-400 mt-1">Sign in to your cockpit</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">Quick Login — Demo Users</h2>
            <p className="text-xs text-gray-500 mt-1">All passwords: demo1234</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.username}
                  onClick={() => handleLogin(u.username)}
                  disabled={loading}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <span className="text-xl">{u.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{u.label}</p>
                    <p className="text-xs text-gray-500">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="bg-white px-2">or enter manually</span>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                onClick={() => handleLogin()}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
