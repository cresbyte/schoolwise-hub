"use client";

/**
 * Edit student information form using shared layout.
 * @module students/[id]/edit/page
 */
import { DataState } from "@/components/DataState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useNotification } from "@/context/NotificationContext";
import { useClasses, useStudent } from "@/hooks/domain";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useParams, useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { studentSchema, StudentFormFields } from "@/components/forms/StudentFormFields";

export default function EditStudentPage() {
  const params = useParams();
  const id = params.id;
  const { data: student, loading, error, refetch } = useStudent(id);

  return (
    <DashboardLayout>
      <PageHeader title="Edit Student" subtitle={student ? `Updating ${student.firstName} ${student.lastName}` : "Updating student information"} />
      <DataState loading={loading} error={error} data={student} onRetry={refetch}>
        {(s) => <EditForm student={s} />}
      </DataState>
    </DashboardLayout>
  );
}

/** Edit form content. */
function EditForm({ student }) {
  const router = useRouter();
  const { showNotification } = useNotification();
  const classes = useClasses();

  const methods = useForm({
    resolver: zodResolver(studentSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: student.firstName,
      lastName: student.lastName,
      otherName: student.otherName || "",
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      birthCertNumber: student.birthCertNumber || "",
      homeLocation: student.homeLocation || "",
      classId: student.classId,
      boardingStatus: student.boardingStatus,
      admissionDate: student.admissionDate,
      fatherName: student.parent?.fatherName || "",
      motherName: student.parent?.motherName || "",
      primaryContactName: student.parent?.primaryContactName || "",
      primaryContactPhone: student.parent?.primaryContactPhone || "",
      photo: student.photo || "",
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async (v) => {
    const cls = (classes.data ?? []).find((c) => c.id === v.classId);
    const payload = {
      firstName: v.firstName,
      lastName: v.lastName,
      otherName: v.otherName,
      gender: v.gender,
      dateOfBirth: v.dateOfBirth,
      birthCertNumber: v.birthCertNumber,
      classId: v.classId,
      className: cls?.name ?? student.className,
      gradeLevel: cls?.gradeLevel ?? student.gradeLevel,
      curriculum: cls?.curriculum ?? student.curriculum,
      admissionDate: v.admissionDate,
      homeLocation: v.homeLocation,
      boardingStatus: v.boardingStatus,
      photo: v.photo,
      parent: {
        ...student.parent,
        fatherName: v.fatherName,
        motherName: v.motherName,
        primaryContactName: v.primaryContactName,
        primaryContactPhone: v.primaryContactPhone,
      },
    };
    await api.updateStudent(student.id, payload);
    showNotification(`Student information updated successfully`, "success");
    router.push(`/students/${student.id}`);
  });

  return (
    <Card>
      <CardContent>
        <FormProvider {...methods}>
          <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <StudentFormFields classesData={classes.data ?? []} />
            
            <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
              <Button onClick={() => router.push(`/students/${student.id}`)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </Box>
          </Box>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
