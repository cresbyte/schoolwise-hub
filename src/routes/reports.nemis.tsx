/**
 * NEMIS Export (module page).
 * @module routes/reports.nemis
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/reports/nemis")({
  head: () => ({ meta: [{ title: "NEMIS Export — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="NEMIS Export" />
      <ComingSoon title="NEMIS Export" />
    </DashboardLayout>
  ),
});
