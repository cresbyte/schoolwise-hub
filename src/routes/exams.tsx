/**
 * Examinations (module page).
 * @module routes/exams
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/exams")({
  head: () => ({ meta: [{ title: "Examinations — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Examinations" />
      <ComingSoon title="Examinations" />
    </DashboardLayout>
  ),
});
