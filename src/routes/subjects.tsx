/**
 * Subjects (module page).
 * @module routes/subjects
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/subjects")({
  head: () => ({ meta: [{ title: "Subjects — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Subjects" />
      <ComingSoon title="Subjects" />
    </DashboardLayout>
  ),
});
