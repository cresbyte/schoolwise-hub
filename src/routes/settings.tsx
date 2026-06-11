/**
 * School Settings (module page).
 * @module routes/settings
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "School Settings — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="School Settings" />
      <ComingSoon title="School Settings" />
    </DashboardLayout>
  ),
});
