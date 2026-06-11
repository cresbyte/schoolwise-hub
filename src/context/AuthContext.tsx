/**
 * Authentication context with mock localStorage-backed session and RBAC.
 * @module AuthContext
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User, UserRole } from "@/lib/types";
import { PERMISSIONS } from "@/lib/constants";
import * as api from "@/lib/mockApi";

const STORAGE_KEY = "schulesmart_user";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Provides authentication state and role-based permission helpers. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      /* ignore */
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const { user: u } = await api.login(phone, password);
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      const perms = PERMISSIONS[user.role];
      if (perms.includes("*")) return true;
      if (perms.includes(permission)) return true;
      const [module] = permission.split(".");
      return perms.includes(`${module}.*`);
    },
    [user],
  );

  const hasRole = useCallback((role: UserRole) => user?.role === role, [user]);
  const hasAnyRole = useCallback((roles: UserRole[]) => !!user && roles.includes(user.role), [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasPermission,
      hasRole,
      hasAnyRole,
    }),
    [user, isLoading, login, logout, hasPermission, hasRole, hasAnyRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the authentication context. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}