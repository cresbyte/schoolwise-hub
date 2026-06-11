/**
 * Parent portal layout: simple top navbar, no sidebar.
 * @module PortalLayout
 */
import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import SchoolIcon from "@mui/icons-material/School";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/utils";
import { school } from "@/lib/mockData";

/** Layout shell for the parent portal. */
export function PortalLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !user) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" className="no-print">
        <Toolbar>
          <SchoolIcon sx={{ color: "primary.main", mr: 1 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1.1 }}>
              Schule
              <Box component="span" sx={{ color: "secondary.main" }}>
                Smart
              </Box>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {school.name}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main", fontSize: 13, mr: 1 }}>
            {getInitials(user.name)}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600, mr: 2, display: { xs: "none", sm: "block" } }}>
            {user.name}
          </Typography>
          <Button startIcon={<LogoutIcon />} onClick={handleLogout} size="small">
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 3 } }}>{children}</Box>
    </Box>
  );
}

export default PortalLayout;
