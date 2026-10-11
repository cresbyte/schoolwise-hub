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
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { userApi } from "@/lib/userApi";

export function SetPasswordDialog({ user, onClose, onSaved }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setPassword("");
      setConfirm("");
      setError("");
    }
  }, [user]);

  const handleSave = async () => {
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setBusy(true);
    try {
      await userApi.setPassword(user.id, password);
      onSaved?.();
    } catch (e) {
      setError(e.message || "Could not update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!user} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Set password</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set a new password for <strong>{user?.name}</strong>. They will use it the next time they
          log in.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            label="New password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShow((s) => !s)}>
                    {show ? (
                      <VisibilityOffIcon fontSize="small" />
                    ) : (
                      <VisibilityIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm password"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            fullWidth
          />
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
          {busy ? "Saving…" : "Set password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
