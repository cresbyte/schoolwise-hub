/**
 * Academic Reports (module page).
 * @module routes/reports.academic
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/reports/academic")({
  head: () => ({ meta: [{ title: "Academic Reports — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Academic Reports" />
      <ComingSoon title="Academic Reports" />
    </DashboardLayout>
  ),
});
