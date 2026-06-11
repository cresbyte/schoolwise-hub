/**
 * Outstanding Fees (module page).
 * @module routes/fees.outstanding
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/fees/outstanding")({
  head: () => ({ meta: [{ title: "Outstanding Fees — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Outstanding Fees" />
      <ComingSoon title="Outstanding Fees" />
    </DashboardLayout>
  ),
});
