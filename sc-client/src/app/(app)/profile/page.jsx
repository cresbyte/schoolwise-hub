"use client";

import { PageHeader } from "@/components/PageHeader";
import { ChangePasswordCard } from "@/components/users/ChangePasswordCard";
import { useAuth } from "@/context/AuthContext";
import { ROLE_COLOR, ROLE_LABEL, userApi } from "@/lib/userApi";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user } = useAuth();

  const content = (
    <>
      <PageHeader title="My profile" subtitle="View and update your account details." />
      <ProfileContent />
    </>
  );

  return <>{content}</>;
}

export function ProfileContent() {
  const { user: authUser, refreshUser } = useAuth();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const notify = (message, severity = "success") => setSnack({ open: true, message, severity });

  // Load the fuller profile from the API (the JWT payload is minimal)
  useEffect(() => {
    userApi.me().then((me) => {
      setForm({
        name: me.name ?? "",
        email: me.email ?? "",
        gender: me.gender ?? "",
        birthDate: me.birthDate ?? "",
        photo: null,
      });
    });
  }, []);

  if (!form) return <CircularProgress />;

  const set = (patch) => setForm((p) => ({ ...p, ...patch }));

  const handleSave = async () => {
    setBusy(true);
    try {
      await userApi.updateMe({
        name: form.name.trim(),
        email: form.email.trim() || null,
        gender: form.gender,
        birthDate: form.birthDate || null,
      });
      notify("Profile updated.");
      refreshUser?.();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const initials = form.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Avatar sx={{ width: 88, height: 88, fontSize: 32 }} src={authUser?.photo || undefined}>
            {!authUser?.photo && initials}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {form.name || "Unnamed"}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                label={ROLE_LABEL[authUser?.role] ?? authUser?.role}
                color={ROLE_COLOR[authUser?.role] ?? "default"}
                size="small"
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Login: {authUser?.phone}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <TextField
            label="Full name"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            type="email"
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={form.gender}
                label="Gender"
                onChange={(e) => set({ gender: e.target.value })}
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Date of birth"
              type="date"
              value={form.birthDate ?? ""}
              onChange={(e) => set({ birthDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>

          <Alert severity="info" sx={{ mt: 1 }}>
            To change your phone number (your login), contact an administrator.
          </Alert>

          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={busy ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={busy}
            >
              {busy ? "Saving…" : "Save profile"}
            </Button>
          </Stack>
        </Stack>
      </Card>

      <ChangePasswordCard
        onSaved={() => notify("Password changed.")}
        onError={(m) => notify(m, "error")}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
