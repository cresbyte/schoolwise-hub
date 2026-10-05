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

import { PageHeader } from "@/components/PageHeader";
import { useNotification } from "@/context/NotificationContext";
import { useStaff } from "@/hooks/domain";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { CURRICULUM_LABELS, GRADE_LEVELS } from "@/lib/constants";

const schema = z.object({
  gradeLevel: z.string().min(1, "Required"),
  stream: z.string().optional(),
  classTeacherId: z.coerce.string().optional(),
  capacity: z.coerce.number().min(1, "Must be at least 1"),
  room: z.string().optional(),
});

export default function NewClassPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const teachers = useStaff({ status: "active" });
  const classesRes = useAsync(api.getClasses);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      capacity: 40,
    },
  });

  const assignedClassMap = (classesRes.data || [])
    .filter(c => c.classTeacherId)
    .reduce((acc, c) => ({ ...acc, [c.classTeacherId]: c.name }), {});

  const onSubmit = handleSubmit(async (v) => {
    const teacher = (teachers.data ?? []).find((t) => t.id === v.classTeacherId);
    const payload = {
      gradeLevel: v.gradeLevel,
      stream: v.stream,
      classTeacherId: v.classTeacherId || null,
      classTeacherName: teacher ? teacher.name : undefined,
      capacity: v.capacity,
      studentCount: 0,
      room: v.room,
      academicYear: 2026,
    };
    await api.createClass(payload);
    showNotification(`Class created successfully`, "success");
    router.push("/settings/classes");
  });

  return (
    <>
      <PageHeader title="Add Stream" subtitle="Create a new stream" />
      <Card component="form" onSubmit={onSubmit}>
        <CardContent>
          <Box sx={{ display: "grid", gap: 2, }}>
            <Controller name="gradeLevel" control={control} render={({ field }) => (
              <TextField {...field} select label="Grade Level" size="small" error={!!errors.gradeLevel} helperText={errors.gradeLevel?.message}>
                {GRADE_LEVELS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="stream" control={control} render={({ field }) => <TextField {...field} label="Stream" size="small" placeholder="e.g. West, North" />} />
            <Controller name="classTeacherId" control={control} render={({ field }) => (
              <TextField {...field} select label="Class Teacher" size="small">
                <MenuItem value="">None</MenuItem>
                {(teachers.data ?? []).map((t) => (
                  <MenuItem
                    key={t.id}
                    value={t.id}
                    disabled={!!assignedClassMap[t.id]}
                  >
                    {t.name} {assignedClassMap[t.id] ? `(${assignedClassMap[t.id]})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            )} />
            <Controller name="capacity" control={control} render={({ field }) => <TextField {...field} type="number" label="Capacity" size="small" error={!!errors.capacity} helperText={errors.capacity?.message} />} />
            <Controller name="room" control={control} render={({ field }) => <TextField {...field} label="Room / Building" size="small" />} />
          </Box>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => router.push("/settings/classes")}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create Class"}</Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
