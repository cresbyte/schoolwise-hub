/**
 * Audit Trail (module page).
 * @module routes/reports.audit
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/reports/audit")({
  head: () => ({ meta: [{ title: "Audit Trail — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Audit Trail" />
      <ComingSoon title="Audit Trail" />
    </DashboardLayout>
  ),
});
