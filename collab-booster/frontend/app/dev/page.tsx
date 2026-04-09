"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRepoContext } from "@/hooks/useRepoContext";
import { RepoConnector } from "@/components/common/RepoConnector";
import { Card, CardContent } from "@/components/ui/card";

const ACTIONS = [
  {
    href: "/dev/tickets",
    code: "01",
    title: "Active tickets",
    description: "Open your assigned tickets with implementation context and details.",
  },
  {
    href: "/dev/chat",
    code: "02",
    title: "Codebase chat",
    description: "Get technical answers with file-level guidance and direct references.",
  },
  {
    href: "/dev/catchup",
    code: "03",
    title: "Catchup summary",
    description: "Review updates and decisions made while you were away.",
  },
  {
    href: "/dev/onboard",
    code: "04",
    title: "Onboarding guide",
    description: "Generate a focused plan for understanding this project quickly.",
  },
];

export default function DevHome() {
  const { user } = useAuth("developer");
  const { repoReady } = useRepoContext();

  return (
    <div className="page-wrap">
      <div className="mb-10">
        <p className="section-label mb-2">Developer Workspace</p>
        <h1 className="text-4xl font-semibold text-zinc-900">
          Welcome back, {user?.full_name?.split(" ")[0]}
        </h1>
        <p className="mt-3 text-zinc-600">Choose where you want to start.</p>
      </div>

      <RepoConnector />

      <div className="grid gap-4 md:grid-cols-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={repoReady ? action.href : "#"}
            onClick={(e) => {
              if (!repoReady) e.preventDefault();
            }}
            aria-disabled={!repoReady}
          >
            <Card className={`h-full ${repoReady ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
              <CardContent className="py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">{action.code}</p>
                <h3 className="mt-3 text-xl font-semibold text-zinc-900">{action.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
