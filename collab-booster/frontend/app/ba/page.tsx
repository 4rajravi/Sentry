"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

const ACTIONS = [
  {
    href: "/ba/dashboard",
    code: "01",
    title: "Project progress",
    description: "Sprint board, ticket status, velocity, and completion estimates.",
  },
  {
    href: "/ba/chat",
    code: "02",
    title: "Codebase Q and A",
    description: "Ask what the system does and get plain-language explanations.",
  },
  {
    href: "/ba/create-tickets",
    code: "03",
    title: "Create tickets",
    description: "Transform requirement documents into structured ticket proposals.",
  },
  {
    href: "/ba/generate-doc",
    code: "04",
    title: "Generate business docs",
    description: "Produce summaries, BRDs, and process notes from implementation context.",
  },
];

export default function BAHome() {
  const { user } = useAuth("business_analyst");

  return (
    <div className="page-wrap">
      <div className="mb-10">
        <p className="section-label mb-2">Business Analyst Workspace</p>
        <h1 className="text-4xl font-semibold text-zinc-900">
          Welcome back, {user?.full_name?.split(" ")[0]}
        </h1>
        <p className="mt-3 text-zinc-600">Pick the workflow you want to run first.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="h-full cursor-pointer">
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
