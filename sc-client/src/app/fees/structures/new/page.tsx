"use client";

/**
 * Add new fee structure.
 * @module fees/structures/new/page
 */
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Divider from "@mui/material/Divider";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { GRADE_LEVELS } from "@/lib/constants";
import type { FeeStructure, FeeItem } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Required"),
  academicYear: z.coerce.number().min(2020),
  term: z.coerce.number().min(1).max(3),
  gradeLevel: z.string().min(1, "Required"),
  boardingStatus: z.enum(["day", "boarding", "part_boarding", "all"]),
  dueDate: z.string().min(1, "Required"),
  items: z.array(z.object({
    name: z.string().min(1, "Required"),
    amount: z.coerce.number().min(0),
    isOptional: z.boolean(),
  })).min(1, "Add at least one fee item"),
});
type FormValues = z.infer<typeof schema>;

export default function NewFeeStructurePage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const { control, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      academicYear: 2026,
      term: 1,
      boardingStatus: "all",
      items: [{ name: "Tuition Fee", amount: 0, isOptional: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items") || [];
  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const onSubmit = handleSubmit(async (v) => {
    const payload: FeeStructure = {
      id: "",
      name: v.name,
      academicYear: v.academicYear,
      term: v.term as any,
      gradeLevel: v.gradeLevel as any,
      boardingStatus: v.boardingStatus as any,
      items: v.items.map((it, idx) => ({ ...it, id: String(idx + 1) })),
      totalAmount: total,
      dueDate: v.dueDate,
      status: "active",
    };
    await api.createFeeStructure(payload);
    showNotification(`Fee structure ${v.name} created successfully`, "success");
    router.push("/fees/structures");
  });

  return (
    <DashboardLayout>
      <PageHeader title="Add Fee Structure" subtitle="Define fees for a term and grade" />
      <Card component="form" onSubmit={onSubmit}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Basic Info</Typography>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" } }}>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Structure Name" size="small" placeholder="T1 2026 Grade 1" error={!!errors.name} helperText={errors.name?.message} />} />
            <Controller name="gradeLevel" control={control} render={({ field }) => (
              <TextField {...field} select label="Grade Level" size="small" error={!!errors.gradeLevel} helperText={errors.gradeLevel?.message}>
                {GRADE_LEVELS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="boardingStatus" control={control} render={({ field }) => (
              <TextField {...field} select label="Boarding Status" size="small">
                <MenuItem value="all">All Students</MenuItem>
                <MenuItem value="day">Day Scholars Only</MenuItem>
                <MenuItem value="boarding">Boarders Only</MenuItem>
              </TextField>
            )} />
            <Controller name="term" control={control} render={({ field }) => (
              <TextField {...field} select label="Term" size="small">
                <MenuItem value={1}>Term 1</MenuItem>
                <MenuItem value={2}>Term 2</MenuItem>
                <MenuItem value={3}>Term 3</MenuItem>
              </TextField>
            )} />
            <Controller name="academicYear" control={control} render={({ field }) => <TextField {...field} type="number" label="Year" size="small" />} />
            <Controller name="dueDate" control={control} render={({ field }) => <TextField {...field} type="date" label="Due Date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.dueDate} helperText={errors.dueDate?.message} />} />
          </Box>

          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Fee Items</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => append({ name: "", amount: 0, isOptional: false })}>Add Item</Button>
          </Box>

          {fields.map((field, index) => (
            <Box key={field.id} sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 150px 50px", alignItems: "center", mb: 1.5 }}>
              <Controller name={`items.${index}.name`} control={control} render={({ field }) => <TextField {...field} label="Item Name" size="small" />} />
              <Controller name={`items.${index}.amount`} control={control} render={({ field }) => <TextField {...field} type="number" label="Amount" size="small" />} />
              <IconButton color="error" onClick={() => remove(index)} disabled={fields.length === 1}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          ))}

          <Box sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total: KES {total.toLocaleString()}</Typography>
          </Box>

          <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => router.push("/fees/structures")}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create Structure"}</Button>
          </Box>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
