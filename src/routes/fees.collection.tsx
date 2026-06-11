/**
 * Fee Collection (module page).
 * @module routes/fees.collection
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/fees/collection")({
  head: () => ({ meta: [{ title: "Fee Collection — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Fee Collection" />
      <ComingSoon title="Fee Collection" />
    </DashboardLayout>
  ),
});
