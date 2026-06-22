"use client";

/**
 * Add new class page.
 * @module classes/new/page
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
import { useStaff } from "@/hooks/domain";
import * as api from "@/lib/mockApi";
import { CURRICULUM_LABELS, GRADE_LEVELS } from "@/lib/constants";
import type { ClassRoom, GradeLevel, Curriculum } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Required"),
  gradeLevel: z.string().min(1, "Required"),
  stream: z.string().optional(),
  curriculum: z.enum(["CBC", "844"]),
  classTeacherId: z.string().optional(),
  capacity: z.coerce.number().min(1, "Must be at least 1"),
  room: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewClassPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const teachers = useStaff({ status: "active" });

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      curriculum: "CBC",
      capacity: 40,
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    const teacher = (teachers.data ?? []).find((t) => t.id === v.classTeacherId);
    const payload: ClassRoom = {
      id: "",
      name: v.name,
      gradeLevel: v.gradeLevel as GradeLevel,
      stream: v.stream,
      curriculum: v.curriculum as Curriculum,
      classTeacherId: v.classTeacherId,
      classTeacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined,
      capacity: v.capacity,
      studentCount: 0,
      room: v.room,
      academicYear: 2026,
    };
    await api.createClass(payload);
    showNotification(`Class ${v.name} created successfully`, "success");
    router.push("/classes");
  });

  return (
    <DashboardLayout>
      <PageHeader title="Add Class" subtitle="Create a new class or stream" />
      <Card component="form" onSubmit={onSubmit}>
        <CardContent>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Class Name" size="small" placeholder="e.g. Grade 1 West" error={!!errors.name} helperText={errors.name?.message} />} />
            <Controller name="gradeLevel" control={control} render={({ field }) => (
              <TextField {...field} select label="Grade Level" size="small" error={!!errors.gradeLevel} helperText={errors.gradeLevel?.message}>
                {GRADE_LEVELS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="stream" control={control} render={({ field }) => <TextField {...field} label="Stream" size="small" placeholder="e.g. West, North" />} />
            <Controller name="curriculum" control={control} render={({ field }) => (
              <TextField {...field} select label="Curriculum" size="small">
                <MenuItem value="CBC">CBC</MenuItem>
                <MenuItem value="844">8-4-4</MenuItem>
              </TextField>
            )} />
            <Controller name="classTeacherId" control={control} render={({ field }) => (
              <TextField {...field} select label="Class Teacher" size="small">
                <MenuItem value="">None</MenuItem>
                {(teachers.data ?? []).map((t) => <MenuItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="capacity" control={control} render={({ field }) => <TextField {...field} type="number" label="Capacity" size="small" error={!!errors.capacity} helperText={errors.capacity?.message} />} />
            <Controller name="room" control={control} render={({ field }) => <TextField {...field} label="Room / Building" size="small" />} />
          </Box>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => router.push("/classes")}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create Class"}</Button>
          </Box>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
