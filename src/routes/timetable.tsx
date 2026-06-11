/**
 * Timetable (module page).
 * @module routes/timetable
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/timetable")({
  head: () => ({ meta: [{ title: "Timetable — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Timetable" />
      <ComingSoon title="Timetable" />
    </DashboardLayout>
  ),
});
