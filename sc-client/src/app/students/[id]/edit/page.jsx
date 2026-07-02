"use client";

/**
 * Edit student information wizard.
 * @module students/[id]/edit/page
 */
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useClasses, useStudent } from "@/hooks/domain";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";

const schema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  otherName: z.string().optional(),
  gender: z.enum(["Male", "Female"]),
  dateOfBirth: z.string().min(1, "Required"),
  birthCertNumber: z.string().optional(),
  homeLocation: z.string().min(2, "Required"),
  classId: z.string().min(1, "Select a class"),
  boardingStatus: z.enum(["day", "boarding", "part_boarding"]),
  admissionDate: z.string().min(1, "Required"),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  primaryContactName: z.string().min(2, "Required"),
  primaryContactPhone: z.string().regex(/^(07|01)\d{8}$/, "Use format 07XXXXXXXX"),
});

const STEPS = ["Bio Data", "Class & Boarding", "Parent / Guardian"];
const STEP_FIELDS = [
  ["firstName", "lastName", "otherName", "gender", "dateOfBirth", "birthCertNumber", "homeLocation"],
  ["classId", "boardingStatus", "admissionDate"],
  ["fatherName", "motherName", "primaryContactName", "primaryContactPhone"],
];

export default function EditStudentPage() {
  const params = useParams();
  const id = params.id;
  const { data: student, loading, error, refetch } = useStudent(id);

  return (
    <DashboardLayout>
      <PageHeader title="Edit Student" subtitle={student ? `Updating ${student.firstName} ${student.lastName}` : "Updating student information"} />
      <DataState loading={loading} error={error} data={student} onRetry={refetch}>
        {(s) => <EditWizard student={s} />}
      </DataState>
    </DashboardLayout>
  );
}

/** Edit wizard form content. */
function EditWizard({ student }) {
  const router = useRouter();
  const { showNotification } = useNotification();
  const classes = useClasses();
  const [step, setStep] = useState(0);

  const { control, handleSubmit, trigger, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      firstName: student.firstName,
      lastName: student.lastName,
      otherName: student.otherName || "",
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      birthCertNumber: student.birthCertNumber || "",
      homeLocation: student.homeLocation,
      classId: student.classId,
      boardingStatus: student.boardingStatus,
      admissionDate: student.admissionDate,
      fatherName: student.parent?.fatherName || "",
      motherName: student.parent?.motherName || "",
      primaryContactName: student.parent?.primaryContactName || "",
      primaryContactPhone: student.parent?.primaryContactPhone || "",
    },
  });

  const next = async () => {
    if (await trigger(STEP_FIELDS[step])) setStep((s) => s + 1);
  };

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
    <Card component="form" onSubmit={onSubmit}>
      <CardContent>
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
        </Stepper>

        {step === 0 && (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Controller name="firstName" control={control} render={({ field }) => <TextField {...field} label="First Name" size="small" error={!!errors.firstName} helperText={errors.firstName?.message} />} />
            <Controller name="lastName" control={control} render={({ field }) => <TextField {...field} label="Last Name" size="small" error={!!errors.lastName} helperText={errors.lastName?.message} />} />
            <Controller name="otherName" control={control} render={({ field }) => <TextField {...field} label="Other Name" size="small" />} />
            <Controller name="gender" control={control} render={({ field }) => <TextField {...field} select label="Gender" size="small"><MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem></TextField>} />
            <Controller name="dateOfBirth" control={control} render={({ field }) => <TextField {...field} type="date" label="Date of Birth" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message} />} />
            <Controller name="birthCertNumber" control={control} render={({ field }) => <TextField {...field} label="Birth Cert. Number" size="small" />} />
            <Controller name="homeLocation" control={control} render={({ field }) => <TextField {...field} label="Home Location" size="small" error={!!errors.homeLocation} helperText={errors.homeLocation?.message} />} />
          </Box>
        )}

        {step === 1 && (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Controller name="classId" control={control} render={({ field }) => (
              <TextField {...field} select label="Class" size="small" error={!!errors.classId} helperText={errors.classId?.message}>
                {(classes.data ?? []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="boardingStatus" control={control} render={({ field }) => (
              <TextField {...field} select label="Boarding Status" size="small">
                <MenuItem value="day">Day Scholar</MenuItem>
                <MenuItem value="boarding">Boarder</MenuItem>
                <MenuItem value="part_boarding">Part Boarding</MenuItem>
              </TextField>
            )} />
            <Controller name="admissionDate" control={control} render={({ field }) => <TextField {...field} type="date" label="Admission Date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.admissionDate} helperText={errors.admissionDate?.message} />} />
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Controller name="fatherName" control={control} render={({ field }) => <TextField {...field} label="Father's Name" size="small" />} />
            <Controller name="motherName" control={control} render={({ field }) => <TextField {...field} label="Mother's Name" size="small" />} />
            <Controller name="primaryContactName" control={control} render={({ field }) => <TextField {...field} label="Primary Contact Name" size="small" error={!!errors.primaryContactName} helperText={errors.primaryContactName?.message} />} />
            <Controller name="primaryContactPhone" control={control} render={({ field }) => <TextField {...field} label="Primary Contact Phone" size="small" placeholder="0712345678" error={!!errors.primaryContactPhone} helperText={errors.primaryContactPhone?.message} />} />
          </Box>
        )}

        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
          <Button onClick={() => (step === 0 ? router.push(`/students/${student.id}`) : setStep((s) => s - 1))}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="contained" onClick={next}>Next</Button>
          ) : (
            <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Changes"}</Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
