/**
 * Attendance (module page).
 * @module routes/attendance
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Attendance" />
      <ComingSoon title="Attendance" />
    </DashboardLayout>
  ),
});
