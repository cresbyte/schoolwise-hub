"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import LockResetIcon from "@mui/icons-material/LockReset";
import { api } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";

export function ResetPasswordButton({ staff }) {
  const { showNotification } = useNotification();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleReset = async () => {
    setBusy(true);
    try {
      const res = await api.resetStaffPassword(staff.id);
      setTempPassword(res.temporaryPassword);
      setConfirmOpen(false);
    } catch {
      showNotification("Could not reset password", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Tooltip title="Reset password">
        <IconButton size="small" onClick={() => setConfirmOpen(true)}>
          <LockResetIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Reset password?</DialogTitle>
        <DialogContent>
          <Typography>
            This will replace {staff.name}'s current password with a new temporary one.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReset} disabled={busy}>
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!tempPassword} onClose={() => setTempPassword(null)}>
        <DialogTitle>Temporary password</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Share this with {staff.name} now. It won't be shown again.
          </Alert>
          <Typography variant="h5" sx={{ fontFamily: "monospace", textAlign: "center" }}>
            {tempPassword}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigator.clipboard.writeText(tempPassword)}>Copy</Button>
          <Button variant="contained" onClick={() => setTempPassword(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
