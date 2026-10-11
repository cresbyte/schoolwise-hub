"use client";

import { useState, useMemo } from "react";
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
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Tabs,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SchoolIcon from "@mui/icons-material/School";
import StarIcon from "@mui/icons-material/Star";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const CATEGORIES = [
  { value: "exam", label: "Exam", color: "error" },
  { value: "holiday", label: "Holiday", color: "success" },
  { value: "closure", label: "Closure", color: "info" },
  { value: "meeting", label: "Meeting", color: "primary" },
  { value: "activity", label: "Activity", color: "secondary" },
  { value: "trip", label: "Trip", color: "warning" },
  { value: "deadline", label: "Deadline", color: "error" },
  { value: "other", label: "Other", color: "default" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

const SCOPES = [
  { value: "school", label: "School-wide" },
  { value: "grade", label: "Grade Level" },
  { value: "class", label: "Specific Class" },
];

const APPROVAL_STATUSES = [
  { value: "draft", label: "Draft", color: "default" },
  { value: "pending_approval", label: "Pending", color: "warning" },
  { value: "approved", label: "Approved", color: "success" },
  { value: "rejected", label: "Rejected", color: "error" },
];

const APPROVAL_MAP = Object.fromEntries(APPROVAL_STATUSES.map((s) => [s.value, s]));

export default function AcademicTermsPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="academics.view">
        <TermsContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function TermsContent() {
  const { showNotification } = useNotification();
  const [tab, setTab] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch data
  const {
    data: terms = [],
    loading: loadingTerms,
    refetch: refetchTerms,
  } = useAsync(() => api.getAcademicTerms({ year: selectedYear }), [selectedYear]);
  const {
    data: events = [],
    loading: loadingEvents,
    refetch: refetchEvents,
  } = useAsync(() => api.getTermEvents({ year: selectedYear }), [selectedYear]);
  const { data: classes = [] } = useAsync(() => api.getClasses(), []);

  const [yearDialog, setYearDialog] = useState(false);
  const [termDialog, setTermDialog] = useState(null);
  const [eventDialog, setEventDialog] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(null);

  const termList = Array.isArray(terms) ? terms : terms?.results || [];
  const eventList = Array.isArray(events) ? events : events?.results || [];

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === "term") {
        await api.deleteAcademicTerm(deleteConfirm.item.id);
        refetchTerms();
      } else if (deleteConfirm.type === "event") {
        await api.deleteTermEvent(deleteConfirm.item.id);
        refetchEvents();
      }
      showNotification(`${deleteConfirm.type === "term" ? "Term" : "Event"} deleted`, "success");
      setDeleteConfirm(null);
    } catch (e) {
      showNotification(e.message || "Failed to delete", "error");
    }
  };

  const handleApprove = async (event) => {
    try {
      await api.approveTermEvent(event.id);
      showNotification(`"${event.title}" approved`, "success");
      refetchEvents();
    } catch (e) {
      showNotification(e.message || "Failed to approve", "error");
    }
  };

  const handleReject = async (event, reason) => {
    try {
      await api.rejectTermEvent(event.id, null, null, reason);
      showNotification(`"${event.title}" rejected`, "info");
      setRejectDialog(null);
      refetchEvents();
    } catch (e) {
      showNotification(e.message || "Failed to reject", "error");
    }
  };

  const handleSetCurrent = async (term) => {
    try {
      await api.updateAcademicTerm(term.id, { ...term, isCurrent: true });
      showNotification(`Term ${term.termNumber} set as current`, "success");
      refetchTerms();
    } catch (e) {
      showNotification(e.message || "Failed to update", "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Academic Calendar"
        subtitle="Manage academic terms, events, and the school calendar"
        actions={
          <Stack direction="row" spacing={1}>
            <TextField
              select
              size="small"
              label="Academic Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              sx={{ width: 140 }}
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
            <RoleGuard permission="academics.manage">
              <Button
                variant="contained"
                startIcon={<SchoolIcon />}
                onClick={() => setYearDialog(true)}
              >
                Setup Year
              </Button>
            </RoleGuard>
          </Stack>
        }
      />

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Terms Overview" />
          <Tab label={`Events (${eventList.length})`} />
          <Tab label="Calendar View" />
        </Tabs>

        <CardContent>
          {tab === 0 && (
            <TermsOverview
              terms={termList}
              events={eventList}
              selectedYear={selectedYear}
              onAddTerm={() => setTermDialog({})}
              onEditTerm={(term) => setTermDialog(term)}
              onDeleteTerm={(term) => setDeleteConfirm({ type: "term", item: term })}
              onSetCurrent={handleSetCurrent}
            />
          )}
          {tab === 1 && (
            <EventsList
              events={eventList}
              classes={classes || []}
              loading={loadingEvents}
              onAddEvent={() => setEventDialog({})}
              onEditEvent={(event) => setEventDialog(event)}
              onDeleteEvent={(event) => setDeleteConfirm({ type: "event", item: event })}
              onApprove={handleApprove}
              onReject={(event) => setRejectDialog(event)}
            />
          )}
          {tab === 2 && <CalendarView events={eventList} selectedYear={selectedYear} />}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {yearDialog && (
        <SetupYearDialog
          year={selectedYear}
          existingTerms={termList}
          onClose={() => setYearDialog(false)}
          onSaved={() => {
            setYearDialog(false);
            refetchTerms();
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}

      {termDialog !== null && (
        <TermDialog
          term={termDialog}
          year={selectedYear}
          onClose={() => setTermDialog(null)}
          onSaved={() => {
            setTermDialog(null);
            refetchTerms();
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}

      {eventDialog !== null && (
        <EventDialog
          event={eventDialog}
          terms={termList}
          classes={classes || []}
          year={selectedYear}
          onClose={() => setEventDialog(null)}
          onSaved={() => {
            setEventDialog(null);
            refetchEvents();
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}

      {deleteConfirm && (
        <Dialog open onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete {deleteConfirm.type === "term" ? "Term" : "Event"}?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{deleteConfirm.item.title || `Term ${deleteConfirm.item.termNumber}`}</strong>
              ?{deleteConfirm.type === "term" && " This action cannot be undone."}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {rejectDialog && (
        <RejectDialog
          event={rejectDialog}
          onClose={() => setRejectDialog(null)}
          onReject={handleReject}
        />
      )}
    </>
  );
}

// ─── Terms Overview Tab ─────────────────────────────────────────────────────
function TermsOverview({
  terms,
  events,
  selectedYear,
  onAddTerm,
  onEditTerm,
  onDeleteTerm,
  onSetCurrent,
}) {
  if (terms.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <SchoolIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No terms set up for {selectedYear}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Click "Setup Year" to create Term 1, 2, and 3 for this academic year.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {terms.map((term) => {
        const termEvents = events.filter(
          (e) => e.term === term.termNumber && e.year === selectedYear,
        );
        const upcomingEvents = termEvents.filter((e) => new Date(e.startDate) >= new Date());
        const isCurrent = term.isCurrent;

        return (
          <Grid size={{ xs: 12, md: 4 }} key={term.id}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderTop: 4,
                borderColor: isCurrent ? "success.main" : "primary.main",
                position: "relative",
              }}
            >
              {isCurrent && (
                <Chip
                  icon={<StarIcon />}
                  label="Current Term"
                  color="success"
                  size="small"
                  sx={{ position: "absolute", top: 8, right: 8 }}
                />
              )}
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                    pr: isCurrent ? 10 : 0,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Term {term.termNumber}
                  </Typography>
                </Box>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Starts
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(term.startDate)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Ends
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(term.endDate)}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Events
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {termEvents.length}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">
                    Upcoming
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {upcomingEvents.length}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2, display: "flex", gap: 1, justifyContent: "flex-end" }}>
                  {!isCurrent && (
                    <Tooltip title="Set as current term">
                      <IconButton size="small" color="success" onClick={() => onSetCurrent(term)}>
                        <StarIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Edit term">
                    <IconButton size="small" onClick={() => onEditTerm(term)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete term">
                    <IconButton size="small" color="error" onClick={() => onDeleteTerm(term)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}

      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderStyle: "dashed",
            cursor: "pointer",
            "&:hover": { bgcolor: "action.hover" },
          }}
          onClick={onAddTerm}
        >
          <Stack alignItems="center" spacing={1}>
            <AddIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography color="primary" fontWeight={600}>
              Add Term
            </Typography>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}

// ─── Events List Tab ────────────────────────────────────────────────────────
function EventsList({
  events,
  classes,
  loading,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onApprove,
  onReject,
}) {
  const [filterTerm, setFilterTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterTerm && e.term !== Number(filterTerm)) return false;
      if (filterCategory && e.category !== filterCategory) return false;
      if (filterStatus && e.approvalStatus !== filterStatus) return false;
      return true;
    });
  }, [events, filterTerm, filterCategory, filterStatus]);

  return (
    <Box>
      {/* Filters */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }} flexwrap="wrap">
        <TextField
          select
          size="small"
          label="Term"
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          sx={{ width: { xs: "100%", sm: 120 } }}
        >
          <MenuItem value="">All Terms</MenuItem>
          <MenuItem value={1}>Term 1</MenuItem>
          <MenuItem value={2}>Term 2</MenuItem>
          <MenuItem value={3}>Term 3</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Category"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          sx={{ width: { xs: "100%", sm: 150 } }}
        >
          <MenuItem value="">All Categories</MenuItem>
          {CATEGORIES.map((c) => (
            <MenuItem key={c.value} value={c.value}>
              {c.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={{ width: { xs: "100%", sm: 150 } }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {APPROVAL_STATUSES.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <RoleGuard permission="academics.manage">
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAddEvent}>
            Add Event
          </Button>
        </RoleGuard>
      </Stack>

      <DataState
        loading={loading}
        data={filteredEvents}
        isEmpty={(d) => d.length === 0}
        emptyMessage="No events found for the selected filters."
      >
        {(list) => (
          <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
            <Table>
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell>Event Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Term</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((event) => {
                  const catInfo = CATEGORY_MAP[event.category] || {
                    label: event.category,
                    color: "default",
                  };
                  const statusInfo = APPROVAL_MAP[event.approvalStatus] || {
                    label: event.approvalStatus,
                    color: "default",
                  };
                  return (
                    <TableRow key={event.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {event.title}
                        {event.visibleToParents && (
                          <Chip
                            size="small"
                            label="Parents"
                            sx={{ ml: 1, fontSize: 10, height: 18 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={catInfo.label}
                          color={catInfo.color}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {event.scope === "school"
                          ? "Whole School"
                          : event.scope === "grade"
                            ? `Grade ${event.gradeLevel}`
                            : event.className || "—"}
                      </TableCell>
                      <TableCell>Term {event.term}</TableCell>
                      <TableCell>{formatDate(event.startDate)}</TableCell>
                      <TableCell>{formatDate(event.endDate)}</TableCell>
                      <TableCell>
                        {event.scope === "school" ? (
                          <Chip size="small" label="School" variant="outlined" />
                        ) : (
                          <Typography variant="body2">
                            {event.className || event.gradeLevel || "—"}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={statusInfo.label} color={statusInfo.color} />
                      </TableCell>
                      <TableCell align="right">
                        <RoleGuard permission="academics.manage">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {event.approvalStatus === "pending_approval" && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => onApprove(event)}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onReject(event)}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => onEditEvent(event)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDeleteEvent(event)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </RoleGuard>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataState>
    </Box>
  );
}

// ─── Calendar View Tab ──────────────────────────────────────────────────────
function CalendarView({ events, selectedYear }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const monthName = new Date(selectedYear, currentMonth).toLocaleString("default", {
    month: "long",
  });
  const daysInMonth = new Date(selectedYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, currentMonth, 1).getDay();

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() === currentMonth && d.getFullYear() === selectedYear) {
          const key = d.getDate();
          if (!map[key]) map[key] = [];
          map[key].push(e);
        }
      }
    });
    return map;
  }, [events, currentMonth, selectedYear]);

  const prevMonth = () => setCurrentMonth((m) => (m === 0 ? 11 : m - 1));
  const nextMonth = () => setCurrentMonth((m) => (m === 11 ? 0 : m + 1));

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Button onClick={prevMonth}>← Previous</Button>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {monthName} {selectedYear}
        </Typography>
        <Button onClick={nextMonth}>Next →</Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          p: 1,
        }}
      >
        {days.map((d) => (
          <Box
            key={d}
            sx={{ textAlign: "center", fontWeight: 700, py: 1, bgcolor: "action.hover" }}
          >
            {d}
          </Box>
        ))}

        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <Box key={`empty-${i}`} sx={{ minHeight: 90 }} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayEvents = eventsByDate[dayNum] || [];
          const isToday =
            new Date().toDateString() ===
            new Date(selectedYear, currentMonth, dayNum).toDateString();

          return (
            <Box
              key={dayNum}
              sx={{
                minHeight: 90,
                p: 0.5,
                border: 1,
                borderColor: isToday ? "primary.main" : "divider",
                borderRadius: 1,
                bgcolor: isToday ? "primary.main" + "08" : "transparent",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: isToday ? 800 : 500,
                  color: isToday ? "primary.main" : "text.primary",
                }}
              >
                {dayNum}
              </Typography>
              <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                {dayEvents.slice(0, 2).map((e) => {
                  const catInfo = CATEGORY_MAP[e.category] || { color: "default" };
                  return (
                    <Tooltip key={e.id} title={`${e.title} (${catInfo.label})`}>
                      <Chip
                        size="small"
                        label={e.title}
                        color={catInfo.color}
                        sx={{ fontSize: 9, height: 18, justifyContent: "flex-start" }}
                      />
                    </Tooltip>
                  );
                })}
                {dayEvents.length > 2 && (
                  <Typography variant="caption" color="text.secondary">
                    +{dayEvents.length - 2} more
                  </Typography>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Setup Year Dialog ──────────────────────────────────────────────────────
function SetupYearDialog({ year, existingTerms, onClose, onSaved, onError }) {
  const [terms, setTerms] = useState([
    { termNumber: 1, startDate: `${year}-01-06`, endDate: `${year}-04-12`, isCurrent: false },
    { termNumber: 2, startDate: `${year}-05-04`, endDate: `${year}-08-09`, isCurrent: false },
    { termNumber: 3, startDate: `${year}-09-01`, endDate: `${year}-12-12`, isCurrent: false },
  ]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.setupAcademicYear(year, terms);
      onSaved();
    } catch (e) {
      onError(e.message || "Failed to setup year");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Setup Academic Year {year}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Define the start and end dates for each term. You can mark one as the current term.
        </Alert>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {terms.map((t, idx) => (
            <Card key={t.termNumber} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Term {t.termNumber}
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={t.startDate}
                  onChange={(e) => {
                    const newTerms = [...terms];
                    newTerms[idx] = { ...t, startDate: e.target.value };
                    setTerms(newTerms);
                  }}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={t.endDate}
                  onChange={(e) => {
                    const newTerms = [...terms];
                    newTerms[idx] = { ...t, endDate: e.target.value };
                    setTerms(newTerms);
                  }}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                />
              </Stack>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={t.isCurrent}
                    onChange={(e) => {
                      const newTerms = terms.map((term, i) => ({
                        ...term,
                        isCurrent: i === idx ? e.target.checked : false,
                      }));
                      setTerms(newTerms);
                    }}
                  />
                }
                label="Set as current term"
              />
            </Card>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Setting up..." : "Setup Year"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Term Dialog ────────────────────────────────────────────────────────────
function TermDialog({ term, year, onClose, onSaved, onError }) {
  const isEdit = !!term.id;
  const [form, setForm] = useState({
    termNumber: term.termNumber || 1,
    startDate: term.startDate || "",
    endDate: term.endDate || "",
    isCurrent: term.isCurrent || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.startDate || !form.endDate) return onError("Start and end dates are required");
    setSaving(true);
    try {
      const payload = { year, ...form };
      if (isEdit) {
        await api.updateAcademicTerm(term.id, payload);
      } else {
        await api.createAcademicTerm(payload);
      }
      onSaved();
    } catch (e) {
      onError(e.message || "Failed to save term");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEdit ? "Edit Term" : "Add Term"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Term Number"
            value={form.termNumber}
            onChange={(e) => setForm({ ...form, termNumber: Number(e.target.value) })}
            fullWidth
          >
            <MenuItem value={1}>Term 1</MenuItem>
            <MenuItem value={2}>Term 2</MenuItem>
            <MenuItem value={3}>Term 3</MenuItem>
          </TextField>
          <TextField
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isCurrent}
                onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              />
            }
            label="Set as current term"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Event Dialog ───────────────────────────────────────────────────────────
function EventDialog({ event, terms, classes, year, onClose, onSaved, onError }) {
  const isEdit = !!event.id;
  const [form, setForm] = useState({
    title: event.title || "",
    description: event.description || "",
    category: event.category || "other",
    scope: event.scope || "school",
    term: event.term || 1,
    year: event.year || year,
    startDate: event.startDate || "",
    endDate: event.endDate || event.startDate || "",
    className: event.className || "",
    gradeLevel: event.gradeLevel || "",
    visibleToParents: event.visibleToParents || false,
    approvalStatus: event.approvalStatus || "draft",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) return onError("Event title is required");
    if (!form.startDate) return onError("Start date is required");
    if (!form.endDate) return onError("End date is required");

    setSaving(true);
    try {
      const payload = { ...form };
      // Find class ID from class name if scope is class
      if (form.scope === "class" && form.className) {
        const cls = classes.find((c) => c.name === form.className);
        if (cls) payload.classId = cls.id;
      }
      if (isEdit) {
        await api.updateTermEvent(event.id, payload);
      } else {
        await api.createTermEvent(payload);
      }
      onSaved();
    } catch (e) {
      onError(e.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Event" : "Add Event"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Event Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            fullWidth
            required
            placeholder="e.g., End of Term 2 Exams"
          />
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Scope"
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              fullWidth
            >
              {SCOPES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Term"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: Number(e.target.value) })}
              sx={{ flex: 1 }}
            >
              <MenuItem value={1}>Term 1</MenuItem>
              <MenuItem value={2}>Term 2</MenuItem>
              <MenuItem value={3}>Term 3</MenuItem>
            </TextField>
            <TextField
              label="Year"
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <TextField
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Stack>
          {form.scope === "class" && (
            <TextField
              select
              label="Class"
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
              fullWidth
            >
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.name}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          {form.scope === "grade" && (
            <TextField
              label="Grade Level"
              value={form.gradeLevel}
              onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
              fullWidth
              placeholder="e.g., Grade 4"
            />
          )}
          <TextField
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.visibleToParents}
                onChange={(e) => setForm({ ...form, visibleToParents: e.target.checked })}
              />
            }
            label="Visible to parents in their portal"
          />
          {isEdit && (
            <TextField
              select
              label="Approval Status"
              value={form.approvalStatus}
              onChange={(e) => setForm({ ...form, approvalStatus: e.target.value })}
              fullWidth
            >
              {APPROVAL_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Reject Dialog ──────────────────────────────────────────────────────────
function RejectDialog({ event, onClose, onReject }) {
  const [reason, setReason] = useState("");

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reject Event</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Rejecting: <strong>{event.title}</strong>
        </Typography>
        <TextField
          label="Reason for rejection"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={3}
          fullWidth
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => onReject(event, reason)}
          disabled={!reason.trim()}
        >
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  );
}
