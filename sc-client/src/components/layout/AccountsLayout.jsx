"use client";

/**
 * Accountant shell — horizontal top nav, no sidebar.
 * Scoped to /accounts/* routes.
 */
import { Logo } from "@/components/common/Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { ROLE_LABELS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Toolbar,
  Typography
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { label: "Dashboard", href: "/accounts/fees", exact: true },
  { label: "Invoices", href: "/accounts/fees/invoices" },
  { label: "Payments", href: "/accounts/fees/payments" },
  { label: "Outstanding", href: "/accounts/fees/outstanding" },
  { label: "Fee structures", href: "/accounts/fees/structures" },
  { label: "Charges", href: "/accounts/fees/charges" },
  { label: "Reconciliation", href: "/accounts/fees/reconciliation" },
  { label: "Reports", href: "/accounts/fees/reports" },
  {label :"Students", href:"/students"}
];

function activeIndex(pathname) {
  let best = 0;
  let bestLen = -1;
  NAV.forEach((n, i) => {
    const matches = n.exact
      ? pathname === n.href
      : pathname === n.href || pathname.startsWith(n.href + "/");
    if (matches && n.href.length > bestLen) {
      best = i;
      bestLen = n.href.length;
    }
  });
  return best;
}

export function AccountsLayout({ children }) {
  useRouteGuard();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [anchor, setAnchor] = useState(null);

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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const hasAdminAccess = ["admin", "headteacher", "deputy"].includes(user.role);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        className="no-print"
        sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}
      >
        <Toolbar>
          <Link
            href="/accounts/fees"
            style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
          >
            <Logo size={30} />
          </Link>
          <Typography variant="subtitle1" sx={{ ml: 2, fontWeight: 700, color: "primary.main" }}>
            Accounts Portal
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Chip
            label="Term 2, 2026"
            color="primary"
            variant="outlined"
            size="small"
            sx={{ mr: 1, fontWeight: 600, display: { xs: "none", sm: "flex" } }}
          />
          <NotificationBell />

          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1.5, cursor: "pointer" }}
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
            <MenuItem
              onClick={() => {
                setAnchor(null);
                router.push("/profile?tab=password");
              }}
            >
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>
              Change password
            </MenuItem>
            {hasAdminAccess && (
              <MenuItem
                onClick={() => {
                  setAnchor(null);
                  router.push("/dashboard");
                }}
              >
                <ListItemIcon>
                  <AdminPanelSettingsIcon fontSize="small" />
                </ListItemIcon>
                Admin view
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>

        {/* Horizontal nav */}
        <Tabs
          value={activeIndex(pathname)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, borderTop: 1, borderColor: "divider" }}
        >
          {NAV.map((n) => (
            <Tab key={n.href} label={n.label} component={Link} href={n.href} />
          ))}
        </Tabs>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          width: "100%",
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
