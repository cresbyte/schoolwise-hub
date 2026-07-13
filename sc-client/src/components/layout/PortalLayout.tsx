/**
 * Parent portal layout: simple top navbar with messages drawer, no sidebar.
 * @module PortalLayout
 */
import { useEffect, useState, type ReactNode } from "react";
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
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CloseIcon from "@mui/icons-material/Close";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { getInitials, formatDate } from "@/lib/utils";
import { school } from "@/lib/mockData";

const PRIORITY_COLOR: Record<string, "error" | "warning" | "default"> = {
  urgent: "error",
  high: "warning",
  normal: "default",
};

/** Layout shell for the parent portal. */
export function PortalLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [msgDrawerOpen, setMsgDrawerOpen] = useState(false);

  const { data: messages = [] } = useAsync(async () => {
    if (!user?.id) return [];
    const kids = await api.getParentStudents(user.id);
    const allMsgs = await Promise.all((kids || []).map((k: any) => api.getParentMessages(k.id)));
    return allMsgs.flat();
  }, [user?.id]);

  const msgList: any[] = (messages || []) as any[];
  const unreadCount = msgList.filter((m: any) => m.status !== "read").length;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/parent-portal");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/parent-portal");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        maxWidth: 1000,
        mx: "auto",
        p: { xs: 2, md: 3 },
      }}
    >
      <AppBar position="sticky" color="inherit" elevation={1} className="no-print">
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 1, sm: 2 },
          }}
        >
          {/* Left: Logo + name */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Logo size={32} />
          </Box>

          {/* Right: actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1.5 } }}>
            {/* Messages icon */}
            <IconButton
              onClick={() => setMsgDrawerOpen(true)}
              size="small"
              sx={{ position: "relative" }}
              aria-label="Open messages"
            >
              <Badge badgeContent={unreadCount} color="error">
                <MailIcon />
              </Badge>
            </IconButton>

            {/* User info */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main", fontSize: 13 }}>
                {getInitials(user.name)}
              </Avatar>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, display: { xs: "none", sm: "block" } }}
              >
                {user.name}
              </Typography>
            </Box>

            {/* Logout */}
            <Button
              color="inherit"
              onClick={handleLogout}
              size="small"
              sx={{ minWidth: "auto", p: 1, ml: { xs: 0, sm: 0.5 } }}
            >
              <LogoutIcon fontSize="small" />
              <Typography variant="button" sx={{ ml: 0.5, display: { xs: "none", sm: "block" } }}>
                Logout
              </Typography>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Messages Drawer ── */}
      <Drawer
        anchor="right"
        open={msgDrawerOpen}
        onClose={() => setMsgDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100vw", sm: 400 }, maxWidth: "100vw" } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Drawer header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "primary.main",
              color: "white",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MailIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Messages from School
              </Typography>
            </Box>
            <IconButton
              onClick={() => setMsgDrawerOpen(false)}
              size="small"
              sx={{ color: "white" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Unread badge summary */}
          {unreadCount > 0 && (
            <Box
              sx={{
                px: 2,
                py: 1,
                bgcolor: "primary.main" + "14",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
                {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
              </Typography>
            </Box>
          )}

          {/* Message list */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {msgList.length === 0 ? (
              <Box sx={{ textAlign: "center", mt: 6 }}>
                <MailIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No messages yet
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {msgList.map((m: any) => (
                  <Card
                    key={m.id}
                    variant="outlined"
                    sx={{
                      borderLeft: m.status !== "read" ? "4px solid" : "1px solid",
                      borderColor: m.status !== "read" ? "primary.main" : "divider",
                      cursor: "default",
                      transition: "box-shadow 0.15s",
                      "&:hover": { boxShadow: 2 },
                    }}
                  >
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1,
                          mb: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            flexWrap: "wrap",
                          }}
                        >
                          {m.status !== "read" && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: "primary.main",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <Chip
                            size="small"
                            label={(m.channel || "").replace("_", " ").toUpperCase()}
                            color={PRIORITY_COLOR[m.priority] ?? "default"}
                            variant="outlined"
                            sx={{ fontSize: 10, height: 20 }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                        >
                          {formatDate(m.sentAt)}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {m.subject}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                        {m.body}
                      </Typography>
                      {m.attachmentLabel && (
                        <Chip size="small" label={m.attachmentLabel} sx={{ mt: 1, fontSize: 11 }} />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>

          {/* Drawer footer */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button fullWidth variant="outlined" onClick={() => setMsgDrawerOpen(false)}>
              Close
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 3 } }}>{children}</Box>
    </Box>
  );
}

export default PortalLayout;
