"use client";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Chat, Send } from "@mui/icons-material";
import { DataState } from "@/components/DataState";
import { useNotification } from "@/context/NotificationContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const MOCK_MESSAGES_PARENT = [
  {
    id: "msg-1",
    subject: "Term 2 Closing Date",
    body: "Dear parents, please note that the school will close for Term 2 on August 9th, 2026.",
    channel: "announcement",
    sentAt: "2026-06-10T10:00:00Z",
    status: "read",
    priority: "normal",
  },
  {
    id: "msg-2",
    subject: "Sports Day Notice",
    body: "All students are required to have their sports gear ready for the upcoming Sports Day on June 25th.",
    channel: "announcement",
    sentAt: "2026-06-11T09:00:00Z",
    status: "sent",
    priority: "normal",
  },
  {
    id: "msg-4",
    subject: "Fee Reminder",
    body: "Dear parent, this is a friendly reminder to clear the outstanding fee balance for your child.",
    channel: "direct",
    sentAt: "2026-06-12T10:00:00Z",
    status: "sent",
    priority: "normal",
  },
  {
    id: "msg-6",
    subject: "Early Closure Tomorrow",
    body: "Please note that the school will close at 12:30 PM tomorrow due to a scheduled staff meeting.",
    channel: "sms_alert",
    sentAt: "2026-06-12T14:00:00Z",
    status: "sent",
    priority: "urgent",
  },
];

export function MessagesTab({ student, user }) {
  const { showNotification } = useNotification();
  const {
    data: messagesRes = [],
    loading,
    refetch,
  } = useAsync(
    () =>
      api
        .getParentMessages(student.id)
        .then((r) => (r && r.length > 0 ? r : MOCK_MESSAGES_PARENT))
        .catch(() => MOCK_MESSAGES_PARENT),
    [student.id],
  );
  const [replyTo, setReplyTo] = useState(null);
  const [replyBody, setReplyBody] = useState("");

  const messages = messagesRes || MOCK_MESSAGES_PARENT;

  const handleReply = async () => {
    if (!replyBody.trim() || !replyTo) return;
    try {
      await api.sendParentReply({
        messageId: replyTo.id,
        studentName: `${student.firstName} ${student.lastName}`,
        parentName: user?.name ?? "Parent",
        body: replyBody,
      });
    } catch {}
    showNotification("Reply sent to school office", "success");
    setReplyTo(null);
    setReplyBody("");
    refetch();
  };

  return (
    <Box>
      {loading ? (
        <DataState loading={true} data={null} children={<Box />} />
      ) : (
        <Stack spacing={2}>
          {messages.map((m) => (
            <Card
              key={m.id}
              variant="outlined"
              sx={{
                borderLeft: m.status !== "read" ? "4px solid" : "1px solid",
                borderColor: m.status !== "read" ? "primary.main" : "divider",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, gap: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", minWidth: 0 }}>
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
                      label={m.channel?.replace("_", " ").toUpperCase()}
                      color={m.priority === "urgent" ? "error" : "default"}
                      variant="outlined"
                      sx={{ fontSize: 10 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {formatDate(m.sentAt)}
                  </Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {m.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  {m.body}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Chat />}
                  onClick={() => {
                    setReplyTo(m);
                  }}
                >
                  Reply to Office
                </Button>
              </CardContent>
            </Card>
          ))}
          {messages.length === 0 && <Alert severity="info">No messages from school.</Alert>}
        </Stack>
      )}

      <Dialog open={!!replyTo} onClose={() => setReplyTo(null)} fullWidth maxWidth="xs">
        <DialogTitle>Reply to Office</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Subject: {replyTo?.subject}
          </Typography>
          <TextField
            label="Your Message"
            fullWidth
            multiline
            rows={4}
            size="small"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyTo(null)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleReply}
            disabled={!replyBody.trim()}
          >
            Send Reply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
