"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { portalApi } from "@/lib/portalApi";
import { useAuth } from "@/context/AuthContext";

export function PayNowDialog({
  open,
  onClose,
  studentId,
  studentName,
  suggestedAmount,
  onSuccess,
}) {
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone || "");
  const [amount, setAmount] = useState(String(suggestedAmount || ""));
  const [phase, setPhase] = useState("form"); // form | waiting | success | failed
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleReset = () => {
    setPhase("form");
    setError("");
    setAmount(String(suggestedAmount || ""));
  };

  const handleSubmit = async () => {
    setError("");
    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) {
      return setError("Enter a valid Kenyan phone number.");
    }
    if (!amount || Number(amount) <= 0) {
      return setError("Enter a valid amount.");
    }

    setBusy(true);
    try {
      const result = await portalApi.initiateStkPush({
        studentId,
        phone: cleanedPhone,
        amount: Number(amount),
      });

      setPhase("waiting");
      pollStatus(result.checkoutRequestId);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const pollStatus = async (checkoutRequestId) => {
    const startedAt = Date.now();
    const TIMEOUT_MS = 90_000;
    const INTERVAL_MS = 3_000;

    const tick = async () => {
      try {
        const status = await portalApi.checkMpesaStatus(checkoutRequestId);
        if (status.status === "success") {
          setPhase("success");
          setBusy(false);
          if (onSuccess) setTimeout(onSuccess, 1500);
          return;
        }
        if (status.status === "failed") {
          setError(status.resultDesc || "Payment failed.");
          setPhase("failed");
          setBusy(false);
          return;
        }
      } catch {
        // Ignore network errors during polling
      }

      if (Date.now() - startedAt > TIMEOUT_MS) {
        setError("Payment timed out. Please check your M-Pesa messages and try again.");
        setPhase("failed");
        setBusy(false);
        return;
      }
      setTimeout(tick, INTERVAL_MS);
    };

    tick();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (busy || phase === "waiting") return;
        handleReset();
        onClose();
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Pay school fees</DialogTitle>
      <DialogContent>
        {phase === "form" && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              An M-Pesa prompt will be sent to the phone number below. Enter your PIN to complete
              the payment.
            </Typography>
            <TextField
              label="M-Pesa phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX"
              fullWidth
              autoFocus
            />
            <TextField
              label="Amount (KES)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            {studentName && (
              <Alert severity="info">
                Paying for <strong>{studentName}</strong>
              </Alert>
            )}
          </Stack>
        )}

        {phase === "waiting" && (
          <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Check your phone
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              We sent an M-Pesa prompt to {phone}. Enter your PIN to complete the payment.
            </Typography>
          </Stack>
        )}

        {phase === "success" && (
          <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
            <Typography variant="h6">Payment received</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Thank you. The balance has been updated.
            </Typography>
          </Stack>
        )}

        {phase === "failed" && (
          <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
            <ErrorIcon color="error" sx={{ fontSize: 56 }} />
            <Typography variant="h6">Payment failed</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {error}
            </Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {phase === "form" && (
          <>
            <Button onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={busy}>
              {busy ? "Sending…" : "Send M-Pesa request"}
            </Button>
          </>
        )}
        {phase === "waiting" && (
          <Button onClick={onClose} disabled>
            Waiting for confirmation…
          </Button>
        )}
        {phase === "success" && (
          <Button variant="contained" onClick={onClose}>
            Done
          </Button>
        )}
        {phase === "failed" && (
          <>
            <Button onClick={onClose}>Close</Button>
            <Button variant="contained" onClick={handleReset}>
              Try again
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
