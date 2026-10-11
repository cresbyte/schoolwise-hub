"use client";

import { useState, useEffect } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { userApi, DESIGNATIONS } from "@/lib/userApi";

const STAFF_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "headteacher", label: "Head Teacher" },
  { value: "deputy", label: "Deputy Principal" },
  { value: "hod", label: "Head of Department" },
  { value: "class_teacher", label: "Class Teacher" },
  { value: "teacher", label: "Teacher" },
  { value: "accountant", label: "Accountant" },
  { value: "staff", label: "Staff" },
];

const OTHER = "Other";

export function StaffFormDialog({ open, mode, user, onClose, onSaved }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(empty());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (isEdit && user) {
      // If the stored designation isn't in our list, treat it as "Other"
      // and prefill the custom text field with the legacy value.
      const known = DESIGNATIONS.some((d) => d.value === user.designation);
      const isOther = user.designation && !known;

      setForm({
        name: user.name ?? "",
        phone: user.phone ?? "",
        email: user.email ?? "",
        role: user.role ?? "teacher",
        gender: user.gender ?? "",
        birthDate: user.birthDate ?? "",
        staffNumber: user.staffNumber ?? "",
        designation: isOther ? OTHER : (user.designation ?? ""),
        customDesignation: isOther ? user.designation : "",
        password: "",
        isActive: user.isActive ?? true,
      });
    } else {
      setForm(empty());
    }
    setError("");
  }, [open, isEdit, user]);

  const set = (patch) => setForm((p) => ({ ...p, ...patch }));

  const resolveDesignation = () => {
    if (form.designation === OTHER) {
      return form.customDesignation?.trim() || OTHER;
    }
    return form.designation || "";
  };

  const handleSave = async () => {
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.phone.trim()) return setError("Phone is required.");
    if (!isEdit && (!form.password || form.password.length < 6)) {
      return setError("Password must be at least 6 characters.");
    }
    if (form.designation === OTHER && !form.customDesignation?.trim()) {
      return setError("Enter a custom designation or pick another option.");
    }

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        role: form.role,
        gender: form.gender,
        birthDate: form.birthDate || null,
        staffNumber: form.staffNumber || "",
        designation: resolveDesignation(),
      };

      if (isEdit) {
        await userApi.update(user.id, { ...payload, isActive: form.isActive });
        onSaved?.("Staff member updated.");
      } else {
        await userApi.create({ ...payload, password: form.password });
        onSaved?.("Staff member created.");
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  // Show any legacy designation as its own option so it renders in the select
  const designationOptions = [...DESIGNATIONS];
  if (
    form.designation &&
    form.designation !== OTHER &&
    !DESIGNATIONS.some((d) => d.value === form.designation)
  ) {
    designationOptions.push({
      value: form.designation,
      label: `${form.designation} (legacy)`,
    });
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? `Edit ${user?.name}` : "Add staff member"}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2} sx={{ pt: 1 }}>
          {/* 1. Name */}
          <TextField
            label="Full name"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            fullWidth
            required
          />

          {/* 2 & 3. Phone + Email */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="2547XXXXXXXX"
              fullWidth
              required
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
              type="email"
              fullWidth
            />
          </Stack>

          {/* 4 & 5. Role + Designation */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={form.role}
                label="Role"
                onChange={(e) => set({ role: e.target.value })}
              >
                {STAFF_ROLES.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Designation</InputLabel>
              <Select
                value={form.designation}
                label="Designation"
                onChange={(e) => set({ designation: e.target.value })}
              >
                <MenuItem value="">—</MenuItem>
                {designationOptions.map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Custom designation when "Other" is picked */}
          {form.designation === OTHER && (
            <TextField
              label="Custom designation"
              value={form.customDesignation}
              onChange={(e) => set({ customDesignation: e.target.value })}
              helperText="Type the exact title to store"
              fullWidth
              required
            />
          )}

          {/* 6 & 7. Gender + DOB */}
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

          {/* 8. Staff number (read-only on edit) */}
          <TextField
            label="Staff number"
            value={form.staffNumber}
            onChange={(e) => set({ staffNumber: e.target.value })}
            disabled={isEdit}
            helperText={
              isEdit ? "Cannot be changed after creation" : "Leave blank to auto-generate"
            }
            fullWidth
          />

          {/* 9. Password (create only) */}
          {!isEdit && (
            <TextField
              label="Initial password"
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              helperText="At least 6 characters."
              fullWidth
              required
            />
          )}

          {/* 10. Active toggle (edit only) */}
          {isEdit && (
            <Stack direction="row" alignItems="center" spacing={2}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={form.isActive}
                onChange={(_, v) => v !== null && set({ isActive: v })}
              >
                <ToggleButton value={true}>Active</ToggleButton>
                <ToggleButton value={false}>Inactive</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} /> : null}
        >
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function empty() {
  return {
    name: "",
    phone: "",
    email: "",
    role: "teacher",
    gender: "",
    birthDate: "",
    staffNumber: "",
    designation: "",
    customDesignation: "",
    password: "",
    isActive: true,
  };
}
