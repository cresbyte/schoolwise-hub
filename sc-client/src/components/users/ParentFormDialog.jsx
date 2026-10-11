"use client";

import { useState, useEffect } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { userApi } from "@/lib/userApi";
import { studentApi } from "@/lib/studentApi";

const RELATIONSHIPS = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
];

export function ParentFormDialog({ open, mode, user, onClose, onSaved }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(empty());
  const [children, setChildren] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Load active students once per open
  useEffect(() => {
    if (!open) return;
    studentApi
      .getStudents({ status: "active" })
      .then((res) => setStudentOptions(Array.isArray(res) ? res : []))
      .catch(() => setStudentOptions([]));
  }, [open]);

  // Prefill form + children when editing
  useEffect(() => {
    if (!open) return;
    if (isEdit && user) {
      setForm({
        name: user.name ?? "",
        phone: user.phone ?? "",
        email: user.email ?? "",
        gender: user.gender ?? "",
        birthDate: user.birthDate ?? "",
        password: "",
        isActive: user.isActive ?? true,
      });
      userApi
        .getParentChildren(user.id)
        .then((res) => {
          const list = Array.isArray(res) ? res : [];
          setChildren(
            list.map((c) => ({
              studentId: c.studentId,
              studentName: c.studentName,
              relationship: c.relationship || "guardian",
            })),
          );
        })
        .catch(() => setChildren([]));
    } else {
      setForm(empty());
      setChildren([]);
    }
    setError("");
  }, [open, isEdit, user]);

  const set = (patch) => setForm((p) => ({ ...p, ...patch }));

  const addChild = (student) => {
    if (!student) return;
    if (children.some((c) => c.studentId === student.id)) return;
    setChildren((p) => [
      ...p,
      {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        relationship: "guardian",
      },
    ]);
  };

  const removeChild = (studentId) => setChildren((p) => p.filter((c) => c.studentId !== studentId));

  const setRelationship = (studentId, relationship) =>
    setChildren((p) => p.map((c) => (c.studentId === studentId ? { ...c, relationship } : c)));

  const handleSave = async () => {
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.phone.trim()) return setError("Phone is required.");
    if (!isEdit && (!form.password || form.password.length < 6)) {
      return setError("Password must be at least 6 characters.");
    }

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        role: "parent",
        gender: form.gender,
        birthDate: form.birthDate || null,
      };

      if (isEdit) {
        await userApi.update(user.id, { ...payload, isActive: form.isActive });
        await userApi.syncParentChildren(
          user.id,
          children.map((c) => ({
            studentId: c.studentId,
            relationship: c.relationship,
          })),
        );
        onSaved?.("Parent updated.");
      } else {
        const created = await userApi.create({
          ...payload,
          password: form.password,
        });
        if (children.length > 0) {
          await userApi.syncParentChildren(
            created.id,
            children.map((c) => ({
              studentId: c.studentId,
              relationship: c.relationship,
            })),
          );
        }
        onSaved?.("Parent created.");
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const linkedIds = new Set(children.map((c) => c.studentId));
  const availableStudents = studentOptions.filter((s) => !linkedIds.has(s.id));

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? `Edit ${user?.name}` : "Add parent"}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Full name"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            fullWidth
            required
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Phone (login)"
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

          {!isEdit && (
            <TextField
              label="Initial password"
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              helperText="At least 6 characters. Parents usually change this after first login."
              fullWidth
              required
            />
          )}

          {isEdit && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={form.isActive}
              onChange={(_, v) => v !== null && set({ isActive: v })}
            >
              <ToggleButton value={true}>Active</ToggleButton>
              <ToggleButton value={false}>Inactive</ToggleButton>
            </ToggleButtonGroup>
          )}

          {/* ---- Linked children ---- */}
          <Stack spacing={1} sx={{ pt: 1 }}>
            <Autocomplete
              options={availableStudents}
              value={null}
              getOptionLabel={(s) =>
                `${s.firstName} ${s.lastName} · ${s.admissionNumber ?? ""}`.trim()
              }
              onChange={(_, v) => addChild(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add child"
                  placeholder="Search by name or admission #"
                  size="small"
                />
              )}
            />

            {children.length === 0 ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                No children linked. You can link them later by editing this parent.
              </Alert>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {children.map((c) => (
                  <Stack key={c.studentId} direction="row" spacing={1} alignItems="center">
                    <Chip label={c.studentName} sx={{ flex: 1, justifyContent: "flex-start" }} />
                    <Select
                      size="small"
                      value={c.relationship}
                      onChange={(e) => setRelationship(c.studentId, e.target.value)}
                      sx={{ minWidth: 120 }}
                    >
                      {RELATIONSHIPS.map((r) => (
                        <MenuItem key={r.value} value={r.value}>
                          {r.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <IconButton size="small" onClick={() => removeChild(c.studentId)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
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
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create parent"}
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
    gender: "",
    birthDate: "",
    password: "",
    isActive: true,
  };
}
