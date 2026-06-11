/**
 * Add student page (placeholder stepper).
 * @module routes/students.new
 */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/students/new")({
  head: () => ({ meta: [{ title: "Add Student — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <PageHeader title="Add Student" subtitle="Register a new student" />
      <ComingSoon title="Student Admission Wizard" />
    </DashboardLayout>
  ),
});