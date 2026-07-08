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
  Link,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/lib/constants";

const schema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(1, "Password is required"),
});

const SAMPLES = [
  ["Admin", "0712345678", "admin123"],
  ["Headteacher", "0711234567", "head123"],
  ["Teacher", "0722345678", "teacher123"],
  ["Accountant", "0733456789", "accounts123"],
  ["Parent", "0744567890", "parent123"],
];

/** Full-page centered login. */
export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);

  const { control, handleSubmit, setValue, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleHome = ROLE_HOME[user.role];
      if (roleHome) {
        router.push(roleHome);
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
      router.push(role ? (ROLE_HOME[role] ?? "/dashboard") : "/dashboard");
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  // Fill both fields as real, controlled updates so labels shrink correctly
  const fillSample = (phone, pwd) => {
    setValue("phone", phone, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue("password", pwd, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        p: 2,
        pb: 6, // leave room for the fixed demo footer
        backgroundImage:
          'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("/images/Main Banner Image.jpeg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={1} sx={{ alignItems: "center", mb: 3, textAlign: "center" }}>
            <Logo size={64} withText={false} />
            <Logo size={0} withText={true} textStyle={{ fontSize: "1.75rem" }} />
            <Typography variant="body2" color="text.secondary">
              School Management System · Sign in
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
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

              {/* Remember me + Forgot password row */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">Remember me</Typography>}
                />
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  underline="hover"
                  onClick={() => router.push("/forgot-password")}
                >
                  Forgot password?
                </Link>
              </Stack>

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
              >
                {formState.isSubmitting ? "Signing in…" : "Sign In"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

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
