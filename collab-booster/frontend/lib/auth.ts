import type { AuthToken, CurrentUser } from "@/types/auth";

export function saveAuth(token: AuthToken) {
  localStorage.setItem("access_token", token.access_token);
  localStorage.setItem("user_role", token.role);
  localStorage.setItem("user_id", token.user_id);
  localStorage.setItem("full_name", token.full_name);
}

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("full_name");
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("user_role");
  const user_id = localStorage.getItem("user_id");
  const full_name = localStorage.getItem("full_name");
  if (!token || !role || !user_id || !full_name) return null;
  return { token, role: role as CurrentUser["role"], user_id, full_name };
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}
