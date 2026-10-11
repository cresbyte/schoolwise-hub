"use client";

import {
  Avatar, Box, Card, Chip, Divider, Stack, Typography,
} from "@mui/material";
import { ROLE_COLOR, ROLE_LABEL } from "@/lib/userApi";

export function StaffProfileView({ user }) {
  if (!user) return null;

  const initials = (user.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card sx={{ p: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={3}
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Avatar
          sx={{ width: 88, height: 88, fontSize: 32 }}
          src={user.photoUrl || undefined}
        >
          {!user.photoUrl && initials}
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {user.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              label={ROLE_LABEL[user.role] ?? user.role}
              color={ROLE_COLOR[user.role] ?? "default"}
              size="small"
            />
            <Chip
              label={user.isActive ? "Active" : "Inactive"}
              color={user.isActive ? "success" : "default"}
              size="small"
              variant={user.isActive ? "filled" : "outlined"}
            />
          </Stack>
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Stack spacing={2}>
        <Field label="Phone" value={user.phone} />
        <Field label="Email" value={user.email} />
        <Field label="Gender" value={user.gender} />
        <Field label="Date of birth" value={user.birthDate} />
        <Field label="Staff number" value={user.staffNumber} />
        <Field label="Designation" value={user.designation} />
        <Field
          label="Last login"
          value={
            user.lastLogin
              ? new Date(user.lastLogin).toLocaleString()
              : "Never"
          }
        />
        <Field
          label="Added"
          value={
            user.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : "—"
          }
        />
      </Stack>
    </Card>
  );
}

function Field({ label, value }) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
}
