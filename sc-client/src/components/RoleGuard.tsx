/**
 * Renders children only if the current user has the required permission/role.
 * @module RoleGuard
 */
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/types";

interface RoleGuardProps {
  permission?: string;
  roles?: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/** Conditionally render children based on RBAC. */
export function RoleGuard({ permission, roles, children, fallback = null }: RoleGuardProps) {
  const { hasPermission, hasAnyRole } = useAuth();
  const allowed =
    (permission ? hasPermission(permission) : true) && (roles ? hasAnyRole(roles) : true);
  return <>{allowed ? children : fallback}</>;
}

export default RoleGuard;