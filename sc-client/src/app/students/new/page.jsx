"use client";

/**
 * Student admission page.
 * @module students/new/page
 */
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StudentForm } from "./StudentForm";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function NewStudentPage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  async function admitStudent(data) {
    await api.createStudent({
      ...data,
      status: "active",
      feeBalance: 0,
      boardingStatus: "day", // day school for now
    });
    showNotification(`${data.firstName} ${data.lastName} admitted successfully`, "success");
    router.push("/students");
  }

  return (
    <DashboardLayout>
      <PageHeader title="Add Student" subtitle="Register a new student" />
      <StudentForm onSave={admitStudent} submitLabel="Admit Student" cancelPath="/students" />
    </DashboardLayout>
  );
}
