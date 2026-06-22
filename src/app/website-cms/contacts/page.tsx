"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import MailOutlined from "@mui/icons-material/MailOutlined";
import DraftsIcon from "@mui/icons-material/Drafts";
import DeleteIcon from "@mui/icons-material/Delete";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { DataState } from "@/components/DataState";
import { format } from "date-fns";
import { useNotification } from "@/context/NotificationContext";

export default function ContactsCmsPage() {
  const [tab, setTab] = useState(0);
  const statusFilter = tab === 0 ? "unread" : "read";
  const { data: messages, loading, refetch } = useAsync(() => api.getContactSubmissions(statusFilter as any), [tab]);
  const { showNotification } = useNotification();

  const handleStatus = async (id: string, read: boolean) => {
    await api.updateContactStatus(id, read ? "read" : "unread");
    showNotification(read ? "Marked as read" : "Marked as unread", "success");
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this message?")) {
      await api.deleteContactSubmission(id);
      showNotification("Message deleted", "success");
      refetch();
    }
  };

  return (
    <DashboardLayout>
      <RoleGuard permission="settings.view">
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Contact Messages</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Read and manage inquiries from the public contact form.
          </Typography>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Unread" icon={<MailOutlined />} iconPosition="start" />
            <Tab label="Read" icon={<DraftsIcon />} iconPosition="start" />
          </Tabs>

          <DataState loading={loading} data={messages}>
            <Stack spacing={2}>
              {!messages || messages.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8, bgcolor: "action.hover", borderRadius: 2 }}>
                  <Typography color="text.secondary">No {statusFilter} messages.</Typography>
                </Box>
              ) : (
                messages.map((msg) => (
                  <Card key={msg.id} variant="outlined" sx={{ borderLeft: 4, borderColor: msg.status === "unread" ? "primary.main" : "divider" }}>
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{msg.subject}</Typography>
                          <Typography variant="body2">
                            <strong>From:</strong> {msg.name} ({msg.email}) {msg.phone && `· ${msg.phone}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Submitted on {format(new Date(msg.submittedAt), "MMM dd, yyyy 'at' hh:mm a")}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={msg.status === "read" ? <MailOutlined /> : <DraftsIcon />}
                            onClick={() => handleStatus(msg.id, msg.status === "unread")}
                          >
                            Mark as {msg.status === "read" ? "Unread" : "Read"}
                          </Button>
                          <IconButton color="error" size="small" onClick={() => handleDelete(msg.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="body1" sx={{ color: "text.primary", whiteSpace: "pre-line" }}>
                        {msg.message}
                      </Typography>
                    </Box>
                  </Card>
                ))
              )}
            </Stack>
          </DataState>
        </Box>
      </RoleGuard>
    </DashboardLayout>
  );
}
