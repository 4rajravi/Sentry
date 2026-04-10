"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import type { AuthToken } from "@/types/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"developer" | "business_analyst">("developer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidPassword = (value: string) =>
    value.length >= 8 && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please fill all required fields");
      return;
    }
    if (!isValidPassword(password)) {
      setError("Password must be at least 8 characters with one number and one special character");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and confirm password must match");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = await api.post<AuthToken>("/auth/register", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        confirm_password: confirmPassword,
        role,
      });
      saveAuth(token);
      router.replace(token.role === "business_analyst" ? "/ba" : "/dev");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="section-label mb-3">AI Collaboration Booster</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Create Account</h1>
          <p className="mt-2 text-sm text-zinc-600">Sign up to access developer or BA workspace.</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Sign Up</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
                />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "developer" | "business_analyst")}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              >
                <option value="developer">Developer</option>
                <option value="business_analyst">Business Analyst</option>
              </select>
              <p className="text-xs text-zinc-500">
                Password must be at least 8 characters and include one number and one special character.
              </p>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <Button onClick={handleSignup} disabled={loading} className="w-full">
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
              <p className="text-center text-sm text-zinc-600">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-red-700 underline underline-offset-2">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
