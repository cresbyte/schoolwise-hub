"use client";

import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { TERM_EVENT_COLORS, TERM_EVENT_ICONS } from "@/lib/termEventConfig";
import type { TermEvent, TermEventCategory, TermEventScope, ApprovalStatus, ClassRoom } from "@/lib/types";

export default function TermPlannerPage() {
  return (
    <DashboardLayout>
      <RoleGuard permission="classes.view">
        <TermPlannerContent />
      </RoleGuard>
    </DashboardLayout>
  );
}

function TermPlannerContent() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [filters, setFilters] = useState<{
    scope: TermEventScope | "all";
    category: TermEventCategory | "all";
    status: ApprovalStatus | "all";
  }>({
    scope: "all",
    category: "all",
    status: "all",
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openPendingDialog, setOpenPendingDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TermEvent | null>(null);

  const { data: eventData, loading, error, refetch } = useAsync(async () => {
    const all = await api.getTermEvents({
      term: 2,
      year: 2026,
      scope: filters.scope === "all" ? undefined : filters.scope as TermEventScope,
      approvalStatus: filters.status,
    });

    let filtered = all;
    if (filters.category !== "all") {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    if (selectedDate) {
      filtered = filtered.filter(e => {
        const start = e.startDate;
        const end = e.endDate;
        return selectedDate >= start && selectedDate <= end;
      });
    }
    return filtered;
  }, [filters, selectedDate]);

  const events = eventData || [];

  const pendingCount = useMemo(() => events.filter(e => e.approvalStatus === "pending_approval").length, [events]);

  const eventsByMonth = useMemo(() => {
    const groups: Record<string, TermEvent[]> = {};
    events.forEach(e => {
      const monthYear = new Date(e.startDate).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(e);
    });
    return groups;
  }, [events]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await api.deleteTermEvent(id);
      showNotification("Event deleted", "success");
      refetch();
    }
  };

  const handleApprove = async (id: string) => {
    await api.approveTermEvent(id, user?.id || "sys", user?.name || "Admin");
    showNotification("Event approved and published", "success");
    refetch();
  };

  const handleReject = async (id: string, reason: string) => {
    await api.rejectTermEvent(id, user?.id || "sys", user?.name || "Admin", reason);
    showNotification("Event rejected", "info");
    refetch();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="body1" color="text.secondary">
            Primrose Academy Term 2, 2026 — May 6 to Aug 9
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <RoleGuard permission="settings.view">
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setOpenPendingDialog(true)}
              startIcon={<Badge badgeContent={pendingCount} color="error"><CalendarMonthIcon /></Badge>}
            >
              Pending Approvals
            </Button>
          </RoleGuard>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingEvent(null); setOpenAddDialog(true); }}>
            Add Event
          </Button>
        </Stack>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Scope"
                value={filters.scope}
                onChange={(e) => setFilters({ ...filters, scope: e.target.value as any })}
              >
                <MenuItem value="all">All Scopes</MenuItem>
                <MenuItem value="school">School-wide</MenuItem>
                <MenuItem value="grade">Grade Level</MenuItem>
                <MenuItem value="class">Specific Class</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value as any })}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="exam">Exam</MenuItem>
                <MenuItem value="holiday">Holiday</MenuItem>
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="activity">Activity</MenuItem>
                <MenuItem value="trip">Trip</MenuItem>
                <MenuItem value="deadline">Deadline</MenuItem>
                <MenuItem value="closure">Closure</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pending_approval">Pending</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {selectedDate && (
                <Button size="small" onClick={() => setSelectedDate(null)} startIcon={<CancelIcon />}>
                  Clear Date: {formatDate(selectedDate)}
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <DataState loading={loading} error={error} data={events} isEmpty={(d) => d.length === 0} emptyMessage="No events found matching your criteria.">
            {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
              <Box key={month} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "primary.main", borderBottom: 1, borderColor: "divider", pb: 0.5 }}>
                  {month}
                </Typography>
                <Stack spacing={2}>
                  {monthEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={() => { setEditingEvent(event); setOpenAddDialog(true); }}
                      onDelete={() => handleDelete(event.id)}
                      onApprove={() => handleApprove(event.id)}
                      onReject={(reason) => handleReject(event.id, reason)}
                      isAdmin={["admin", "headteacher", "deputy", "hod"].includes(user?.role || "")}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </DataState>
        </Grid>
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <MiniCalendar events={events} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </Grid>
      </Grid>

      <AddEventDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={() => refetch()}
        editingEvent={editingEvent}
      />

      <PendingApprovalsDialog
        open={openPendingDialog}
        onClose={() => setOpenPendingDialog(false)}
        onSuccess={() => refetch()}
      />
    </Box>
  );
}

function EventCard({ event, onEdit, onDelete, onApprove, onReject, isAdmin }: {
  event: TermEvent;
  onEdit: () => void;
  onDelete: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isAdmin: boolean;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const duration = useMemo(() => {
    if (!event.isRange) return null;
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} days`;
  }, [event]);

  return (
    <Card sx={{
      borderLeft: 6,
      borderColor: TERM_EVENT_COLORS[event.category],
      position: "relative",
      "&:hover": { boxShadow: 4 }
    }}>
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label={`${TERM_EVENT_ICONS[event.category]} ${event.category.toUpperCase()}`}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
              />
              <Chip
                label={event.scope === "school" ? "School-wide" : event.className || event.gradeLevel}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
              />
              {event.approvalStatus !== "approved" && (
                <Chip
                  label={event.approvalStatus.replace("_", " ").toUpperCase()}
                  size="small"
                  color={event.approvalStatus === "pending_approval" ? "warning" : event.approvalStatus === "rejected" ? "error" : "default"}
                  sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                />
              )}
            </Stack>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{event.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              {event.isRange ? `${formatDate(event.startDate)} – ${formatDate(event.endDate)}` : formatDate(event.startDate)}
              {duration && <Chip label={duration} size="small" variant="filled" sx={{ height: 18, fontSize: 10, bgcolor: "action.hover" }} />}
            </Typography>
            {event.visibleToParents && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                <VisibilityIcon sx={{ fontSize: 12 }} /> Visible to parents
              </Typography>
            )}
            {event.rejectionReason && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: "block", fontStyle: "italic" }}>
                Reason for rejection: {event.rejectionReason}
              </Typography>
            )}
          </Box>
          <Box>
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={onEdit}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={onDelete} color="error"><DeleteIcon fontSize="small" /></IconButton>
            </Stack>
          </Box>
        </Box>

        {isAdmin && event.approvalStatus === "pending_approval" && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
            {!showRejectInput ? (
              <Stack direction="row" spacing={2}>
                <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={onApprove}>
                  Approve
                </Button>
                <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setShowRejectInput(true)}>
                  Reject
                </Button>
              </Stack>
            ) : (
              <Stack spacing={1}>
                <TextField
                  size="small"
                  label="Rejection Reason"
                  fullWidth
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" color="error" onClick={() => onReject(rejectReason)} disabled={!rejectReason.trim()}>
                    Confirm Rejection
                  </Button>
                  <Button size="small" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                </Stack>
              </Stack>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function MiniCalendar({ events, selectedDate, onDateSelect }: {
  events: TermEvent[],
  selectedDate: string | null,
  onDateSelect: (d: string | null) => void
}) {
  const [currentViewDate, setCurrentViewDate] = useState(new Date(2026, 5, 1)); // June 2026

  const daysInMonth = useMemo(() => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMo = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMo; i++) {
      days.push(new Date(year, month, i).toISOString().split('T')[0]);
    }
    return days;
  }, [currentViewDate]);

  const monthLabel = currentViewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getDayEvents = (isoDate: string) => {
    return events.filter(e => isoDate >= e.startDate && isoDate <= e.endDate && e.approvalStatus === "approved");
  };

  const handlePrev = () => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1));
  const handleNext = () => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));

  return (
    <Card sx={{ position: "sticky", top: 80 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{monthLabel}</Typography>
          <Box>
            <IconButton size="small" onClick={handlePrev}><ChevronLeftIcon /></IconButton>
            <IconButton size="small" onClick={handleNext}><ChevronRightIcon /></IconButton>
          </Box>
        </Box>
        <Grid container columns={7} sx={{ borderBottom: 1, borderColor: "divider", pb: 1, mb: 1 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <Grid size={1} key={d} sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>{d}</Typography>
            </Grid>
          ))}
        </Grid>
        <Grid container columns={7}>
          {daysInMonth.map((date, idx) => {
            if (!date) return <Grid size={1} key={`pad-${idx}`} sx={{ height: 40 }} />;

            const dayNum = parseInt(date.split('-')[2]);
            const dayEvents = getDayEvents(date);
            const isSelected = selectedDate === date;
            const isToday = new Date().toISOString().split('T')[0] === date;

            return (
              <Grid
                size={1}
                key={date}
                sx={{
                  height: 44,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  bgcolor: isSelected ? "primary.light" : "transparent",
                  borderRadius: 1,
                  "&:hover": { bgcolor: isSelected ? "primary.light" : "action.hover" }
                }}
                onClick={() => onDateSelect(isSelected ? null : date)}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isSelected || isToday ? 800 : 500,
                    color: isToday ? "primary.main" : isSelected ? "white" : "text.primary",
                    mt: 0.5,
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: isToday ? 1 : 0,
                    borderColor: "primary.main"
                  }}
                >
                  {dayNum}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, mt: 0.25, justifyContent: "center" }}>
                  {dayEvents.slice(0, 3).map(e => (
                    <Box
                      key={e.id}
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        bgcolor: TERM_EVENT_COLORS[e.category]
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <Typography sx={{ fontSize: 8, lineHeight: 1 }}>+</Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}

function AddEventDialog({ open, onClose, onSuccess, editingEvent }: {
  open: boolean,
  onClose: () => void,
  onSuccess: () => void,
  editingEvent: TermEvent | null
}) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<TermEvent>>({
    title: "",
    category: "activity",
    description: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    scope: "school",
    visibleToParents: true,
  });

  const { data: classesData } = useAsync(() => api.getClasses(), []);
  const { data: examsData } = useAsync(() => api.getExams({ term: 2, year: 2026 }), []);
  const classes = classesData || [];
  const exams = examsData || [];

  useMemo(() => {
    if (editingEvent) setFormData(editingEvent);
    else setFormData({
      title: "",
      category: "activity",
      description: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      scope: "school",
      visibleToParents: true,
    });
  }, [editingEvent, open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = {
        ...formData,
        isRange: formData.startDate !== formData.endDate,
        term: 2 as any,
        year: 2026,
        createdBy: user?.id,
        createdByName: user?.name,
        role: user?.role,
      };

      if (editingEvent) {
        await api.updateTermEvent(editingEvent.id, data);
        showNotification("Event updated", "success");
      } else {
        const res = await api.createTermEvent(data as any);
        if (res.approvalStatus === "pending_approval") {
          showNotification("Event submitted for approval", "info");
        } else {
          showNotification("Event added to term calendar", "success");
        }
      }
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editingEvent ? "Edit Term Event" : "Add Term Event"}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            fullWidth
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
          <TextField
            select
            label="Category"
            fullWidth
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value as TermEventCategory })}
          >
            {Object.entries(TERM_EVENT_ICONS).map(([cat, icon]) => (
              <MenuItem key={cat} value={cat}>{icon} {cat.toUpperCase()}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                helperText="Same as start for single day"
              />
            </Grid>
          </Grid>
          <TextField
            select
            label="Scope"
            fullWidth
            value={formData.scope}
            onChange={e => setFormData({ ...formData, scope: e.target.value as TermEventScope })}
          >
            <MenuItem value="school">School-wide</MenuItem>
            <MenuItem value="grade">Specific Grade</MenuItem>
            <MenuItem value="class">Specific Class</MenuItem>
          </TextField>

          {formData.scope === "grade" && (
            <TextField
              label="Grade Level"
              select
              fullWidth
              value={formData.gradeLevel || ''}
              onChange={e => setFormData({ ...formData, gradeLevel: e.target.value })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => <MenuItem key={g} value={`Grade ${g}`}>Grade {g}</MenuItem>)}
              {[1, 2, 3, 4].map(g => <MenuItem key={g} value={`Form ${g}`}>Form {g}</MenuItem>)}
            </TextField>
          )}

          {formData.scope === "class" && (
            <TextField
              label="Class"
              select
              fullWidth
              value={formData.classId || ''}
              onChange={e => {
                const cls = classes.find((c: ClassRoom) => c.id === e.target.value);
                setFormData({ ...formData, classId: e.target.value, className: cls?.name });
              }}
            >
              {classes.map((c: ClassRoom) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          )}

          {formData.category === "exam" && (
            <TextField
              label="Linked Exam"
              select
              fullWidth
              value={formData.examId || ''}
              onChange={e => setFormData({ ...formData, examId: e.target.value })}
              placeholder="Optional link to exam"
            >
              <MenuItem value="">None</MenuItem>
              {exams.map((ex: any) => <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>)}
            </TextField>
          )}

          <FormControlLabel
            control={<Switch checked={formData.visibleToParents} onChange={e => setFormData({ ...formData, visibleToParents: e.target.checked })} />}
            label="Visible to Parents"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading || !formData.title}>
          {editingEvent ? "Update Event" : "Create Event"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PendingApprovalsDialog({ open, onClose, onSuccess }: { open: boolean, onClose: () => void, onSuccess: () => void }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { data: pendingEventsData, loading, refetch } = useAsync(() => api.getTermEvents({ approvalStatus: "pending_approval" }), [open]);
  const pendingEvents = pendingEventsData || [];
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleApprove = async (id: string) => {
    await api.approveTermEvent(id, user?.id || "sys", user?.name || "Admin");
    showNotification("Event approved and published", "success");
    refetch();
    onSuccess();
  };

  const handleReject = async () => {
    if (!rejectId || !reason.trim()) return;
    await api.rejectTermEvent(rejectId, user?.id || "sys", user?.name || "Admin", reason);
    showNotification("Event rejected", "info");
    setRejectId(null);
    setReason("");
    refetch();
    onSuccess();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Pending Event Approvals</DialogTitle>
      <DialogContent>
        <DataState loading={loading} data={pendingEvents} isEmpty={(d) => d.length === 0} emptyMessage="No pending approvals 🎉">
          {(items) => (
            <List>
              {items.map(event => (
                <ListItem key={event.id} sx={{ bgcolor: "action.hover", borderRadius: 1, mb: 1, flexDirection: "column", alignItems: "flex-start" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                    <ListItemText
                      primary={event.title}
                      secondary={`${event.createdByName} | ${event.scope.toUpperCase()} | ${formatDate(event.startDate)}`}
                    />
                    <Stack direction="row" spacing={1}>
                      <Chip label={event.category} size="small" />
                      <Button size="small" variant="contained" color="success" onClick={() => handleApprove(event.id)}>Approve</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => setRejectId(event.id)}>Reject</Button>
                    </Stack>
                  </Box>
                  {rejectId === event.id && (
                    <Box sx={{ mt: 1, width: "100%", display: "flex", gap: 1 }}>
                      <TextField size="small" placeholder="Rejection reason" fullWidth value={reason} onChange={e => setReason(e.target.value)} />
                      <Button size="small" variant="contained" color="error" onClick={handleReject}>Go</Button>
                      <Button size="small" onClick={() => setRejectId(null)}>X</Button>
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </DataState>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
