"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace(user.role === "business_analyst" ? "/ba" : "/dev");
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <span className="text-6xl">🤝</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          AI Collaboration Booster
        </h1>
        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          Bridging the gap between Business Analysts and Developers using AI.
          Understand code, translate requirements, explain changes — in the language your team speaks.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-left border border-white/10">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-white mb-2">Business Analyst</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Sprint progress dashboard</li>
              <li>• Commit explanations in plain English</li>
              <li>• Generate business docs from code</li>
              <li>• Requirements → Jira tickets</li>
            </ul>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-left border border-white/10">
            <div className="text-3xl mb-3">💻</div>
            <h3 className="font-semibold text-white mb-2">Developer</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Implementation guidance from tickets</li>
              <li>• Vacation catchup summaries</li>
              <li>• New developer onboarding</li>
              <li>• Technical code Q&A</li>
            </ul>
          </div>
        </div>

        <Link href="/login">
          <Button size="lg" className="px-10">
            Get Started →
          </Button>
        </Link>
      </div>
    </main>
  );
}
