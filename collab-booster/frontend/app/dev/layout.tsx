"use client";

import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/common/Sidebar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth("developer");

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="Loading your cockpit..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar role="dev" fullName={user.full_name} onLogout={logout} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
