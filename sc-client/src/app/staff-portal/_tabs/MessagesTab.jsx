"use client";

import {
  Box, Card, Typography, List, ListItem, ListItemText, Divider, Chip, Button
} from "@mui/material";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export function MessagesTab({ user }) {
  const { data: messages = [], loading } = useAsync(
    async () => {
      try {
        const res = await api.getMessages({ staffId: user.staffId || user.id });
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    [user?.staffId, user?.id]
  );

  if (loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}>Loading messages...</Box>;
  }

  if (messages.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">No messages at the moment.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
        Inbox ({messages.length})
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <List disablePadding>
          {messages.map((m, idx) => (
            <Box key={m.id}>
              <ListItem sx={{ py: 2, bgcolor: m.read ? "transparent" : "action.hover" }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: m.read ? 500 : 700 }}>
                        {m.subject || m.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(m.sentAt || m.created_at)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                        From: {m.senderName || m.sender_name || "Admin"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {m.body || m.message}
                      </Typography>
                    </>
                  }
                />
                {!m.read && <Chip size="small" label="New" color="primary" sx={{ ml: 1 }} />}
              </ListItem>
              {idx < messages.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Card>
    </Box>
  );
}
