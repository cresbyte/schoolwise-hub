/**
 * Main authenticated layout: collapsible sidebar + top AppBar.
 * Redirects unauthenticated users to /login.
 * @module DashboardLayout
 */
"use client";
import { useEffect, useRef, useState, useMemo } from "react";
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
import Collapse from "@mui/material/Collapse";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import LockResetIcon from "@mui/icons-material/LockReset";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { alpha, useTheme } from "@mui/material/styles";
import { ROLE_LABELS } from "@/lib/constants";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import { NAV_GROUPS } from "./navConfig";
import { NotificationBell } from "./NotificationBell";
import { getInitials } from "@/lib/utils";
import { useRouteGuard } from "@/hooks/useRouteGuard";

const FULL = 240;
const RAIL = 64;

/** Returns true if the nav item should be considered active. */
function isItemActive(pathname, to, exact) {
  if (exact) return pathname === to;
  if (pathname === to) return true;
  // Only activate on prefix match if to is not a generic parent that would
  // swallow children. E.g. /settings should NOT activate for /settings/users.
  return pathname.startsWith(to + "/");
}

/** Returns true if any item in the group is currently active. */
function isGroupActive(pathname, items) {
  return items.some((i) => isItemActive(pathname, i.to, i.exact));
}

function loadCollapsedState() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("sidebar_collapsed") || "{}");
  } catch {
    return {};
  }
}

function saveCollapsedState(state) {
  try {
    localStorage.setItem("sidebar_collapsed", JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Authenticated app shell with sidebar and app bar. */
export function DashboardLayout({ children }) {
  useRouteGuard();
  const { user, isAuthenticated, isLoading, logout, hasPermission, isClassTeacher } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const [anchor, setAnchor] = useState(null);
  const scrollRef = useRef(null);
  const scrollPos = useRef(0);

  // Per-group collapsed state (open = true means expanded/visible)
  const [groupOpen, setGroupOpen] = useState(() => {
    const saved = loadCollapsedState();
    // Default: all groups expanded
    const defaults = {};
    NAV_GROUPS.forEach((g) => {
      defaults[g.heading] = saved[g.heading] !== undefined ? saved[g.heading] : true;
    });
    return defaults;
  });

  // Preserve scroll position on navigation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = scrollPos.current;
  }, [pathname]);

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

  const isTeacherRole = user && ["teacher", "class_teacher"].includes(user.role);

  // Flat list of nav items for teacher users (ungrouped)
  const flatTeacherItems = useMemo(() => {
    if (!isTeacherRole) return [];
    const items: any[] = [];
    const seen = new Set();
    NAV_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        if (item.hiddenRoles && user && item.hiddenRoles.includes(user.role)) return;
        if (item.requiresClassTeacher && !isClassTeacher()) return;
        if (item.permission && !hasPermission(item.permission)) return;
        if (!seen.has(item.to)) {
          seen.add(item.to);
          items.push(item);
        }
      });
    });
    return items;
  }, [isTeacherRole, user, isClassTeacher, hasPermission]);

  const width = open ? FULL : RAIL;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const toggleGroup = (heading) => {
    setGroupOpen((prev) => {
      const next = { ...prev, [heading]: !prev[heading] };
      saveCollapsedState(next);
      return next;
    });
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
          <Logo size={32} />
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
            <Avatar
              src={user.avatarUrl || user.photo}
              alt={user.name}
              sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 14 }}
            >
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
            <MenuItem
              onClick={() => {
                setAnchor(null);
                router.push("/profile");
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => setAnchor(null)}>
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>
              Change Password
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
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
            transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            overflowY: "hidden",
            display: "flex",
            flexDirection: "column",
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          },
        }}
      >
        {/* Compact Sidebar Header */}
        <Box
          sx={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: open ? "flex-start" : "center",
            px: open ? 2 : 0,
            flexShrink: 0,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Logo size={open ? 28 : 32} />
        </Box>

        {/* Scrollable sidebar body — scroll position is preserved via ref */}
        <Box
          ref={scrollRef}
          onScroll={() => {
            scrollPos.current = scrollRef.current?.scrollTop ?? 0;
          }}
          sx={{
            overflowY: "auto",
            overflowX: "hidden",
            flex: 1,
            py: 0.5,
            // Custom thin scrollbar
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 2 },
          }}
        >
          {isTeacherRole && open ? (
            <List dense sx={{ px: 1, py: 0.5 }}>
              {flatTeacherItems.map((item) => {
                const active = isItemActive(pathname, item.to, item.exact);
                const Icon = item.icon;
                return (
                  <ListItemButton
                    key={item.to}
                    component={Link}
                    href={item.to}
                    selected={active}
                    sx={{
                      minHeight: 38,
                      borderRadius: 1,
                      mb: 0.25,
                      px: 1.5,
                      bgcolor: active
                        ? alpha(theme.palette.primary.main, 0.08)
                        : "transparent",
                      color: active ? theme.palette.primary.main : "text.primary",
                      "&:hover": {
                        bgcolor: active
                          ? alpha(theme.palette.primary.main, 0.12)
                          : "action.hover",
                      },
                      "& .MuiListItemIcon-root": {
                        color: active ? theme.palette.primary.main : "text.secondary",
                        minWidth: 32,
                      },
                      "& .MuiListItemText-primary": {
                        fontWeight: active ? 600 : 500,
                        fontSize: 13,
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Icon />
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                );
              })}
            </List>
          ) : isTeacherRole && !open ? (
            <List dense sx={{ px: 0.5, py: 0.5 }}>
              {flatTeacherItems.map((item) => {
                const active = isItemActive(pathname, item.to, item.exact);
                const Icon = item.icon;
                return (
                  <Tooltip key={item.to} title={item.label} placement="right">
                    <ListItemButton
                      component={Link}
                      href={item.to}
                      selected={active}
                      sx={{
                        minHeight: 40,
                        justifyContent: "center",
                        borderRadius: 1,
                        mb: 0.125,
                        px: 0,
                        bgcolor: active
                          ? alpha(theme.palette.primary.main, 0.08)
                          : "transparent",
                        color: active ? theme.palette.primary.main : "text.primary",
                        "&:hover": {
                          bgcolor: active
                            ? alpha(theme.palette.primary.main, 0.12)
                            : "action.hover",
                        },
                        "& .MuiListItemIcon-root": {
                          color: active ? theme.palette.primary.main : "text.secondary",
                          minWidth: 0,
                          justifyContent: "center",
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Icon />
                      </ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                );
              })}
            </List>
          ) : (
            NAV_GROUPS.map((group) => {
              const items = group.items.filter((i) => {
                if (i.hiddenRoles && user && i.hiddenRoles.includes(user.role)) return false;
                if (i.requiresClassTeacher && !isClassTeacher()) return false;
                return !i.permission || hasPermission(i.permission);
              });
              if (!items.length) return null;

              const anyActive = isGroupActive(pathname, items);
              const expanded = groupOpen[group.heading] ?? true;

              return (
                <Box key={group.heading} sx={{ mb: 0.5 }}>
                  {open ? (
                    <>
                      {/* Group header row — clicking toggles collapse */}
                      <Box
                        onClick={() => toggleGroup(group.heading)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 1.5,
                          py: 0.75,
                          mt: 1,
                          cursor: "pointer",
                          userSelect: "none",
                          borderRadius: 1,
                          mx: 1,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            fontSize: 10.5,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: anyActive ? "primary.main" : "text.secondary",
                          }}
                        >
                          {group.heading}
                        </Typography>
                        <Box
                          sx={{
                            color: anyActive ? "primary.main" : "text.secondary",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {expanded ? (
                            <ExpandLessIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <ExpandMoreIcon sx={{ fontSize: 16 }} />
                          )}
                        </Box>
                      </Box>

                      <Collapse in={expanded} timeout={200} unmountOnExit>
                        <List dense sx={{ px: 1, py: 0.5 }}>
                          {items.map((item) => {
                            const active = isItemActive(pathname, item.to, item.exact);
                            const Icon = item.icon;
                            return (
                              <ListItemButton
                                key={item.to}
                                component={Link}
                                href={item.to}
                                selected={active}
                                sx={{
                                  minHeight: 36,
                                  borderRadius: 1,
                                  mb: 0.125,
                                  px: 1.5,
                                  bgcolor: active
                                    ? alpha(theme.palette.primary.main, 0.08)
                                    : "transparent",
                                  color: active ? theme.palette.primary.main : "text.primary",
                                  "&:hover": {
                                    bgcolor: active
                                      ? alpha(theme.palette.primary.main, 0.12)
                                      : "action.hover",
                                  },
                                  "& .MuiListItemIcon-root": {
                                    color: active ? theme.palette.primary.main : "text.secondary",
                                    minWidth: 32,
                                  },
                                  "& .MuiListItemText-primary": {
                                    fontWeight: active ? 600 : 500,
                                    fontSize: 13,
                                  },
                                }}
                              >
                                <ListItemIcon>
                                  <Icon />
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                              </ListItemButton>
                            );
                          })}
                        </List>
                      </Collapse>
                    </>
                  ) : (
                    // Rail mode — no groups, just icons with tooltips
                    <List dense sx={{ px: 0.5, py: 0.5 }}>
                      {items.map((item) => {
                        const active = isItemActive(pathname, item.to, item.exact);
                        const Icon = item.icon;
                        return (
                          <Tooltip key={item.to} title={item.label} placement="right">
                            <ListItemButton
                              component={Link}
                              href={item.to}
                              selected={active}
                              sx={{
                                minHeight: 40,
                                justifyContent: "center",
                                borderRadius: 1,
                                mb: 0.125,
                                px: 0,
                                bgcolor: active
                                  ? alpha(theme.palette.primary.main, 0.08)
                                  : "transparent",
                                color: active ? theme.palette.primary.main : "text.primary",
                                "&:hover": {
                                  bgcolor: active
                                    ? alpha(theme.palette.primary.main, 0.12)
                                    : "action.hover",
                                },
                                "& .MuiListItemIcon-root": {
                                  color: active ? theme.palette.primary.main : "text.secondary",
                                  minWidth: 0,
                                  justifyContent: "center",
                                },
                              }}
                            >
                              <ListItemIcon>
                                <Icon />
                              </ListItemIcon>
                            </ListItemButton>
                          </Tooltip>
                        );
                      })}
                    </List>
                  )}
                </Box>
              );
            })
          )}
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
