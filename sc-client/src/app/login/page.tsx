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
import Collapse from "@mui/material/Collapse";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InfoIcon from "@mui/icons-material/Info";
import { Logo } from "@/components/common/Logo";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
  const [showHelp, setShowHelp] = useState(false);
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
        alignItems: "center",
        justifyContent: "center",
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

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              color: "primary.main",
            }}
            onClick={() => setShowHelp((s) => !s)}
          >
            <InfoIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
              Sample credentials
            </Typography>
            <ExpandMoreIcon
              sx={{ transform: showHelp ? "rotate(180deg)" : "none", transition: ".2s" }}
            />
          </Box>
          <Collapse in={showHelp}>
            <Stack spacing={0.5} sx={{ mt: 1.5, bgcolor: "#1565C00A", p: 1.5, borderRadius: 2 }}>
              {SAMPLES.map(([role, phone, pwd]) => (
                <Box
                  key={role}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    py: 0.4,
                    "&:hover": { color: "primary.main" },
                  }}
                  onClick={() => {
                    setValue("phone", phone);
                    setValue("password", pwd);
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {role}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                    {phone} / {pwd}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
}
