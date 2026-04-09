"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRepoContext } from "@/hooks/useRepoContext";
import { Sidebar } from "@/components/common/Sidebar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function BALayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth("business_analyst");
  const { repoReady, loading: repoLoading } = useRepoContext();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (repoLoading) return;
    if (!repoReady && pathname !== "/ba") {
      router.replace("/ba");
    }
  }, [pathname, repoLoading, repoReady, router]);

  if (loading || repoLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="Loading your cockpit..." />
      </div>
    );
  }

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/ba");
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar role="ba" fullName={user.full_name} onLogout={logout} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="px-6 pt-5">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-current">
              <path d="M15 6l-6 6 6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
