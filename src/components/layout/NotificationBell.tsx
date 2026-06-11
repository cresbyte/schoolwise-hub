/**
 * AppBar notification bell with unread badge and dropdown.
 * @module NotificationBell
 */
import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CircleIcon from "@mui/icons-material/Circle";
import * as api from "@/lib/mockApi";
import { useAsync } from "@/hooks/useAsync";
import { timeAgo } from "@/lib/utils";

const TYPE_COLOR: Record<string, string> = {
  info: "#1565C0",
  success: "#2E7D32",
  warning: "#EF6C00",
  error: "#C62828",
};

/** Notification bell dropdown. */
export function NotificationBell() {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const { data, refetch } = useAsync(() => api.getNotifications(), []);
  const items = data ?? [];
  const unread = items.filter((n) => !n.read).length;

  const markAll = async () => {
    await Promise.all(items.filter((n) => !n.read).map((n) => api.markNotificationRead(n.id)));
    refetch();
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
        <Badge badgeContent={unread} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 460 } } }}
      >
        <Box sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          <Button size="small" onClick={markAll} disabled={!unread}>
            Mark all read
          </Button>
        </Box>
        <Divider />
        <List dense disablePadding>
          {items.slice(0, 10).map((n) => (
            <ListItem key={n.id} sx={{ alignItems: "flex-start", bgcolor: n.read ? "transparent" : "#1565C00A" }}>
              <CircleIcon sx={{ fontSize: 10, color: TYPE_COLOR[n.type], mt: 0.8, mr: 1 }} />
              <ListItemText
                primary={n.title}
                secondary={`${n.message} · ${timeAgo(n.createdAt)}`}
                slotProps={{ primary: { sx: { fontWeight: 600, fontSize: 14 } }, secondary: { sx: { fontSize: 12 } } }}
              />
            </ListItem>
          ))}
          {!items.length && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
              No notifications
            </Typography>
          )}
        </List>
      </Popover>
    </>
  );
}

export default NotificationBell;