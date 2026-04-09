"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

const ACTIONS = [
  {
    href: "/dev/tickets",
    icon: "🎫",
    title: "My Active Tickets",
    description: "See your assigned tickets with AI implementation guidance",
  },
  {
    href: "/dev/chat",
    icon: "💬",
    title: "Chat with the Codebase",
    description: "Get precise technical answers with file references and code snippets",
  },
  {
    href: "/dev/catchup",
    icon: "🏖️",
    title: "Vacation Catchup",
    description: "Get a summary of everything that happened while you were away",
  },
  {
    href: "/dev/onboard",
    icon: "🚀",
    title: "I'm New Here",
    description: "Get a personalized onboarding guide for this project",
  },
];

export default function DevHome() {
  const { user } = useAuth("developer");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.full_name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          What would you like to work on?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer h-full">
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
