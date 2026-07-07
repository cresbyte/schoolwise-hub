"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/lib/constants";

const schema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

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

  const { register, handleSubmit, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated && user) router.push(ROLE_HOME[user.role]);
  }, [isAuthenticated, user, router]);

  const onSubmit = async (values: FormValues) => {
    setError("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (login as any)(values.phone, values.password);
    if (result.success) {
      const role = result.user?.role;
      router.push(role ? (ROLE_HOME[role as keyof typeof ROLE_HOME] ?? "/dashboard") : "/dashboard");
    } else {
      setError(result.error ?? "Login failed");
    }
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
        backgroundImage:
          'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("/images/Main Banner Image.jpeg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={1} sx={{ alignItems: "center", mb: 3 }}>
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
              <TextField
                label="Phone Number"
                placeholder="07xx xxx xxx"
                fullWidth
                {...register("phone")}
                error={!!formState.errors.phone}
                helperText={formState.errors.phone?.message}
              />
              <TextField
                label="Password"
                type={showPwd ? "text" : "password"}
                fullWidth
                {...register("password")}
                error={!!formState.errors.password}
                helperText={formState.errors.password?.message}
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

      {/* Demo credentials footer — sits below the card, blends into the bg */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 2,
          bgcolor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          px: 2,
          py: 1.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.38)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            display: "block",
            mb: 0.75,
          }}
        >
          Demo credentials — click to fill
        </Typography>
        <Stack spacing={0.2}>
          {SAMPLES.map(([role, phone, pwd]) => (
            <Box
              key={role}
              onClick={() => {
                setValue("phone", phone);
                setValue("password", pwd);
              }}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                borderRadius: 1,
                px: 0.75,
                py: 0.3,
                transition: "background .15s",
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.65)", fontWeight: 700, minWidth: 90 }}
              >
                {role}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.38)", fontFamily: "monospace" }}
              >
                {phone} / {pwd}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
