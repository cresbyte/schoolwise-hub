/**
 * Main authenticated layout: collapsible sidebar + top AppBar.
 * Redirects unauthenticated users to /login.
 * @module DashboardLayout
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import LockResetIcon from "@mui/icons-material/LockReset";
import SchoolIcon from "@mui/icons-material/School";
import { useAuth } from "@/context/AuthContext";
import { NAV_GROUPS } from "./navConfig";
import { NotificationBell } from "./NotificationBell";
import { getInitials } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";

const FULL = 248;
const RAIL = 68;

/** Authenticated app shell with sidebar and app bar. */
export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(true);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const width = open ? FULL : RAIL;

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="inherit"
        className="no-print"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: "#fff" }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => setOpen((o) => !o)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <SchoolIcon sx={{ color: "primary.main", mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
            Schule<span style={{ color: "#F57F17" }}>Smart</span>
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label="Term 2, 2024" color="primary" variant="outlined" size="small" sx={{ mr: 1, fontWeight: 600 }} />
          <NotificationBell />
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1, cursor: "pointer" }}
            onClick={(e) => setAnchor(e.currentTarget)}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 14 }}>
              {getInitials(user.name)}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" }, lineHeight: 1.1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ROLE_LABELS[user.role]}
              </Typography>
            </Box>
          </Box>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
            <MenuItem onClick={() => setAnchor(null)}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon> Profile
            </MenuItem>
            <MenuItem onClick={() => setAnchor(null)}>
              <ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon> Change Password
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        className="no-print"
        sx={{
          width,
          flexShrink: 0,
          whiteSpace: "nowrap",
          "& .MuiDrawer-paper": {
            width,
            overflowX: "hidden",
            transition: "width .2s",
            borderRight: "1px solid #e6e9ef",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflowY: "auto", py: 1 }}>
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((i) => !i.permission || hasPermission(i.permission));
            if (!items.length) return null;
            return (
              <List key={group.heading} dense sx={{ px: 1 }}>
                {open && (
                  <Typography
                    variant="caption"
                    sx={{ px: 1.5, color: "text.secondary", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}
                  >
                    {group.heading}
                  </Typography>
                )}
                {items.map((item) => {
                  const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                  const btn = (
                    <ListItemButton
                      key={item.to}
                      component={Link}
                      to={item.to}
                      selected={active}
                      sx={{
                        borderRadius: 2,
                        mb: 0.25,
                        minHeight: 44,
                        justifyContent: open ? "flex-start" : "center",
                        "&.Mui-selected": { bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" } },
                        "&.Mui-selected .MuiListItemIcon-root": { color: "#fff" },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: open ? 38 : 0, justifyContent: "center" }}>{item.icon}</ListItemIcon>
                      {open && <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600, fontSize: 14 } } }} />}
                    </ListItemButton>
                  );
                  return open ? btn : <Tooltip key={item.to} title={item.label} placement="right">{btn}</Tooltip>;
                })}
              </List>
            );
          })}
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, width: `calc(100% - ${width}px)` }}>
        <Toolbar className="no-print" />
        <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}

export default DashboardLayout;