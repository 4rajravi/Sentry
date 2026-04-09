"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace(user.role === "business_analyst" ? "/ba" : "/dev");
    }
  }, [router]);

  return (
    <main className="min-h-screen">
      <div className="container flex min-h-screen items-center py-20">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="section-label mb-6">AI Collaboration Booster</p>
            <h1 className="text-balance text-5xl font-semibold leading-[1.02] text-zinc-900 md:text-7xl">
              Sharper handoffs between business and engineering.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
              Convert requirements into implementation-ready tickets and transform code changes into clear business language.
              Designed for teams that want speed without losing context.
            </p>
            <div className="mt-9 flex items-center gap-4">
              <Link href="/login">
                <Button size="lg">Enter Workspace</Button>
              </Link>
            </div>
          </div>

          <div className="app-surface rounded-xl p-6">
            <p className="section-label">Capabilities</p>
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Business Analyst</p>
                <ul className="mt-2 space-y-2 text-sm text-zinc-600">
                  <li>Sprint status and delivery visibility</li>
                  <li>Code-to-business explanations</li>
                  <li>Automated documentation generation</li>
                  <li>Requirement-to-ticket conversion</li>
                </ul>
              </div>
              <div className="border-t border-zinc-200 pt-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Developer</p>
                <ul className="mt-2 space-y-2 text-sm text-zinc-600">
                  <li>Implementation guidance per ticket</li>
                  <li>Catch-up summaries after time away</li>
                  <li>Onboarding from real code context</li>
                  <li>Technical Q and A over the codebase</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
