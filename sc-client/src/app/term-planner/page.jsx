"use client";

import { useState, useMemo, useEffect } from "react";
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
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";

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
import SettingsIcon from "@mui/icons-material/Settings";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { TERM_EVENT_COLORS, TERM_EVENT_ICONS } from "@/lib/termEventConfig";

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
  const [selectedYear, setSelectedYear] = useState(null);
  const [filters, setFilters] = useState({
    scope: "all",
    category: "all",
    status: "all",
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openPendingDialog, setOpenPendingDialog] = useState(false);
  const [openSetupYearDialog, setOpenSetupYearDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Fetch school info
  const { data: school } = useAsync(() => api.getSchool(), []);

  // Fetch academic terms
  const { data: allTerms, loading: termsLoading, refetch: refetchTerms } = useAsync(async () => {
    const terms = await api.getAcademicTerms();
    return terms;
  }, []);

  // Derive available years from terms
  const availableYears = useMemo(() => {
    if (!allTerms || allTerms.length === 0) return [2026];
    const years = [...new Set(allTerms.map((t) => t.year))];
    return years.sort((a, b) => b - a);
  }, [allTerms]);

  // Find current term to set initial year
  const currentTerm = useMemo(() => {
    if (!allTerms) return null;
    return allTerms.find((t) => t.isCurrent) || allTerms[0];
  }, [allTerms]);

  // Set selected year to current year on load
  useEffect(() => {
    if (currentTerm && selectedYear === null) {
      setSelectedYear(currentTerm.year);
    }
  }, [currentTerm, selectedYear]);

  // Get terms for selected year
  const termsForYear = useMemo(() => {
    if (!allTerms || !selectedYear) return [];
    return allTerms
      .filter((t) => t.year === selectedYear)
      .sort((a, b) => a.termNumber - b.termNumber);
  }, [allTerms, selectedYear]);

  // Fetch events for the selected year
  const { data: eventData, loading, error, refetch } = useAsync(async () => {
    if (!selectedYear) return [];
    const all = await api.getTermEvents({
      year: selectedYear,
      scope: filters.scope === "all" ? undefined : filters.scope,
      approvalStatus: filters.status,
    });

    let filtered = all;
    if (filters.category !== "all") {
      filtered = filtered.filter((e) => e.category === filters.category);
    }
    if (selectedDate) {
      filtered = filtered.filter((e) => {
        const start = e.startDate;
        const end = e.endDate;
        return selectedDate >= start && selectedDate <= end;
      });
    }
    return filtered;
  }, [filters, selectedDate, selectedYear]);

  const events = eventData || [];

  // Group events by term
  const eventsByTerm = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [] };
    events.forEach((e) => {
      const term = e.term || 1;
      if (!groups[term]) groups[term] = [];
      groups[term].push(e);
    });
    return groups;
  }, [events]);

  const pendingCount = useMemo(() => events.filter((e) => e.approvalStatus === "pending_approval").length, [events]);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await api.deleteTermEvent(id);
      showNotification("Event deleted", "success");
      refetch();
    }
  };

  const handleApprove = async (id) => {
    await api.approveTermEvent(id, user?.id || "sys", user?.name || "Admin");
    showNotification("Event approved and published", "success");
    refetch();
  };

  const handleReject = async (id, reason) => {
    await api.rejectTermEvent(id, user?.id || "sys", user?.name || "Admin", reason);
    showNotification("Event rejected", "info");
    refetch();
  };

  // Get school name without fallback
  const schoolName = school?.name || "";

  // Format term date range for header
  const currentTermDisplay = useMemo(() => {
    if (!currentTerm) return "";
    return `Term ${currentTerm.termNumber}, ${currentTerm.year} — ${formatDate(currentTerm.startDate)} to ${formatDate(currentTerm.endDate)}`;
  }, [currentTerm]);

  return (
    <Box>
      {/* Header with year selector */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <TextField
              select
              size="small"
              label="Year"
              value={selectedYear || ""}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              sx={{ minWidth: 120 }}
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </TextField>
            {currentTerm && (
              <Chip
                label={`Current: Term ${currentTerm.termNumber}, ${currentTerm.year}`}
                color="primary"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary">
            {schoolName} {currentTermDisplay}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <RoleGuard permission="settings.view">
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setOpenSetupYearDialog(true)}
            >
              Setup Year
            </Button>
          </RoleGuard>
          <RoleGuard permission="settings.view">
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setOpenPendingDialog(true)}
              startIcon={<Badge badgeContent={pendingCount} color="error"><CalendarMonthIcon /></Badge>}
            >
              Pending
            </Button>
          </RoleGuard>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingEvent(null); setOpenAddDialog(true); }}>
            Add Event
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
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
                onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                  Clear: {formatDate(selectedDate)}
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Term bands */}
      <DataState loading={termsLoading || loading} error={error} data={termsForYear} isEmpty={(d) => d.length === 0} emptyMessage="No academic terms configured for this year. Use 'Setup Year' to add terms.">
        <Stack spacing={3}>
          {termsForYear.map((term) => {
            const termEvents = eventsByTerm[term.termNumber] || [];
            const termEventsFiltered = termEvents.filter((e) => {
              const eventTerm = e.term;
              return eventTerm === term.termNumber;
            });

            return (
              <Paper key={term.id} elevation={term.isCurrent ? 2 : 0} sx={{ p: 2, border: 1, borderColor: term.isCurrent ? "primary.main" : "divider", bgcolor: term.isCurrent ? "primary.subtle" : "background.paper" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: term.isCurrent ? "primary.main" : "text.primary" }}>
                      Term {term.termNumber}
                      {term.isCurrent && <Chip label="Current" size="small" color="primary" sx={{ ml: 1 }} />}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(term.startDate)} — {formatDate(term.endDate)}
                    </Typography>
                  </Box>
                  <Chip label={`${termEventsFiltered.length} events`} size="small" variant="outlined" />
                </Box>

                <DataState
                  loading={loading}
                  data={termEventsFiltered}
                  isEmpty={(d) => d.length === 0}
                  emptyMessage={`No events scheduled for Term ${term.termNumber}`}
                >
                  <Stack spacing={2}>
                    {termEventsFiltered.map((event) => (
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
                </DataState>
              </Paper>
            );
          })}
        </Stack>
      </DataState>

      <AddEventDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={() => refetch()}
        editingEvent={editingEvent}
        defaultYear={selectedYear || 2026}
        defaultTerm={currentTerm?.termNumber || 1}
      />

      <PendingApprovalsDialog
        open={openPendingDialog}
        onClose={() => setOpenPendingDialog(false)}
        onSuccess={() => refetch()}
      />

      <SetupYearDialog
        open={openSetupYearDialog}
        onClose={() => setOpenSetupYearDialog(false)}
        onSuccess={() => { refetchTerms(); refetch(); }}
        existingYears={availableYears}
      />
    </Box>
  );
}

function EventCard({ event, onEdit, onDelete, onApprove, onReject, isAdmin }) {
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

function AddEventDialog({ open, onClose, onSuccess, editingEvent, defaultYear, defaultTerm }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "activity",
    description: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    scope: "school",
    visibleToParents: true,
    term: defaultTerm,
    year: defaultYear,
  });

  const { data: classesData } = useAsync(() => api.getClasses(), []);
  const { data: examsData } = useAsync(() => api.getExams({ term: defaultTerm, year: defaultYear }), [defaultTerm, defaultYear]);
  const classes = classesData || [];
  const exams = examsData || [];

  useMemo(() => {
    if (editingEvent) setFormData({ ...editingEvent, term: editingEvent.term || defaultTerm, year: editingEvent.year || defaultYear });
    else setFormData({
      title: "",
      category: "activity",
      description: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      scope: "school",
      visibleToParents: true,
      term: defaultTerm,
      year: defaultYear,
    });
  }, [editingEvent, open, defaultTerm, defaultYear]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = {
        ...formData,
        isRange: formData.startDate !== formData.endDate,
        term: formData.term || defaultTerm,
        year: formData.year || defaultYear,
        createdBy: user?.id,
        createdByName: user?.name,
        role: user?.role,
      };

      if (editingEvent) {
        await api.updateTermEvent(editingEvent.id, data);
        showNotification("Event updated", "success");
      } else {
        const res = await api.createTermEvent(data);
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
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField
                select
                label="Term"
                fullWidth
                value={formData.term || defaultTerm}
                onChange={(e) => setFormData({ ...formData, term: Number(e.target.value) })}
              >
                <MenuItem value={1}>Term 1</MenuItem>
                <MenuItem value={2}>Term 2</MenuItem>
                <MenuItem value={3}>Term 3</MenuItem>
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField
                label="Year"
                type="number"
                fullWidth
                value={formData.year || defaultYear}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              />
            </Grid>
          </Grid>
          <TextField
            label="Title"
            fullWidth
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <TextField
            select
            label="Category"
            fullWidth
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                helperText="Same as start for single day"
              />
            </Grid>
          </Grid>
          <TextField
            select
            label="Scope"
            fullWidth
            value={formData.scope}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => <MenuItem key={g} value={`Grade ${g}`}>Grade {g}</MenuItem>)}
              {[1, 2, 3, 4].map((g) => <MenuItem key={g} value={`Form ${g}`}>Form {g}</MenuItem>)}
            </TextField>
          )}

          {formData.scope === "class" && (
            <TextField
              label="Class"
              select
              fullWidth
              value={formData.classId || ''}
              onChange={(e) => {
                const cls = classes.find((c) => c.id === e.target.value);
                setFormData({ ...formData, classId: e.target.value, className: cls?.name });
              }}
            >
              {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          )}

          {formData.category === "exam" && (
            <TextField
              label="Linked Exam"
              select
              fullWidth
              value={formData.examId || ''}
              onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
              placeholder="Optional link to exam"
            >
              <MenuItem value="">None</MenuItem>
              {exams.map((ex) => <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>)}
            </TextField>
          )}

          <FormControlLabel
            control={<Switch checked={formData.visibleToParents} onChange={(e) => setFormData({ ...formData, visibleToParents: e.target.checked })} />}
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

function PendingApprovalsDialog({ open, onClose, onSuccess }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { data: pendingEventsData, loading, refetch } = useAsync(() => api.getTermEvents({ approvalStatus: "pending_approval" }), [open]);
  const pendingEvents = pendingEventsData || [];
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState("");

  const handleApprove = async (id) => {
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
        <DataState loading={loading} data={pendingEvents} isEmpty={(d) => d.length === 0} emptyMessage="No pending approvals">
          {(items) => (
            <List>
               {items.map((event) => (
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
                      <TextField size="small" placeholder="Rejection reason" fullWidth value={reason} onChange={(e) => setReason(e.target.value)} />
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

function SetupYearDialog({ open, onClose, onSuccess, existingYears }) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [terms, setTerms] = useState([
    { termNumber: 1, startDate: "", endDate: "", isCurrent: false },
    { termNumber: 2, startDate: "", endDate: "", isCurrent: false },
    { termNumber: 3, startDate: "", endDate: "", isCurrent: true },
  ]);

  useEffect(() => {
    if (open) {
      setYear(new Date().getFullYear());
      setTerms([
        { termNumber: 1, startDate: "", endDate: "", isCurrent: false },
        { termNumber: 2, startDate: "", endDate: "", isCurrent: false },
        { termNumber: 3, startDate: "", endDate: "", isCurrent: true },
      ]);
    }
  }, [open]);

  const handleTermChange = (idx, field, value) => {
    setTerms((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      // If setting a term as current, unset others
      if (field === "isCurrent" && value === true) {
        updated.forEach((t, i) => {
          if (i !== idx) t.isCurrent = false;
        });
      }
      return updated;
    });
  };

  const handleSave = async () => {
    const validTerms = terms.filter((t) => t.startDate && t.endDate);
    if (validTerms.length === 0) {
      showNotification("Please fill in at least one term with start and end dates", "error");
      return;
    }

    setLoading(true);
    try {
      await api.setupAcademicYear(year, validTerms);
      showNotification(`Academic year ${year} configured successfully`, "success");
      onSuccess();
      onClose();
    } catch (error) {
      showNotification(error.message || "Failed to setup academic year", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Setup Academic Year</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Year"
            type="number"
            fullWidth
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            helperText={existingYears.includes(year) ? "This year already has terms configured — this will update them" : ""}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Term Dates</Typography>
          {terms.map((term, idx) => (
            <Card key={term.termNumber} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Term {term.termNumber}</Typography>
              <Grid container spacing={2}>
                <Grid size={5}>
                  <TextField
                    label="Start Date"
                    type="date"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={term.startDate}
                    onChange={(e) => handleTermChange(idx, "startDate", e.target.value)}
                  />
                </Grid>
                <Grid size={5}>
                  <TextField
                    label="End Date"
                    type="date"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={term.endDate}
                    onChange={(e) => handleTermChange(idx, "endDate", e.target.value)}
                  />
                </Grid>
                <Grid size={2}>
                  <FormControlLabel
                    control={<Switch checked={term.isCurrent} onChange={(e) => handleTermChange(idx, "isCurrent", e.target.checked)} />}
                    label="Current"
                    labelPlacement="top"
                  />
                </Grid>
              </Grid>
            </Card>
          ))}
          <Alert severity="info">Only terms with both start and end dates will be saved. Exactly 3 terms are expected per year.</Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          Save Terms
        </Button>
      </DialogActions>
    </Dialog>
  );
}
