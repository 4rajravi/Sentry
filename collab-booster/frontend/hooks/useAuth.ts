"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, clearAuth } from "@/lib/auth";
import type { CurrentUser } from "@/types/auth";

export function useAuth(requiredRole?: "business_analyst" | "developer") {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (requiredRole && u.role !== requiredRole) {
      router.replace(u.role === "business_analyst" ? "/ba" : "/dev");
      return;
    }
    setUser(u);
    setLoading(false);
  }, [requiredRole, router]);

  const logout = () => {
    clearAuth();
    router.replace("/login");
  };

  return { user, loading, logout };
}
