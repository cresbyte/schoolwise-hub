/**
 * Parent portal layout: simple top navbar, no sidebar.
 * @module PortalLayout
 */
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import LogoutIcon from "@mui/icons-material/Logout";
import Badge from "@mui/material/Badge";
import MailIcon from "@mui/icons-material/Mail";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { getInitials } from "@/lib/utils";
import { school } from "@/lib/mockData";

/** Layout shell for the parent portal. */
export function PortalLayout({ children }: { children: ReactNode }) {
   const { user, isAuthenticated, isLoading, logout } = useAuth();
   const router = useRouter();
 
   const studentId = user?.studentId || "std-1";
   const { data: messagesRes = [] } = useAsync(() => api.getMessages({ studentId }), [studentId]);
   const messages = messagesRes || [];
   // In a real app, unread count would come from a different endpoint or filter
   const unreadCount = messages.length > 0 ? 1 : 0; 

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <Box
        sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" className="no-print">
        <Toolbar>
          <Box>
            <Logo size={32} />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 6, display: "block", mt: -0.5 }}>
              {school.name}
            </Typography>
          </Box>
           <Box sx={{ flexGrow: 1 }} />
           <Badge badgeContent={unreadCount} color="error" variant="dot" sx={{ mr: 2 }}>
             <MailIcon color="action" />
           </Badge>
           <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main", fontSize: 13, mr: 1 }}>
             {getInitials(user.name)}
           </Avatar>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, mr: 2, display: { xs: "none", sm: "block" } }}
          >
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
