/**
 * User Management (module page).
 * @module routes/settings.users
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/settings/users")({
  head: () => ({ meta: [{ title: "User Management — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="User Management" />
      <ComingSoon title="User Management" />
    </DashboardLayout>
  ),
});
