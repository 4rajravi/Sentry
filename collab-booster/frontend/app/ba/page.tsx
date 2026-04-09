"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

const ACTIONS = [
  {
    href: "/ba/dashboard",
    icon: "📊",
    title: "Show me project progress",
    description: "Sprint board, ticket status, velocity and completion estimates",
  },
  {
    href: "/ba/chat",
    icon: "💬",
    title: "Chat with the codebase",
    description: "Ask questions about what the code does — plain English answers",
  },
  {
    href: "/ba/create-tickets",
    icon: "📝",
    title: "Create tickets from requirements",
    description: "Paste your requirements doc → AI generates Jira tickets",
  },
  {
    href: "/ba/generate-doc",
    icon: "📄",
    title: "Generate business docs from code",
    description: "Select files → AI writes feature summaries, BRDs, process flows",
  },
];

export default function BAHome() {
  const { user } = useAuth("business_analyst");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Good morning, {user?.full_name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          How would you like to start your day?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer h-full">
              <CardContent className="py-6">
                <div className="text-4xl mb-4">{action.icon}</div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
