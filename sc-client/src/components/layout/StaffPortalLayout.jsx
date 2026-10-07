"use client";

import { AppBar, Toolbar, Typography, Avatar, Box, IconButton, Chip } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SchoolIcon from "@mui/icons-material/School";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function StaffPortalLayout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      {/* Top Bar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <SchoolIcon color="primary" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1 }}>
                Staff Portal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.name} · {(user?.role || "").replace("_", " ")}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
              {getInitials(user?.name || "Staff")}
            </Avatar>
            <IconButton onClick={handleLogout} size="small" title="Logout">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 3 } }}>{children}</Box>
    </Box>
  );
}
