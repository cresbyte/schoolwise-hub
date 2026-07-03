"use client";

/**
 * Student admission form using unified reusable fields.
 * @module students/new/page
 */
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useNotification } from "@/context/NotificationContext";
import { useClasses } from "@/hooks/domain";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { studentSchema, StudentFormFields } from "@/components/forms/StudentFormFields";

export default function NewStudentPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Add Student" subtitle="Register a new student" />
      <AdmissionForm />
    </DashboardLayout>
  );
}

function AdmissionForm() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const classes = useClasses();

  const methods = useForm({
    resolver: zodResolver(studentSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "", lastName: "", otherName: "", gender: "Male", dateOfBirth: "", birthCertNumber: "",
      homeLocation: "", classId: "", boardingStatus: "day", admissionDate: new Date().toISOString().slice(0, 10),
      fatherName: "", motherName: "", primaryContactName: "", primaryContactPhone: "", photo: ""
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
      gradeLevel: cls?.gradeLevel ?? "Grade 1",
      curriculum: cls?.curriculum ?? "CBC",
      admissionDate: v.admissionDate,
      status: "active",
      homeLocation: v.homeLocation,
      boardingStatus: v.boardingStatus,
      feeBalance: 0,
      photo: v.photo,
      parent: {
        fatherName: v.fatherName,
        motherName: v.motherName,
        primaryContactName: v.primaryContactName,
        primaryContactPhone: v.primaryContactPhone,
      }
    };
    await api.createStudent(payload);
    showNotification(`${v.firstName} ${v.lastName} admitted successfully`, "success");
    router.push("/students");
  });

  return (
    <Card>
      <CardContent>
        <FormProvider {...methods}>
          <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <StudentFormFields classesData={classes.data ?? []} />
            
            <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Button onClick={() => router.push("/students")}>
                Cancel
              </Button>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  An admission number will be generated automatically.
                </Typography>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? "Admitting…" : "Admit Student"}
                </Button>
              </Box>
            </Box>
          </Box>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
