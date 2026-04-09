"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  role: "ba" | "dev";
  fullName: string;
  onLogout: () => void;
}

const BA_NAV: NavItem[] = [
  { href: "/ba", label: "Home", icon: "🏠" },
  { href: "/ba/dashboard", label: "Sprint Dashboard", icon: "📊" },
  { href: "/ba/tickets", label: "My Tickets", icon: "🎫" },
  { href: "/ba/generate-doc", label: "Generate Biz Doc", icon: "📄" },
  { href: "/ba/create-tickets", label: "Create Tickets", icon: "➕" },
  { href: "/ba/chat", label: "Chat with Code", icon: "💬" },
];

const DEV_NAV: NavItem[] = [
  { href: "/dev", label: "Home", icon: "🏠" },
  { href: "/dev/tickets", label: "My Tickets", icon: "🎫" },
  { href: "/dev/catchup", label: "Vacation Catchup", icon: "🏖️" },
  { href: "/dev/onboard", label: "Onboarding", icon: "🚀" },
  { href: "/dev/chat", label: "Chat with Code", icon: "💬" },
];

export function Sidebar({ role, fullName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "ba" ? BA_NAV : DEV_NAV;
  const accentColor = role === "ba" ? "blue" : "purple";

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className={clsx("px-6 py-5 border-b border-gray-700")}>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
          {role === "ba" ? "Business Analyst" : "Developer"}
        </p>
        <h2 className="font-bold text-lg truncate">{fullName}</h2>
      </div>

      <div className="px-6 py-3 text-xs text-gray-500 uppercase tracking-widest font-semibold">
        AI Collab Booster
      </div>

      <nav className="flex-1 px-3">
        {nav.map((item) => {
          const active =
            item.href === "/ba" || item.href === "/dev"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  );
}
