"use client";

/**
 * Edit student page.
 * @module students/[id]/edit/page
 */
import { DataState } from "@/components/DataState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StudentForm } from "../../new/StudentForm";
import { useNotification } from "@/context/NotificationContext";
import { useStudent } from "@/hooks/domain";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

export default function EditStudentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { data: student, loading, error, refetch } = useStudent(id);

  async function saveChanges(data) {
    await api.updateStudent(id, data);
    showNotification("Student information updated successfully", "success");
    router.push(`/students/${id}`);
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Student"
        subtitle={
          student
            ? `Updating ${student.firstName} ${student.lastName}`
            : "Updating student information"
        }
      />
      <DataState loading={loading} error={error} data={student} onRetry={refetch}>
        {(s) => (
          <StudentForm
            student={s}
            onSave={saveChanges}
            submitLabel="Save Changes"
            cancelPath={`/students/${id}`}
          />
        )}
      </DataState>
    </DashboardLayout>
  );
}
