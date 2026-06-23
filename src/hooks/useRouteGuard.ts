/**
 * Route-level access guard hook.
 * Redirects users to the correct home screen if they try to access
 * a route they don't have permission for.
 * 
 * JWT-ready: when Django auth is integrated, replace the user object source
 * in AuthContext — this hook's logic does not need to change.
 */
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/lib/constants";

const PORTAL_ONLY_ROLES = ["parent"] as const;
const DASHBOARD_BLOCKED_PATHS = [
  "/students", "/staff", "/classes", "/attendance",
  "/exams", "/report-cards", "/timetable", "/term-planner",
  "/fees", "/payroll", "/reports", "/messages",
  "/settings", "/subjects", "/website-cms",
];

export function useRouteGuard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in → go to login
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const path = window.location.pathname;

    // Parent trying to access any dashboard route → redirect to portal
    if (PORTAL_ONLY_ROLES.includes(user.role as any)) {
      const isDashboardRoute = DASHBOARD_BLOCKED_PATHS.some(p => path.startsWith(p));
      if (isDashboardRoute) {
        router.replace("/portal");
        return;
      }
    }

    // Staff/admin trying to access /portal → redirect to their home
    if (!PORTAL_ONLY_ROLES.includes(user.role as any) && path.startsWith("/portal")) {
      router.replace(ROLE_HOME[user.role] ?? "/dashboard");
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);
}
