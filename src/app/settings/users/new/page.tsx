"use client";

/**
 * Add new system user.
 * @module settings/users/new/page
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
import type { User, UserRole } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^(07|01)\d{8}$/, "Use format 07XXXXXXXX"),
  role: z.enum(["admin", "headteacher", "class_teacher", "accountant", "parent"]),
  password: z.string().min(6, "At least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function NewUserPage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "class_teacher",
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    // In a real app, we'd handle password separately
    const payload: User = {
      id: "",
      name: v.name,
      email: v.email,
      phone: v.phone,
      role: v.role as UserRole,
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await api.createUser(payload);
    showNotification(`User ${v.name} created successfully`, "success");
    router.push("/settings/users");
  });

  return (
    <DashboardLayout>
      <PageHeader title="Add User" subtitle="Create a new system user account" />
      <Card component="form" onSubmit={onSubmit}>
        <CardContent>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Full Name" size="small" error={!!errors.name} helperText={errors.name?.message} />} />
            <Controller name="email" control={control} render={({ field }) => <TextField {...field} label="Email Address" size="small" error={!!errors.email} helperText={errors.email?.message} />} />
            <Controller name="phone" control={control} render={({ field }) => <TextField {...field} label="Phone Number" size="small" error={!!errors.phone} helperText={errors.phone?.message} />} />
            <Controller name="role" control={control} render={({ field }) => (
              <TextField {...field} select label="System Role" size="small">
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="headteacher">Headteacher</MenuItem>
                <MenuItem value="class_teacher">Class Teacher</MenuItem>
                <MenuItem value="accountant">Accountant</MenuItem>
                <MenuItem value="parent">Parent</MenuItem>
              </TextField>
            )} />
            <Controller name="password" control={control} render={({ field }) => <TextField {...field} type="password" label="Initial Password" size="small" error={!!errors.password} helperText={errors.password?.message} />} />
          </Box>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => router.push("/settings/users")}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create User"}</Button>
          </Box>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
