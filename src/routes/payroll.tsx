/**
 * Payroll (module page).
 * @module routes/payroll
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/payroll")({
  head: () => ({ meta: [{ title: "Payroll — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Payroll" />
      <ComingSoon title="Payroll" />
    </DashboardLayout>
  ),
});
