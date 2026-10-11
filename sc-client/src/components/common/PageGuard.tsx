"use client";

/**
 * Page-level permission guard.
 * Wrap page content to show "Access Denied" when the user lacks a permission.
 * Second layer after useRouteGuard (role-level); this handles permission-level.
 */
import { Box, Typography, Button } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function PageGuard({ permission, children }) {
  const { hasPermission, user } = useAuth();
  const router = useRouter();

  if (hasPermission(permission)) return <>{children}</>;

  const isParent = user?.role === "parent";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 2,
        textAlign: "center",
      }}
    >
      <LockIcon sx={{ fontSize: 64, color: "text.disabled" }} />
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Access Denied
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
        You don't have permission to view this page.
        {isParent
          ? " Please use the Parent Portal to view your child's information."
          : " Contact your administrator if you believe this is an error."}
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" onClick={() => router.back()}>
          Go Back
        </Button>
        {isParent && (
          <Button variant="outlined" onClick={() => router.push("/portal")}>
            Go to Parent Portal
          </Button>
        )}
      </Box>
    </Box>
  );
}
