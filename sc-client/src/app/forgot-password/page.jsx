"use client";

import { useAuth } from "@/context/AuthContext";
import { Alert, Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MAROON = "#95191c";
const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState("request"); // "request" | "reset" | "done"
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Counts down the "Resend code" wait
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const cleanPhone = phone.replace(/[\s-]/g, "");

  const sendCode = async () => {
    setError("");
    setBusy(true);
    const result = await requestPasswordReset(cleanPhone);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return false;
    }
    setCooldown(RESEND_SECONDS);
    return true;
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!cleanPhone) return setError("Enter your phone number");
    if (await sendCode()) setStep("reset");
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return setError("Enter the 6-digit code from your email");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("The two passwords don't match");

    setError("");
    setBusy(true);
    const result = await confirmPasswordReset(cleanPhone, code, password);
    setBusy(false);
    if (result.success) setStep("done");
    else setError(result.error);
  };

  const submitSx = {
    minHeight: 48,
    textTransform: "none",
    fontWeight: 600,
    bgcolor: MAROON,
    boxShadow: "none",
    "&:hover": { bgcolor: "#7a1215", boxShadow: "none" },
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f5",
        borderTop: `4px solid ${MAROON}`,
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          bgcolor: "#fff",
          borderRadius: 2,
          p: { xs: 3, sm: 4 },
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)",
        }}
      >
        <Typography component="h1" sx={{ fontWeight: 800, fontSize: "1.5rem", mb: 1 }}>
          Reset password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ my: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {step === "request" && (
          <form onSubmit={handleRequest} noValidate>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your phone number. We&apos;ll email a 6-digit code to the address on your
              account.
            </Typography>
            <TextField
              label="Phone number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              autoFocus
              sx={{ mb: 3 }}
              slotProps={{ htmlInput: { inputMode: "tel", autoComplete: "username" } }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={busy} sx={submitSx}>
              {busy ? <CircularProgress size={20} color="inherit" /> : "Send code"}
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset} noValidate>
            <Alert severity="info" sx={{ my: 2 }}>
              If that account has an email on file, we&apos;ve sent a 6-digit code. It expires in 5
              minutes. If nothing arrives, check spam or ask the school office.
            </Alert>
            <TextField
              label="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              fullWidth
              autoFocus
              sx={{ mb: 2 }}
              slotProps={{ htmlInput: { inputMode: "numeric", autoComplete: "one-time-code" } }}
            />
            <TextField
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="At least 8 characters"
              fullWidth
              sx={{ mb: 2 }}
              slotProps={{ htmlInput: { autoComplete: "new-password" } }}
            />
            <TextField
              label="Confirm new password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              fullWidth
              sx={{ mb: 3 }}
              slotProps={{ htmlInput: { autoComplete: "new-password" } }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={busy} sx={submitSx}>
              {busy ? <CircularProgress size={20} color="inherit" /> : "Set new password"}
            </Button>
            <Button
              fullWidth
              color="inherit"
              disabled={busy || cooldown > 0}
              onClick={sendCode}
              sx={{ mt: 1.5, textTransform: "none" }}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </Button>
          </form>
        )}

        {step === "done" && (
          <>
            <Alert severity="success" sx={{ my: 2 }}>
              Your password has been updated. You&apos;ve been signed out of other devices.
            </Alert>
            <Button
              variant="contained"
              fullWidth
              onClick={() => router.replace("/login")}
              sx={submitSx}
            >
              Go to login
            </Button>
          </>
        )}

        {step !== "done" && (
          <Typography sx={{ mt: 3, fontSize: "0.85rem" }}>
            <Box
              component={Link}
              href="/login"
              sx={{ color: MAROON, fontWeight: 600, textDecoration: "none" }}
            >
              Back to login
            </Box>
          </Typography>
        )}
      </Box>
    </Box>
  );
}
