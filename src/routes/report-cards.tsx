/**
 * Report Cards (module page).
 * @module routes/report-cards
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/report-cards")({
  head: () => ({ meta: [{ title: "Report Cards — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Report Cards" />
      <ComingSoon title="Report Cards" />
    </DashboardLayout>
  ),
});
