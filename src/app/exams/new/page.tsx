"use client";

/**
 * Create new examination form.
 * @module exams/new/page
 */
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { EXAM_TYPES, GRADE_LEVELS } from "@/lib/constants";
import type { Exam } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Required"),
  type: z.string().min(1, "Required"),
  term: z.coerce.number().min(1).max(3),
  year: z.coerce.number().min(2020),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().min(1, "Required"),
  gradeLevel: z.array(z.string()).min(1, "Select at least one grade"),
  outOf: z.coerce.number().min(1),
});
type FormValues = z.infer<typeof schema>;

export default function NewExamPage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "endterm",
      term: 2,
      year: 2026,
      gradeLevel: [],
      outOf: 100,
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    const payload: Exam = {
      id: "",
      name: v.name,
      type: v.type as any,
      term: v.term as any,
      year: v.year,
      startDate: v.startDate,
      endDate: v.endDate,
      gradeLevel: v.gradeLevel as any,
      outOf: v.outOf,
      status: "upcoming",
      createdBy: "Admin",
    };
    await api.createExam(payload);
    showNotification(`Exam ${v.name} created successfully`, "success");
    router.push("/exams");
  });

  return (
    <DashboardLayout>
      <PageHeader title="Create Exam" subtitle="Set up a new examination session" />
      <Card component="form" onSubmit={onSubmit}>
        <CardContent>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Exam Name" size="small" placeholder="e.g. End of Term 2 Exam" error={!!errors.name} helperText={errors.name?.message} />} />
            <Controller name="type" control={control} render={({ field }) => (
              <TextField {...field} select label="Exam Type" size="small">
                {EXAM_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="term" control={control} render={({ field }) => (
              <TextField {...field} select label="Term" size="small">
                <MenuItem value={1}>Term 1</MenuItem>
                <MenuItem value={2}>Term 2</MenuItem>
                <MenuItem value={3}>Term 3</MenuItem>
              </TextField>
            )} />
            <Controller name="year" control={control} render={({ field }) => <TextField {...field} type="number" label="Year" size="small" />} />
            <Controller name="startDate" control={control} render={({ field }) => <TextField {...field} type="date" label="Start Date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.startDate} helperText={errors.startDate?.message} />} />
            <Controller name="endDate" control={control} render={({ field }) => <TextField {...field} type="date" label="End Date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.endDate} helperText={errors.endDate?.message} />} />
            <Controller name="gradeLevel" control={control} render={({ field }) => (
              <TextField {...field} select label="Applicable Grades" size="small" slotProps={{ select: { multiple: true } }} error={!!errors.gradeLevel} helperText={errors.gradeLevel?.message}>
                {GRADE_LEVELS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="outOf" control={control} render={({ field }) => <TextField {...field} type="number" label="Max Marks (e.g. 100)" size="small" />} />
          </Box>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => router.push("/exams")}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create Exam"}</Button>
          </Box>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
