"use client";

/**
 * Add new subject page.
 * @module subjects/new/page
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
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { GRADE_LEVELS } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(2, "Required"),
  code: z.string().min(2, "Required"),
  curriculum: z.enum(["CBC", "844"]),
  gradeLevel: z.array(z.string()).min(1, "Select at least one grade"),
  isCore: z.boolean(),
  learningArea: z.string().optional(),
});

export default function NewSubjectPage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      curriculum: "CBC",
      gradeLevel: [],
      isCore: true,
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    const payload = {
      name: v.name,
      code: v.code,
      curriculum: v.curriculum,
      grade_levels: v.gradeLevel,
      gradeLevel: v.gradeLevel,
      is_core: v.isCore,
      isCore: v.isCore,
      learning_area: v.learningArea || "",
      learningArea: v.learningArea || "",
      grading_system: [],
      gradingSystem: [],
    };
    await api.createSubject(payload);
    showNotification(`Subject ${v.name} added successfully`, "success");
    router.push("/subjects");
  });

  return (
    <DashboardLayout>
      <PageHeader title="Add Subject" subtitle="Register a new learning area or subject" />
      <Card component="form" onSubmit={onSubmit}>
        <CardContent>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Subject Name" size="small" error={!!errors.name} helperText={errors.name?.message} />} />
            <Controller name="code" control={control} render={({ field }) => <TextField {...field} label="Subject Code" size="small" error={!!errors.code} helperText={errors.code?.message} />} />
            <Controller name="curriculum" control={control} render={({ field }) => (
              <TextField {...field} select label="Curriculum" size="small">
                <MenuItem value="CBC">CBC</MenuItem>
                <MenuItem value="844">8-4-4</MenuItem>
              </TextField>
            )} />
            <Controller name="learningArea" control={control} render={({ field }) => <TextField {...field} label="Learning Area / Category" size="small" placeholder="e.g. Sciences, Languages" />} />
            <Controller name="gradeLevel" control={control} render={({ field }) => (
              <TextField {...field} select label="Applicable Grades" size="small" slotProps={{ select: { multiple: true } }} error={!!errors.gradeLevel} helperText={errors.gradeLevel?.message}>
                {GRADE_LEVELS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            )} />
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Controller name="isCore" control={control} render={({ field }) => (
                <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="Core / Compulsory Subject" />
              )} />
            </Box>
          </Box>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => router.push("/subjects")}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Adding…" : "Add Subject"}</Button>
          </Box>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
