"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ClassIcon from "@mui/icons-material/Class";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CampaignIcon from "@mui/icons-material/Campaign";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import LockResetIcon from "@mui/icons-material/LockReset";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/common/Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { getInitials } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";

import { schoolApi } from "@/lib/schoolApi";

export const STAFF_NAV = [
  { label: "Dashboard", href: "/staff-portal", icon: <DashboardIcon fontSize="small" />, exact: true },
  { label: "My Classes", href: "/staff-portal/classes", icon: <ClassIcon fontSize="small" /> },
  { label: "Attendance", href: "/staff-portal/attendance", icon: <EventAvailableIcon fontSize="small" /> },
  { label: "Grading & Exams", href: "/staff-portal/grading", icon: <EditNoteIcon fontSize="small" /> },
  { label: "Timetable", href: "/staff-portal/timetable", icon: <CalendarMonthIcon fontSize="small" /> },
  { label: "Notices", href: "/staff-portal/notices", icon: <CampaignIcon fontSize="small" /> },
];

function getActiveIndex(pathname) {
  let best = 0;
  let bestLen = -1;
  STAFF_NAV.forEach((item, index) => {
    const isMatch = item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");
    if (isMatch && item.href.length > bestLen) {
      best = index;
      bestLen = item.href.length;
    }
  });
  return best;
}

export function StaffLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [periodLabel, setPeriodLabel] = useState("Academic Year 2026");

  useEffect(() => {
    schoolApi
      .getCurrentPeriod()
      .then((p) => {
        if (p?.term?.name || p?.academic_year?.year) {
          setPeriodLabel(`${p.term?.name || "Term"} • ${p.academic_year?.year || ""}`);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && isAuthenticated && user?.role === "parent") {
      router.push("/portal");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const hasAdminAccess = ["admin", "headteacher", "deputy"].includes(user.role);
  const activeTab = getActiveIndex(pathname);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}
      >
        <Toolbar sx={{ px: { xs: 1.5, sm: 3 } }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 1 }}
              aria-label="open navigation drawer"
            >
              <MenuIcon />
            </IconButton>
          )}

          <Link href="/staff-portal" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Logo size={28} />
          </Link>

          <Box sx={{ display: "flex", alignItems: "center", ml: 2, gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main" }}>
              Staff Portal
            </Typography>
            <Chip
              label={ROLE_LABELS[user.role] || "Staff"}
              color="secondary"
              size="small"
              sx={{ height: 22, fontSize: "0.75rem", fontWeight: 600 }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {periodLabel && (
            <Chip
              label={periodLabel}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mr: 1.5, fontWeight: 600, display: { xs: "none", sm: "flex" } }}
            />
          )}

          <NotificationBell />

          {/* User Profile avatar & menu */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1.5, cursor: "pointer" }}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <Avatar
              src={user.avatarUrl || user.photo}
              alt={user.name}
              sx={{ width: 34, height: 34, bgcolor: "secondary.main", fontSize: 14 }}
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

          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                router.push("/profile");
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                router.push("/profile?tab=password");
              }}
            >
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>
              Change Password
            </MenuItem>

            {hasAdminAccess && (
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  router.push("/dashboard");
                }}
              >
                <ListItemIcon>
                  <AdminPanelSettingsIcon fontSize="small" />
                </ListItemIcon>
                Switch to Admin
              </MenuItem>
            )}

            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>

        {/* Desktop Quick Tabs */}
        {!isMobile && (
          <Tabs
            value={activeTab}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              borderTop: 1,
              borderColor: "divider",
              minHeight: 44,
              "& .MuiTab-root": { minHeight: 44, py: 0.75, textTransform: "none", fontWeight: 600 },
            }}
          >
            {STAFF_NAV.map((item) => (
              <Tab
                key={item.href}
                label={item.label}
                icon={item.icon}
                iconPosition="start"
                component={Link}
                href={item.href}
              />
            ))}
          </Tabs>
        )}
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: 260 } }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Logo size={28} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main" }}>
            Staff Portal
          </Typography>
        </Box>
        <Divider />
        <List sx={{ px: 1 }}>
          {STAFF_NAV.map((item, index) => (
            <ListItemButton
              key={item.href}
              selected={activeTab === index}
              onClick={() => {
                setMobileDrawerOpen(false);
                router.push(item.href);
              }}
              sx={{ borderRadius: 1.5, my: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: activeTab === index ? 700 : 500 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          width: "100%",
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 2.5, sm: 3 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
