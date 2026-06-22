"use client";

/**
 * Admin messaging center for staff/parent communication.
 * @module messages/page
 */
import { useState } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import MessageIcon from "@mui/icons-material/Message";
import SendIcon from "@mui/icons-material/Send";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { formatDate } from "@/lib/utils";
import type { SchoolMessage, ParentReply, ClassRoom, Student } from "@/lib/types";

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <MessagesContent />
    </DashboardLayout>
  );
}

function MessagesContent() {
  const { showNotification } = useNotification();
  const [tab, setTab] = useState(0);
  
  const { data: sentMessagesRes, loading: loadingSent, refetch: refetchSent } = useAsync(() => api.getMessages());
  const { data: repliesRes, loading: loadingReplies, refetch: refetchReplies } = useAsync(() => api.getParentReplies());
  
  const sentMessages = sentMessagesRes || [];
  const replies = repliesRes || [];
  const unreadReplies = replies.filter(r => !r.readByStaff).length;

  const [composeOpen, setComposeOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState<{ open: boolean, message?: SchoolMessage, reply?: ParentReply }>({ open: false });

  const handleCompose = async (data: any) => {
    try {
      await api.sendMessage({
        ...data,
        sentBy: "Daniel Njoroge", 
        sentById: "stf-1",
      });
      showNotification(`Message sent`, "success");
      setComposeOpen(false);
      refetchSent();
    } catch (err: any) {
      showNotification(err.message || "Failed to send message", "error");
    }
  };

  const handleMarkRead = async (replyId: string) => {
    await api.markReplyRead(replyId);
    refetchReplies();
  };

  return (
    <>
      <PageHeader
        title="Communication Center"
        subtitle="School-wide announcements and parent engagement"
        actions={
          <RoleGuard permission="reports.view">
            <Button startIcon={<MessageIcon />} variant="contained" onClick={() => setComposeOpen(true)}>New Message</Button>
          </RoleGuard>
        }
      />

      <Card sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab 
            label={
              <Badge badgeContent={unreadReplies} color="error">
                Parent Replies
              </Badge>
            } 
          />
          <Tab label="Sent Messages" />
        </Tabs>

        {tab === 0 && (
          <DataState loading={loadingReplies} error={null} data={replies} isEmpty={(d) => d.length === 0}>
            {() => (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>From (Parent)</TableCell>
                      <TableCell>Re: Message</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {replies.map((r) => {
                      const original = sentMessages.find(m => m.id === r.messageId);
                      return (
                        <TableRow key={r.id} hover sx={{ bgcolor: !r.readByStaff ? "action.hover" : "transparent" }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.parentName}</Typography>
                            <Typography variant="caption" color="text.secondary">Parent of {r.studentName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {original?.subject || "Reply to Message"}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDate(r.sentAt)}</TableCell>
                          <TableCell>
                            {!r.readByStaff ? <Chip size="small" label="Unread" color="primary" /> : <Chip size="small" label="Read" variant="outlined" />}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                              <IconButton size="small" onClick={() => setViewDialog({ open: true, message: original, reply: r })}><VisibilityIcon fontSize="small" /></IconButton>
                              {!r.readByStaff && (
                                <IconButton size="small" color="primary" onClick={() => handleMarkRead(r.id)}><MarkEmailReadIcon fontSize="small" /></IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataState>
        )}

        {tab === 1 && (
          <DataState loading={loadingSent} error={null} data={sentMessages} isEmpty={(d) => d.length === 0}>
            {() => (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Recipients</TableCell>
                      <TableCell>Channel</TableCell>
                      <TableCell>Date Sent</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sentMessages.map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{m.subject}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                            {m.recipientType.replace('_', ' ')}
                            {m.className && ` (${m.className})`}
                            {m.studentName && ` (${m.studentName})`}
                          </Typography>
                        </TableCell>
                        <TableCell><Chip size="small" label={m.channel} variant="outlined" /></TableCell>
                        <TableCell>{formatDate(m.sentAt)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => setViewDialog({ open: true, message: m })}><VisibilityIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataState>
        )}
      </Card>

      {composeOpen && (
        <ComposeMessageDialog 
          open={composeOpen} 
          onClose={() => setComposeOpen(false)} 
          onSend={handleCompose} 
        />
      )}

      {viewDialog.open && (
        <MessageDetailDialog 
          open={viewDialog.open} 
          message={viewDialog.message} 
          reply={viewDialog.reply}
          onClose={() => setViewDialog({ open: false })} 
          onMarkRead={viewDialog.reply && !viewDialog.reply.readByStaff ? () => handleMarkRead(viewDialog.reply!.id) : undefined}
        />
      )}
    </>
  );
}

function ComposeMessageDialog({ open, onClose, onSend }: { open: boolean, onClose: () => void, onSend: (data: any) => void }) {
  const [form, setForm] = useState({
    subject: "",
    body: "",
    recipientType: "all_parents",
    channel: "announcement",
    priority: "normal",
    classId: "",
    studentId: "",
  });

  const { data: classesRes } = useAsync(api.getClasses);
  const { data: studentsRes } = useAsync(() => api.getStudents());
  const classes = classesRes || [];
  const students = studentsRes || [];

  const canSend = form.subject && form.body && (
    form.recipientType === "all_parents" || 
    (form.recipientType === "class_parents" && form.classId) ||
    (form.recipientType === "individual_parent" && form.studentId)
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Compose Message</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Subject" fullWidth size="small" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
          
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField select label="Recipients" sx={{ flex: 1 }} size="small" value={form.recipientType} onChange={e => setForm({ ...form, recipientType: e.target.value })}>
              <MenuItem value="all_parents">All Parents</MenuItem>
              <MenuItem value="class_parents">Class Parents</MenuItem>
              <MenuItem value="individual_parent">Individual Parent</MenuItem>
            </TextField>
            
            {form.recipientType === "class_parents" && (
              <TextField select label="Select Class" sx={{ flex: 1 }} size="small" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            )}

            {form.recipientType === "individual_parent" && (
              <TextField select label="Select Student" sx={{ flex: 1 }} size="small" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                {students.map(s => <MenuItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</MenuItem>)}
              </TextField>
            )}
          </Box>

          <TextField select label="Channel" fullWidth size="small" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as any })}>
            <MenuItem value="announcement">Announcement</MenuItem>
            <MenuItem value="circular">Circular</MenuItem>
            <MenuItem value="sms_alert">SMS Alert</MenuItem>
          </TextField>

          <TextField label="Message Body" multiline rows={4} fullWidth size="small" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<SendIcon />} onClick={() => {
          const cls = classes.find(c => c.id === form.classId);
          const std = students.find(s => s.id === form.studentId);
          onSend({ 
            ...form, 
            className: cls?.name, 
            studentName: std ? `${std.firstName} ${std.lastName}` : undefined,
            parentName: std ? std.parent.primaryContactName : undefined
          });
        }} disabled={!canSend}>Send</Button>
      </DialogActions>
    </Dialog>
  );
}

function MessageDetailDialog({ open, message, reply, onClose, onMarkRead }: { open: boolean, message?: SchoolMessage, reply?: ParentReply, onClose: () => void, onMarkRead?: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{reply ? "Parent Response" : "Message Detail"}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {message && (
          <Box sx={{ p: 2, bgcolor: "grey.50", border: 1, borderColor: "divider", borderRadius: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{formatDate(message.sentAt)}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>{message.subject}</Typography>
            <Typography variant="body2" color="text.secondary">{message.body}</Typography>
          </Box>
        )}
        
        {reply && (
          <Box sx={{ p: 2, borderLeft: 4, borderColor: "secondary.main", bgcolor: "secondary.light", borderRadius: "0 4px 4px 0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2" color="secondary.main">From: {reply.parentName}</Typography>
              <Typography variant="caption" color="text.secondary">{formatDate(reply.sentAt)}</Typography>
            </Box>
            <Typography variant="body2">{reply.body}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {onMarkRead && <Button color="primary" onClick={onMarkRead}>Mark as Read</Button>}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
