/**
 * Staff (module page).
 * @module routes/staff
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Staff — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Staff" />
      <ComingSoon title="Staff" />
    </DashboardLayout>
  ),
});
