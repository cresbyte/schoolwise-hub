"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Slide,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useScrollTrigger,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DescriptionIcon from "@mui/icons-material/Description";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CampaignIcon from "@mui/icons-material/Campaign";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import WifiIcon from "@mui/icons-material/Wifi";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";

import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/common/Logo";
import { getInitials } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", to: "/portal", icon: <HomeIcon fontSize="small" /> },
  { label: "Attendance", to: "/portal/attendance", icon: <EventAvailableIcon fontSize="small" /> },
  { label: "Reports", to: "/portal/reports", icon: <DescriptionIcon fontSize="small" /> },
  { label: "Fees", to: "/portal/fees", icon: <AccountBalanceWalletIcon fontSize="small" /> },
  { label: "Notices", to: "/portal/notices", icon: <CampaignIcon fontSize="small" /> },
];

const APP_MAX_WIDTH = 480;



// ─── Portal layout ──────────────────────────────────────────────────
export function PortalLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  // Reference to the scrollable <main> so useScrollTrigger can watch it
  const scrollRef = useRef(null);

  // Hide AppBar on scroll down, show on scroll up.
  // `target` points at our scroll container, not window.
  const hideOnScroll = useScrollTrigger({
    target: scrollRef.current || undefined,
    disableHysteresis: true,
    threshold: 20,
  });

  const activeIndex = NAV_ITEMS.findIndex(
    (item) => pathname === item.to || (item.to !== "/portal" && pathname.startsWith(item.to)),
  );
  const tabValue = activeIndex === -1 ? 0 : activeIndex;

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await logout();
    router.push("/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: { xs: "background.paper", sm: "grey.100" },
        backgroundImage: {
          xs: "none",
          sm: "radial-gradient(circle at 20% 0%, #eef2f7 0%, #e2e8f0 100%)",
        },
        display: "flex",
        justifyContent: "center",
        py: { xs: 0, sm: 3 },
      }}
    >
      {/* App column (phone frame) */}
      <Box
        sx={{
          width: "100%",
          maxWidth: APP_MAX_WIDTH,
          height: { xs: "100dvh", sm: "calc(100vh - 48px)" },
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          borderRadius: { xs: 0, sm: 4 },
          overflow: "hidden",
          boxShadow: {
            xs: 0,
            sm: "0 24px 64px -12px rgba(15, 23, 42, 0.25), 0 8px 16px -8px rgba(15, 23, 42, 0.12)",
          },
        }}
      >


        {/* Auto-hiding AppBar */}
        <Slide appear={false} direction="down" in={!hideOnScroll}>
          <AppBar
            color="inherit"
            elevation={0}
            sx={{
              position: "sticky",
              top: 0,
              bgcolor: "background.paper",
              borderBottom: 1,
              borderColor: "divider",
              flexShrink: 0,
              zIndex: (t) => t.zIndex.appBar,
            }}
          >
            {/* Brand row */}
            <Toolbar sx={{ px: 1.75, minHeight: 52 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flex: 1, minWidth: 0 }}>
                <Logo size={24} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 800,
                      color: "primary.main",
                      lineHeight: 1.1,
                      fontSize: "0.85rem",
                      letterSpacing: 0.2,
                    }}
                    noWrap
                  >
                    Parent Portal
                  </Typography>

                </Box>
              </Box>

              <IconButton
                size="small"
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                sx={{ p: 0.25, ml: 1 }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  variant="dot"
                  sx={{
                    "& .MuiBadge-badge": {
                      bgcolor: "success.main",
                      boxShadow: "0 0 0 2px #fff",
                    },
                  }}
                >
                  <Avatar
                    src={user?.avatarUrl || user?.photo}
                    alt={user?.name}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "primary.main",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(user?.name || "Parent")}
                  </Avatar>
                </Badge>
              </IconButton>

              <Menu
                anchorEl={userMenuAnchor}
                open={!!userMenuAnchor}
                onClose={() => setUserMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  elevation: 3,
                  sx: { minWidth: 200, borderRadius: 2, mt: 1 },
                }}
              >
                <Box sx={{ px: 2, py: 1.25 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                    {user?.name || "Parent"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {user?.phone || user?.email || "Parent Account"}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setUserMenuAnchor(null);
                    router.push("/profile");
                  }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile &amp; Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                  <ListItemIcon sx={{ color: "error.main" }}>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Sign out
                </MenuItem>
              </Menu>
            </Toolbar>

            {/* Horizontally-scrollable tab row */}
            <Box
              sx={{
                borderTop: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Tabs
                value={tabValue}
                onChange={(_, v) => router.push(NAV_ITEMS[v].to)}
                variant="scrollable"
                scrollButtons={false}
                allowScrollButtonsMobile
                sx={{
                  minHeight: 42,
                  // Allow the tab strip to scroll horizontally without a visible scrollbar
                  "& .MuiTabs-scroller": {
                    overflowX: "auto !important",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                  },
                  // Hide MUI's built-in scroll buttons entirely
                  "& .MuiTabs-scrollButtons": {
                    display: "none",
                  },
                  "& .MuiTab-root": {
                    minHeight: 42,
                    minWidth: 0,
                    px: 1.5,
                    py: 0.5,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    textTransform: "none",
                    gap: 0.5,
                    color: "text.secondary",
                    flexShrink: 0,
                    "&.Mui-selected": {
                      color: "primary.main",
                      fontWeight: 700,
                    },
                  },
                  "& .MuiTabs-indicator": {
                    height: 3,
                    borderRadius: "3px 3px 0 0",
                    backgroundColor: "primary.main",
                  },
                  // Make the whole strip swipeable on touch
                  WebkitOverflowScrolling: "touch",
                  touchAction: "pan-x",
                }}
              >
                {NAV_ITEMS.map((item) => (
                  <Tab key={item.to} label={item.label} icon={item.icon} iconPosition="start" />
                ))}
              </Tabs>
            </Box>
          </AppBar>
        </Slide>

        {/* Scrollable page content — this is the scroll container */}
        <Box
          ref={scrollRef}
          component="main"
          sx={{
            flex: 1,
            px: 1.75,
            pt: 2,
            pb: 3,
            width: "100%",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
