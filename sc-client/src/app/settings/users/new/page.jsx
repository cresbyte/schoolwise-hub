"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Card, CardContent, MenuItem, TextField, Typography
} from "@mui/material";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useNotification } from "@/context/NotificationContext";
import api from "@/services/axios";

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "headteacher", label: "Headteacher" },
  { value: "class_teacher", label: "Class Teacher" },
  { value: "accountant", label: "Accountant" },
  { value: "parent", label: "Parent" },
];

export default function NewUserPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "class_teacher",
    password: "",
  });

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2) errs.name = "Required (min 2 chars)";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
    if (!form.phone || !/^(07|01)\d{8}$/.test(form.phone)) errs.phone = "Use format 07XXXXXXXX";
    if (!form.password || form.password.length < 6) errs.password = "At least 6 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.post("auth/users/", form);
      showNotification(`User ${form.name} created successfully`, "success");
      router.push("/settings/users");
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        // Map DRF field errors back to form
        setErrors(Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
        ));
      } else {
        showNotification("Failed to create user", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Add User" subtitle="Create a new system user account" />
      <Card component="form" onSubmit={handleSubmit} sx={{ maxWidth: 700 }}>
        <CardContent>
          <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField
              label="Full Name"
              size="small"
              value={form.name}
              onChange={set("name")}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
            <TextField
              label="Email Address"
              size="small"
              type="email"
              value={form.email}
              onChange={set("email")}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              label="Phone Number"
              size="small"
              value={form.phone}
              onChange={set("phone")}
              error={!!errors.phone}
              helperText={errors.phone ?? "07XXXXXXXX or 01XXXXXXXX"}
              required
            />
            <TextField
              label="System Role"
              select
              size="small"
              value={form.role}
              onChange={set("role")}
            >
              {ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Initial Password"
              type="password"
              size="small"
              value={form.password}
              onChange={set("password")}
              error={!!errors.password}
              helperText={errors.password ?? "Min 6 characters"}
              required
            />
          </Box>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => router.push("/settings/users")}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Creating…" : "Create User"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
