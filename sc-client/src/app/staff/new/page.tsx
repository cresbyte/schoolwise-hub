"use client";

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
import { api } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Required"),
  gender: z.enum(["Male", "Female"]),
  phone: z.string().regex(/^(07|01)\d{8}$/, "Use format 07XXXXXXXX"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  designation: z.string().min(2, "Required"),
});

type FormValues = z.infer<typeof schema>;

export default function NewStaffPage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: "Male",
      designation: "Teacher",
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await api.createStaff({
        name: v.name,
        gender: v.gender,
        phone: v.phone,
        email: v.email || undefined,
        designation: v.designation,
        status: "active",
      });
      showNotification(`Staff member ${v.name} added successfully`, "success");
      router.push("/staff");
    } catch (err: any) {
      showNotification(err.message || "Failed to create staff", "error");
    }
  });

  return (
    <DashboardLayout>
      <PageHeader title="Add Staff" subtitle="Register a new staff member" />
      <Card component="form" onSubmit={onSubmit} sx={{ maxWidth: 800, mx: "auto" }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Basic Details</Typography>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Full Name" size="small" error={!!errors.name} helperText={errors.name?.message} />} />
            <Controller name="gender" control={control} render={({ field }) => <TextField {...field} select label="Gender" size="small"><MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem></TextField>} />
            <Controller name="phone" control={control} render={({ field }) => <TextField {...field} label="Phone Number" size="small" placeholder="07XXXXXXXX" error={!!errors.phone} helperText={errors.phone?.message} />} />
            <Controller name="email" control={control} render={({ field }) => <TextField {...field} label="Email Address" size="small" error={!!errors.email} helperText={errors.email?.message} />} />
            <Controller name="designation" control={control} render={({ field }) => (
              <TextField {...field} select label="Role / Designation" size="small" error={!!errors.designation} helperText={errors.designation?.message}>
                <MenuItem value="Teacher">Teacher</MenuItem>
                <MenuItem value="Accountant">Accountant</MenuItem>
              </TextField>
            )} />
          </Box>

          <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => router.push("/staff")}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Staff Member"}</Button>
          </Box>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
