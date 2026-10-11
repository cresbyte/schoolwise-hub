"use client";

import { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import PaymentsIcon from "@mui/icons-material/Payments";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { portalApi } from "@/lib/portalApi";
import { useAuth } from "@/context/AuthContext";
import { formatKES } from "@/lib/utils";

export function InlinePayPanel({
  studentId,
  studentName,
  suggestedAmount = 0,
  chargeId = null,  // optional — if set, payment is for this specific optional charge
  onSuccess,
  onCancel,
}) {
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone || "");
  const [amount, setAmount] = useState(String(suggestedAmount || ""));
  const [phase, setPhase] = useState("form"); // form | waiting | success | failed
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (suggestedAmount) {
      setAmount(String(suggestedAmount));
    }
  }, [suggestedAmount]);

  const handleSubmit = async () => {
    setError("");
    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) {
      return setError("Please enter a valid Kenyan phone number (e.g. 0712345678).");
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return setError("Please enter a valid payment amount.");
    }

    setBusy(true);
    try {
      const payload = { studentId, phone: cleanedPhone, amount: numAmount };
      if (chargeId) payload.chargeId = chargeId;
      const result = await portalApi.initiateStkPush(payload);

      setPhase("waiting");
      setCountdown(60);
      pollStatus(result.checkoutRequestId);
    } catch (e) {
      setError(e.message || "Failed to trigger M-Pesa prompt.");
      setBusy(false);
    }
  };

  const pollStatus = async (checkoutRequestId) => {
    const startedAt = Date.now();
    const TIMEOUT_MS = 60_000;
    const INTERVAL_MS = 3_000;

    const tick = async () => {
      try {
        const status = await portalApi.checkMpesaStatus(checkoutRequestId);
        if (status.status === "success") {
          setPhase("success");
          setBusy(false);
          if (onSuccess) {
            setTimeout(onSuccess, 1800);
          }
          return;
        }
        if (status.status === "failed") {
          setError(status.resultDesc || "Payment was rejected or cancelled.");
          setPhase("failed");
          setBusy(false);
          return;
        }
      } catch {
        // Continue polling
      }

      if (Date.now() - startedAt > TIMEOUT_MS) {
        setError("Payment prompt timed out. Please check your M-Pesa and try again.");
        setPhase("failed");
        setBusy(false);
        return;
      }
      setTimeout(tick, INTERVAL_MS);
    };

    tick();
  };

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2.5,
        border: "1.5px solid",
        borderColor: "primary.main",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <PaymentsIcon />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            M-Pesa Express Checkout
          </Typography>
        </Stack>
        {onCancel && phase === "form" && (
          <Button
            size="small"
            onClick={onCancel}
            sx={{ color: "white", opacity: 0.9, textTransform: "none", minWidth: 0, p: 0.5 }}
          >
            Cancel
          </Button>
        )}
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        {/* Phase: Form Input */}
        {phase === "form" && (
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              An instant M-Pesa prompt will appear on your phone screen. Enter your PIN to complete
              the fee payment for <strong>{studentName}</strong>.
            </Typography>

            <TextField
              label="M-Pesa Phone Number"
              size="small"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX or 01XXXXXXXX"
              fullWidth
              InputProps={{
                startAdornment: (
                  <PhoneAndroidIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />
                ),
              }}
            />

            <Box>
              <TextField
                label="Amount to Pay (KES)"
                size="small"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                inputProps={{ min: 1 }}
              />

              {/* Quick amount chips */}
              {suggestedAmount > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexwrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    label={`Full: ${formatKES(suggestedAmount)}`}
                    onClick={() => setAmount(String(suggestedAmount))}
                    variant={amount === String(suggestedAmount) ? "filled" : "outlined"}
                    color="primary"
                  />
                  {suggestedAmount > 2000 && (
                    <Chip
                      size="small"
                      label={`Half: ${formatKES(Math.round(suggestedAmount / 2))}`}
                      onClick={() => setAmount(String(Math.round(suggestedAmount / 2)))}
                      variant={
                        amount === String(Math.round(suggestedAmount / 2)) ? "filled" : "outlined"
                      }
                    />
                  )}
                </Stack>
              )}
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={busy}
              onClick={handleSubmit}
              sx={{
                py: 1.5,
                fontWeight: 700,
                fontSize: "1rem",
                bgcolor: "#00a859",
                "&:hover": { bgcolor: "#008f4c" },
              }}
            >
              {busy ? "Sending Prompt..." : `Pay ${amount ? formatKES(amount) : ""} via M-Pesa`}
            </Button>
          </Stack>
        )}

        {/* Phase: Waiting for PIN */}
        {phase === "waiting" && (
          <Stack alignItems="center" spacing={2.5} sx={{ py: 3, textAlign: "center" }}>
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress size={56} sx={{ color: "#00a859" }} />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PhoneAndroidIcon sx={{ color: "#00a859" }} />
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Check Your Phone
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                An M-Pesa PIN prompt has been sent to <strong>{phone}</strong>.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Please enter your M-Pesa PIN to complete payment of{" "}
                <strong>{formatKES(amount)}</strong>.
              </Typography>
            </Box>

            <Button
              variant="text"
              color="inherit"
              size="small"
              onClick={() => {
                setPhase("form");
                setBusy(false);
              }}
              sx={{ textTransform: "none" }}
            >
              Cancel / Change Number
            </Button>
          </Stack>
        )}

        {/* Phase: Success */}
        {phase === "success" && (
          <Stack alignItems="center" spacing={2} sx={{ py: 3, textAlign: "center" }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: "success.main" }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
                Payment Received!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Thank you! Payment of {formatKES(amount)} for {studentName} has been processed and
                your statement is updated.
              </Typography>
            </Box>
          </Stack>
        )}

        {/* Phase: Failed */}
        {phase === "failed" && (
          <Stack alignItems="center" spacing={2} sx={{ py: 2, textAlign: "center" }}>
            <ErrorIcon sx={{ fontSize: 48, color: "error.main" }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>
                Payment Not Completed
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {error || "The M-Pesa transaction could not be verified."}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => {
                setPhase("form");
                setError("");
              }}
              startIcon={<ArrowBackIcon />}
            >
              Try Again
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
