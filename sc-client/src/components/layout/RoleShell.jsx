"use client";

import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AccountsLayout } from "@/components/layout/AccountsLayout";
import { StaffLayout } from "@/components/layout/StaffLayout";

// Roles not listed fall back to DashboardLayout (admin, headteacher, deputy)
const SHELLS = {
  accountant: AccountsLayout,
  teacher: StaffLayout,
};

export function RoleShell({ children }) {
  const { user } = useAuth();
  const Shell = SHELLS[user?.role] ?? DashboardLayout;
  return <Shell>{children}</Shell>;
}
