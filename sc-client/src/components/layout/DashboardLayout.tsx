"use client";

/**
 * Admin / staff shell: top bar + collapsible sidebar.
 * Pages render inside <main>; they never include a layout themselves.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar, Avatar, Box, Chip, CircularProgress, Collapse, Divider, Drawer,
  IconButton, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem,
  Toolbar, Tooltip, Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import LockResetIcon from "@mui/icons-material/LockReset";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { ROLE_LABELS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { schoolApi } from "@/lib/schoolApi";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { NAV_GROUPS } from "./navConfig";
import { NotificationBell } from "./NotificationBell";

const FULL = 248;
const RAIL = 68;
const STORAGE_KEY = "sidebar_collapsed"; // { [heading]: boolean } where true = expanded

const isItemActive = (pathname, to, exact) =>
  exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

function loadExpanded() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function NavItem({ item, active, rail }) {
  const Icon = item.icon;
  const button = (
    <ListItemButton
      component={Link}
      href={item.to}
      aria-current={active ? "page" : undefined}
      sx={{
        minHeight: 40,
        borderRadius: 2,
        mb: 0.25,
        px: rail ? 0 : 1.5,
        justifyContent: rail ? "center" : "flex-start",
        color: active ? "primary.main" : "text.primary",
        bgcolor: (t) => (active ? alpha(t.palette.primary.main, 0.1) : "transparent"),
        "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, active ? 0.14 : 0.06) },
        "& .MuiListItemIcon-root": {
          minWidth: rail ? 0 : 34,
          color: active ? "primary.main" : "text.secondary",
        },
        "& .MuiListItemText-primary": { fontSize: 13.5, fontWeight: active ? 600 : 500 },
      }}
    >
      <ListItemIcon>
        <Icon fontSize="small" />
      </ListItemIcon>
      {!rail && <ListItemText primary={item.label} />}
    </ListItemButton>
  );
  return rail ? (
    <Tooltip title={item.label} placement="right">
      {button}
    </Tooltip>
  ) : (
    button
  );
}

export function DashboardLayout({ children }) {
  useRouteGuard();
  const { user, isAuthenticated, isLoading, logout, hasPermission, isClassTeacher } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [anchor, setAnchor] = useState(null);
  const [expanded, setExpanded] = useState(loadExpanded);
  const { data: period } = useAsync(() => schoolApi.getCurrentPeriod(), []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  // Visible nav groups for this user. Teachers get one flat list.
  const groups = useMemo(() => {
    if (!user) return [];
    const visible = (i) =>
      !i.hiddenRoles?.includes(user.role) &&
      !(i.requiresClassTeacher && !isClassTeacher()) &&
      (!i.permission || hasPermission(i.permission));

    const filtered = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter(visible) })).filter(
      (g) => g.items.length,
    );
    if (!["teacher", "class_teacher"].includes(user.role)) return filtered;

    const seen = new Set();
    const items = filtered.flatMap((g) => g.items).filter((i) => !seen.has(i.to) && seen.add(i.to));
    return [{ heading: "", items }];
  }, [user, isClassTeacher, hasPermission]);

  // Only the most specific matching item is highlighted
  const activeTo = useMemo(() => {
    let best = "";
    groups.forEach((g) =>
      g.items.forEach((i) => {
        if (isItemActive(pathname, i.to, i.exact) && i.to.length > best.length) best = i.to;
      }),
    );
    return best;
  }, [groups, pathname]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const width = open ? FULL : RAIL;

  const toggleGroup = (heading) =>
    setExpanded((prev) => {
      const next = { ...prev, [heading]: !(prev[heading] ?? true) };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  const go = (path) => {
    setAnchor(null);
    router.push(path);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Top bar */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        className="no-print"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => setOpen((o) => !o)} sx={{ mr: 1 }} aria-label="Toggle menu">
            <MenuIcon />
          </IconButton>
          <Logo size={32} />
          <Box sx={{ flexGrow: 1 }} />

          {period?.term && (
            <Chip
              label={period.term.label}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mr: 1.5, fontWeight: 600, display: { xs: "none", sm: "flex" } }}
            />
          )}
          <NotificationBell />

          <Box
            onClick={(e) => setAnchor(e.currentTarget)}
            sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1.5, cursor: "pointer" }}
          >
            <Avatar
              src={user.avatarUrl || user.photo}
              alt={user.name}
              sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 14 }}
            >
              {getInitials(user.name)}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" }, lineHeight: 1.15 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ROLE_LABELS[user.role]}
              </Typography>
            </Box>
            <ExpandMoreIcon fontSize="small" sx={{ color: "text.secondary" }} />
          </Box>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
            <MenuItem onClick={() => go("/profile")}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => go("/profile?tab=password")}>
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>
              Change password
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Log out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
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
            transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            px: open ? 1.5 : 0.75,
            py: 1.5,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 2 },
          }}
        >
          {groups.map((g) => {
            const isOpen = !g.heading || (expanded[g.heading] ?? true);
            return (
              <Box key={g.heading || "flat"} sx={{ mb: 1 }}>
                {open && g.heading && (
                  <Box
                    onClick={() => toggleGroup(g.heading)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1.5,
                      py: 0.75,
                      cursor: "pointer",
                      userSelect: "none",
                      color: "text.secondary",
                      "&:hover": { color: "text.primary" },
                    }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{g.heading}</Typography>
                    {isOpen ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                  </Box>
                )}
                <Collapse in={!open || isOpen} timeout={200} unmountOnExit>
                  <List dense disablePadding>
                    {g.items.map((item) => (
                      <NavItem key={item.to} item={item} rail={!open} active={item.to === activeTo} />
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      </Drawer>

      {/* Page content */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar className="no-print" />
        <Box className="system-page">{children}</Box>
      </Box>
    </Box>
  );
}

export default DashboardLayout;
