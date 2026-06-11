/**
 * Classes & Streams (module page).
 * @module routes/classes
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "Classes & Streams — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Classes & Streams" />
      <ComingSoon title="Classes & Streams" />
    </DashboardLayout>
  ),
});
