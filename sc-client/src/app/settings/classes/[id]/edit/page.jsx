"use client";

/**
 * Edit class page.
 * @module classes/[id]/edit/page
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
import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useStaff } from "@/hooks/domain";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { GRADE_LEVELS } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(2, "Required"),
  gradeLevel: z.string().min(1, "Required"),
  stream: z.string().optional(),
  curriculum: z.enum(["CBC", "844"]),
  classTeacherId: z.coerce.string().optional(),
  capacity: z.coerce.number().min(1, "Must be at least 1"),
  room: z.string().optional(),
});

export default function EditClassPage() {
  const params = useParams();
  const id = params.id;
  const cls = useAsync(() => api.getClassById(id), [id]);

  return (
    <>
      <PageHeader title="Edit Class" subtitle={cls.data ? `Updating ${cls.data.name}` : "Updating class information"} />
      <DataState loading={cls.loading} error={cls.error} data={cls.data} onRetry={cls.refetch}>
        {(c) => <EditClassForm cls={c} />}
      </DataState>
    </>
  );
}

function EditClassForm({ cls }) {
  const router = useRouter();
  const { showNotification } = useNotification();
  const teachers = useStaff({ status: "active" });
  const classesRes = useAsync(api.getClasses);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      stream: cls.stream || "",
      curriculum: cls.curriculum,
      classTeacherId: cls.classTeacherId || "",
      capacity: cls.capacity,
      room: cls.room || "",
    },
  });

  const assignedClassMap = (classesRes.data || [])
    .filter(c => c.id !== cls.id && c.classTeacherId)
    .reduce((acc, c) => ({ ...acc, [c.classTeacherId]: c.name }), {});

  const onSubmit = handleSubmit(async (v) => {
    const teacher = (teachers.data ?? []).find((t) => t.id === v.classTeacherId);
    const payload = {
      name: v.name,
      gradeLevel: v.gradeLevel,
      stream: v.stream,
      curriculum: v.curriculum,
      classTeacherId: v.classTeacherId || null,
      classTeacherName: teacher ? teacher.name : undefined,
      capacity: v.capacity,
      room: v.room,
    };
    await api.updateClass(cls.id, payload);
    showNotification(`Class ${v.name} updated successfully`, "success");
    router.push("/settings/classes");
  });

  return (
    <Card component="form" onSubmit={onSubmit}>
      <CardContent>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Class Name" size="small" error={!!errors.name} helperText={errors.name?.message} />} />
          <Controller name="gradeLevel" control={control} render={({ field }) => (
            <TextField {...field} select label="Grade Level" size="small" error={!!errors.gradeLevel} helperText={errors.gradeLevel?.message}>
              {GRADE_LEVELS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          )} />
          <Controller name="stream" control={control} render={({ field }) => <TextField {...field} label="Stream" size="small" />} />
          <Controller name="curriculum" control={control} render={({ field }) => (
            <TextField {...field} select label="Curriculum" size="small">
              <MenuItem value="CBC">CBC</MenuItem>
              <MenuItem value="844">8-4-4</MenuItem>
            </TextField>
          )} />
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
          <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Changes"}</Button>
        </Box>
      </CardContent>
    </Card>
  );
}
