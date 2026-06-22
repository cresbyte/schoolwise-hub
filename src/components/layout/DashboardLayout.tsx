/**
 * Main authenticated layout: collapsible sidebar + top AppBar.
 * Redirects unauthenticated users to /login.
 * @module DashboardLayout
 */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <Box
        sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const width = open ? FULL : RAIL;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="inherit"
        className="no-print"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => setOpen((o) => !o)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <SchoolIcon sx={{ color: "primary.main", mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
            Shule
            <Box component="span" sx={{ color: "secondary.main" }}>
              Smart
            </Box>
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Chip
            label="Term 2, 2026"
            color="primary"
            variant="outlined"
            size="small"
            sx={{ mr: 1, fontWeight: 600 }}
          />
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
            <MenuItem onClick={() => { setAnchor(null); router.push("/profile"); }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>{" "}
              Profile
            </MenuItem>
            <MenuItem onClick={() => setAnchor(null)}>
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>{" "}
              Change Password
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>{" "}
              Logout
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
                  <Typography component="div" className="sidebar-section-label">
                    {group.heading}
                  </Typography>
                )}
                {items.map((item) => {
                  const active =
                    pathname === item.to ||
                    (item.to !== "/dashboard" && pathname.startsWith(item.to));
                  const btn = (
                    <ListItemButton
                      key={item.to}
                      component={Link}
                      href={item.to}
                      selected={active}
                      sx={{
                        minHeight: 44,
                        justifyContent: open ? "flex-start" : "center",
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: open ? 38 : 0, justifyContent: "center" }}>
                        {item.icon}
                      </ListItemIcon>
                      {open && (
                        <ListItemText
                          primary={item.label}
                          slotProps={{ primary: { sx: { fontWeight: 600, fontSize: 14 } } }}
                        />
                      )}
                    </ListItemButton>
                  );
                  return open ? (
                    btn
                  ) : (
                    <Tooltip key={item.to} title={item.label} placement="right">
                      {btn}
                    </Tooltip>
                  );
                })}
              </List>
            );
          })}
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, width: `calc(100% - ${width}px)` }}>
        <Toolbar className="no-print" />
        <Box className="system-page">{children}</Box>
      </Box>
    </Box>
  );
}

export default DashboardLayout;
