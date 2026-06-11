/**
 * Fee Structures (module page).
 * @module routes/fees.structures
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/fees/structures")({
  head: () => ({ meta: [{ title: "Fee Structures — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Fee Structures" />
      <ComingSoon title="Fee Structures" />
    </DashboardLayout>
  ),
});
