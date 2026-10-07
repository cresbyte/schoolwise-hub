"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/lib/constants";

const FONT = "'Outfit', sans-serif";
const MAROON = "#95191c";
const MAROON_DARK = "#7a1215";
const INK = "#0f1932";

const schema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Enter your 10-digit phone number")
    .regex(/^[+\d\s-]+$/, "Phone number can only contain digits"),
  password: z.string().min(1, "Enter your password"),
});

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1.5,
    bgcolor: "#fff",
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: MAROON,
      borderWidth: 1.5,
    },
  },
  // 16px stops iOS Safari from zooming in when an input is focused
  "& input": { fontSize: 16, py: 1.5 },
};

function Label({ htmlFor, children, action }) {
  return (
    <Box
      sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.75 }}
    >
      <Typography
        component="label"
        htmlFor={htmlFor}
        sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#444" }}
      >
        {children}
      </Typography>
      {action}
    </Box>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", password: "" },
  });

  const goHome = (role) => router.replace(ROLE_HOME[role] ?? "/dashboard");

  // Already signed in: go straight to the role's home page.
  useEffect(() => {
    if (isAuthenticated && user) goHome(user.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const onSubmit = async ({ phone, password }) => {
    setError("");
    try {
      const result = await login(phone.replace(/[\s-]/g, ""), password, { remember: true });
      if (result.success) {
        goHome(result.user?.role);
      } else {
        setError(result.error ?? "We couldn't sign you in. Check your phone number and password.");
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    }
  };

  const submitting = formState.isSubmitting;

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f5",
        borderTop: `4px solid ${MAROON}`,
        px: 2,
        py: 4,
        pb: "max(32px, env(safe-area-inset-bottom))",
        "& .MuiTypography-root, & .MuiInputBase-root, & .MuiButton-root, & .MuiFormHelperText-root, & .MuiAlert-root":
          { fontFamily: FONT },
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Logo size={52} withText={false} />
      </Box>

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
        <Typography
          component="h1"
          sx={{ fontWeight: 800, fontSize: "1.5rem", color: INK, mb: 3, letterSpacing: 0.3 }}
        >
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Box sx={{ mb: 2.5 }}>
            <Label htmlFor="phone">Phone Number</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  fullWidth
                  autoFocus
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={fieldSx}
                  slotProps={{ htmlInput: { inputMode: "tel", autoComplete: "username" } }}
                />
              )}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Label
              htmlFor="password"
              action={
                <Box
                  component={Link}
                  href="/forgot-password"
                  sx={{
                    fontSize: "0.8rem",
                    color: "text.secondary",
                    textDecoration: "none",
                    "&:hover": { color: MAROON, textDecoration: "underline" },
                  }}
                >
                  Forgot?
                </Box>
              }
            >
              Password
            </Label>
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={fieldSx}
                  slotProps={{
                    htmlInput: { autoComplete: "current-password" },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPwd((s) => !s)}
                            edge="end"
                            size="small"
                            aria-label={showPwd ? "Hide password" : "Show password"}
                          >
                            {showPwd ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              minHeight: 48,
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
              boxShadow: "none",
              bgcolor: MAROON,
              "&:hover": { bgcolor: MAROON_DARK, boxShadow: "none" },
              "&.Mui-disabled": { bgcolor: "#d9c5c6", color: "#fff" },
            }}
          >
            {submitting ? "Signing in…" : "Login"}
          </Button>
        </form>

        <Typography sx={{ mt: 3, fontSize: "0.85rem", color: "#555", lineHeight: 1.6 }}>
          Need an account?
          <br />
          Contact the school office to get your login details.
        </Typography>
      </Box>

      <Typography sx={{ mt: 3, fontSize: "0.85rem" }}>
        <Box
          component={Link}
          href="/"
          sx={{
            color: MAROON,
            fontWeight: 600,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Back to website
        </Box>
      </Typography>
    </Box>
  );
}
