"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import KeyIcon from "@mui/icons-material/Key";
import { userApi } from "@/lib/userApi";


export function ChangePasswordCard({ onSaved, onError }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!oldPwd) return setError("Enter your current password.");
    if (newPwd.length < 6) return setError("New password must be at least 6 characters.");
    if (newPwd !== confirm) return setError("New passwords do not match.");

    setBusy(true);
    try {
      await userApi.changeMyPassword(oldPwd, newPwd);
      setOldPwd("");
      setNewPwd("");
      setConfirm("");
      onSaved?.();
    } catch (e) {
      setError(e.message || "Could not change password.");
      onError?.(e.message || "Could not change password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ p: 4 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <KeyIcon color="primary" />
        <Typography variant="h6">Change password</Typography>
      </Stack>
      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <TextField
          label="Current password"
          type="password"
          value={oldPwd}
          onChange={(e) => setOldPwd(e.target.value)}
          fullWidth
        />
        <TextField
          label="New password"
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          fullWidth
        />
        <TextField
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          fullWidth
        />
        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} /> : null}
          >
            {busy ? "Saving…" : "Change password"}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
