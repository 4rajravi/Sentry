"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useRepoContext } from "@/hooks/useRepoContext";

interface NavItem {
  href: string;
  label: string;
  icon: "home" | "board" | "ticket" | "doc" | "create" | "chat" | "time" | "onboard" | "commit";
}

interface SidebarProps {
  role: "ba" | "dev";
  fullName: string;
  onLogout: () => void;
}

const BA_NAV: NavItem[] = [
  { href: "/ba", label: "Home", icon: "home" },
  { href: "/ba/dashboard", label: "Sprint Dashboard", icon: "board" },
  { href: "/ba/generate-doc", label: "Generate Biz Doc", icon: "doc" },
  { href: "/ba/create-tickets", label: "Create Tickets", icon: "create" },
  { href: "/ba/chat", label: "Chat with Code", icon: "chat" },
];

const DEV_NAV: NavItem[] = [
  { href: "/dev", label: "Home", icon: "home" },
  { href: "/dev/tickets", label: "My Tickets", icon: "ticket" },
  { href: "/dev/commits", label: "Commits", icon: "commit" },
  { href: "/dev/catchup", label: "Vacation Catchup", icon: "time" },
  { href: "/dev/onboard", label: "Onboarding", icon: "onboard" },
  { href: "/dev/chat", label: "Chat with Code", icon: "chat" },
];

function Icon({ name }: { name: NavItem["icon"] }) {
  const base = "h-4 w-4 stroke-current";

  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <path d="M3 10.5L12 3l9 7.5" strokeWidth="1.8" />
          <path d="M5.5 9.5V21h13V9.5" strokeWidth="1.8" />
        </svg>
      );
    case "board":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.8" />
          <path d="M3 10h18M9 10v10M15 10v10" strokeWidth="1.8" />
        </svg>
      );
    case "ticket":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <path d="M3 8.5h18v3a2 2 0 010 4v3H3v-3a2 2 0 010-4v-3z" strokeWidth="1.8" />
          <path d="M12 8.5v10" strokeWidth="1.8" strokeDasharray="2 2" />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <path d="M7 3h7l5 5v13H7z" strokeWidth="1.8" />
          <path d="M14 3v5h5M9 13h8M9 17h8" strokeWidth="1.8" />
        </svg>
      );
    case "create":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <path d="M12 5v14M5 12h14" strokeWidth="1.8" />
          <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.8" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <path d="M4 5h16v11H9l-5 4z" strokeWidth="1.8" />
          <path d="M8 10h8M8 13h5" strokeWidth="1.8" />
        </svg>
      );
    case "time":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
          <path d="M12 7v6l4 2" strokeWidth="1.8" />
        </svg>
      );
    case "onboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <path d="M12 4v9" strokeWidth="1.8" />
          <path d="M8 9l4-5 4 5" strokeWidth="1.8" />
          <rect x="4" y="14" width="16" height="6" rx="2" strokeWidth="1.8" />
        </svg>
      );
    case "commit":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <circle cx="6" cy="12" r="2.5" strokeWidth="1.8" />
          <circle cx="18" cy="12" r="2.5" strokeWidth="1.8" />
          <path d="M8.5 12h7" strokeWidth="1.8" />
        </svg>
      );
    default:
      return null;
  }
}

export function Sidebar({ role, fullName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "ba" ? BA_NAV : DEV_NAV;
  const { repoReady } = useRepoContext();
  const homeHref = role === "ba" ? "/ba" : "/dev";

  return (
    <aside className="w-64 min-h-screen border-r border-zinc-200 bg-white text-zinc-900 backdrop-blur">
      <div className="border-b border-zinc-200 px-6 py-5">
        <p className="section-label mb-2">{role === "ba" ? "Business Analyst" : "Developer"}</p>
        <h2 className="truncate text-lg font-semibold">{fullName}</h2>
      </div>

      <div className="px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        AI Collab Booster
      </div>

      <nav className="flex-1 px-3 py-2">
        {nav.map((item) => {
          const disabled = !repoReady && item.href !== homeHref;
          const active =
            item.href === "/ba" || item.href === "/dev"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={disabled ? "#" : item.href}
              onClick={(e) => {
                if (disabled) e.preventDefault();
              }}
              aria-disabled={disabled}
              className={clsx(
                "mb-1.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                active
                  ? "border border-red-300 bg-red-50 text-red-700"
                  : "border border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-white hover:text-zinc-900",
                disabled && "cursor-not-allowed opacity-40 hover:border-transparent hover:bg-transparent hover:text-zinc-600"
              )}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 px-6 py-4">
        <button
          onClick={onLogout}
          className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
