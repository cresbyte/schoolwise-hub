"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Stack,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Chip,
  Divider,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SchoolIcon from "@mui/icons-material/School";
import AssessmentIcon from "@mui/icons-material/Assessment";
import MessageIcon from "@mui/icons-material/Message";
import PaymentsIcon from "@mui/icons-material/Payments";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const schema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(1, "Password is required"),
});

const FEATURES = [
  { icon: <AssessmentIcon sx={{ fontSize: 20 }} />, text: "View report cards & grades" },
  { icon: <SchoolIcon sx={{ fontSize: 20 }} />, text: "Track attendance records" },
  { icon: <PaymentsIcon sx={{ fontSize: 20 }} />, text: "Check fee balances & payments" },
  { icon: <MessageIcon sx={{ fontSize: 20 }} />, text: "Communicate with teachers" },
];

const SAMPLES = [
  ["Admin", "0712345678", "admin123"],
  ["Headteacher", "0711234567", "head123"],
  ["Teacher", "0722345678", "teacher123"],
  ["Accountant", "0733456789", "accounts123"],
  ["Parent", "0744567890", "parent123"],
];

/** Dedicated parent portal login page. */
export default function ParentPortalPage() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);

  const { control, handleSubmit, setValue, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", password: "" },
  });

  const fillSample = (phone, pwd) => {
    setValue("phone", phone, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue("password", pwd, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "parent") {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = async (values) => {
    setError("");
    const result = await login(values.phone, values.password, { remember });
    if (result.success) {
      const role = result.user?.role;
      router.push(role === "parent" ? "/portal" : "/dashboard");
    } else {
      setError(result.error ?? "Login failed. Please check your credentials.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Left Panel — Branding ───────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          width: "45%",
          flexShrink: 0,
          position: "relative",
          backgroundImage:
            'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.6) 100%), url("/hero/image2.webp")',
          backgroundSize: "cover",
          backgroundPosition: "center top",
          px: 7,
          py: 8,
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.06)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.05)",
          }}
        />

        {/* Logo + name */}
        <Box sx={{ mb: 6 }}>
          <Logo size={52} withText={false} />
        </Box>

        <Typography
          sx={{
            color: "#fff",
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: "2.1rem",
            lineHeight: 1.15,
            mb: 1.5,
          }}
        >
          Parent Portal
        </Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.78)",
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1rem",
            lineHeight: 1.6,
            mb: 4,
            maxWidth: 360,
          }}
        >
          Stay connected with your child's academic journey — grades, fees, attendance and communication all in one place.
        </Typography>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", mb: 3.5 }} />

        <Stack spacing={2}>
          {FEATURES.map((f, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  borderRadius: "10px",
                }}
              >
                {f.icon}
              </Box>
              <Typography
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.92rem",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {f.text}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Staff portal link */}
        <Box sx={{ mt: "auto", pt: 5 }}>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.55)",
              fontFamily: "'Outfit', sans-serif",
              fontSize: "0.8rem",
            }}
          >
            Are you a staff member?{" "}
            <Box
              component={Link}
              href="/staff-portal"
              sx={{
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Go to Staff Portal →
            </Box>
          </Typography>
        </Box>
      </Box>

      {/* ── Right Panel — Login Form ─────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f0faf6",
          backgroundImage:
            "radial-gradient(ellipse at 80% 20%, rgba(0,160,120,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(0,130,100,0.06) 0%, transparent 60%)",
          px: { xs: 3, sm: 6, lg: 8 },
          py: 6,
          minHeight: "100vh",
        }}
      >
        {/* Mobile logo */}
        <Box
          sx={{
            display: { lg: "none" },
            mb: 4,
            textAlign: "center",
          }}
        >
          <Logo size={48} withText={true} textStyle={{ fontSize: "1.4rem" }} />
          <Chip
            label="Parent Portal"
            size="small"
            icon={<FamilyRestroomIcon sx={{ fontSize: 14 }} />}
            sx={{
              mt: 1.5,
              bgcolor: "#005a46",
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              "& .MuiChip-icon": { color: "#fff" },
            }}
          />
        </Box>

        <Card
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 440,
            borderRadius: 4,
            border: "1px solid rgba(0,160,120,0.15)",
            boxShadow: "0 8px 40px rgba(0,130,100,0.1)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={0.5} sx={{ mb: 3.5 }}>
              <Typography
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.45rem",
                  color: "#005a46",
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontFamily: "'Outfit', sans-serif" }}
              >
                Sign in with your registered phone number to access your child's information.
              </Typography>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2.5}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Phone Number"
                      placeholder="07xx xxx xxx"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      InputLabelProps={{ shrink: !!field.value || undefined }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#008264",
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#008264",
                        },
                      }}
                    />
                  )}
                />
                <Controller
                  name="password"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Password"
                      type={showPwd ? "text" : "password"}
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      InputLabelProps={{ shrink: !!field.value || undefined }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#008264",
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#008264",
                        },
                      }}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPwd((s) => !s)} edge="end">
                                {showPwd ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      sx={{
                        "&.Mui-checked": { color: "#008264" },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontFamily: "'Outfit', sans-serif" }}>
                      Keep me signed in
                    </Typography>
                  }
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={formState.isSubmitting}
                  startIcon={
                    formState.isSubmitting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : undefined
                  }
                  sx={{
                    bgcolor: "#005a46",
                    py: 1.4,
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": { bgcolor: "#004536" },
                    "&:disabled": { bgcolor: "#aaa" },
                  }}
                >
                  {formState.isSubmitting ? "Signing in…" : "Sign In to Parent Portal"}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {/* Back link */}
        <Typography
          sx={{
            mt: 3,
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.85rem",
            color: "text.secondary",
          }}
        >
          <Box
            component={Link}
            href="/"
            sx={{
              color: "#005a46",
              fontWeight: 600,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            ← Back to website
          </Box>
        </Typography>
      </Box>

      {/* ============================================================
          TEMP: Demo credentials footer — remove this whole Box when
          demo login shortcuts are no longer needed.
         ============================================================ */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 28,
          bgcolor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          px: 2,
          overflowX: "auto",
          whiteSpace: "nowrap",
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        {SAMPLES.map(([role, phone, pwd]) => (
          <Typography
            key={role}
            variant="caption"
            onClick={() => fillSample(phone, pwd)}
            sx={{
              cursor: "pointer",
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.68rem",
              lineHeight: 1,
              "&:hover": { color: "rgba(255,255,255,0.8)" },
            }}
          >
            {role}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
