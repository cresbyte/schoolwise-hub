/**
 * Leave Management (module page).
 * @module routes/staff.leave
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/staff/leave")({
  head: () => ({ meta: [{ title: "Leave Management — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Leave Management" />
      <ComingSoon title="Leave Management" />
    </DashboardLayout>
  ),
});
