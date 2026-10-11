"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  DialogContentText,
  FormControl,
  InputLabel,
  Select,
  Radio,
  RadioGroup,
  FormLabel,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { schoolApi, EVENT_CATEGORY, EVENT_SCOPE, APPROVAL_STATUS } from "@/lib/schoolApi";

export default function CalendarPage() {
  return (
    <>
      <PageGuard permission="school.view">
        <CalendarContent />
      </PageGuard>
    </>
  );
}

const CATEGORIES = Object.keys(EVENT_CATEGORY);

function CalendarContent() {
  const [filters, setFilters] = useState({
    category: "",
    scope: "",
    approval_status: "",
    from: "",
    to: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState({ anchor: null, event: null });
  const [removing, setRemoving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, loading, error, refetch } = useAsync(async () => {
    const [events, years, terms, grades] = await Promise.all([
      schoolApi.getCalendarEvents(filters),
      schoolApi.getAcademicYears(),
      schoolApi.getTerms(),
      schoolApi.getGradeLevels(),
    ]);
    return {
      events: Array.isArray(events) ? events : [],
      years: Array.isArray(years) ? years : [],
      terms: Array.isArray(terms) ? terms : [],
      grades: Array.isArray(grades) ? grades : [],
    };
  }, [filters]);

  const events = data?.events ?? [];
  const years = data?.years ?? [];
  const terms = data?.terms ?? [];
  const grades = data?.grades ?? [];
  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const closeMenu = () => setMenu({ anchor: null, event: null });

  const handleFilterChange = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

  const handleApprove = async (event) => {
    closeMenu();
    try {
      await schoolApi.approveCalendarEvent(event.id);
      notify("Event approved");
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return notify("Enter a reason", "error");
    try {
      await schoolApi.rejectCalendarEvent(rejecting.id, rejectReason.trim());
      notify("Event rejected");
      setRejecting(null);
      setRejectReason("");
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await schoolApi.deleteCalendarEvent(removing.id);
      notify("Event deleted");
      setRemoving(null);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (event) => {
    closeMenu();
    setEditing(event);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="School calendar"
        subtitle="Events, holidays, exams and meetings across the academic year."
        actions={
          <RoleGuard permission="school.manage">
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New event
            </Button>
          </RoleGuard>
        }
      />

      {/* Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} flexwrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {EVENT_CATEGORY[c].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Scope</InputLabel>
            <Select
              value={filters.scope}
              label="Scope"
              onChange={(e) => handleFilterChange("scope", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="school">School-wide</MenuItem>
              <MenuItem value="grade">Grade level(s)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Approval</InputLabel>
            <Select
              value={filters.approval_status}
              label="Approval"
              onChange={(e) => handleFilterChange("approval_status", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="From"
            type="date"
            value={filters.from}
            onChange={(e) => handleFilterChange("from", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={filters.to}
            onChange={(e) => handleFilterChange("to", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
        </Stack>
      </Card>

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => events.length === 0}
        emptyMessage="No events match the current filters."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created by</TableCell>
                    <TableCell padding="checkbox" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((e) => {
                    const cat = EVENT_CATEGORY[e.category] || EVENT_CATEGORY.other;
                    const appr = APPROVAL_STATUS[e.approval_status] || APPROVAL_STATUS.pending;
                    return (
                      <TableRow key={e.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{e.title}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={cat.label}
                            color={cat.color}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {e.scope === "school" ? "School-wide" : "Grade level(s)"}
                        </TableCell>
                        <TableCell>
                          {e.start_date === e.end_date
                            ? e.start_date
                            : `${e.start_date} → ${e.end_date}`}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={appr.label}
                            color={appr.color}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{e.created_by_name || "—"}</TableCell>
                        <TableCell padding="checkbox">
                          <RoleGuard permission="school.view">
                            <IconButton
                              size="small"
                              aria-label={`Actions for ${e.title}`}
                              onClick={(ev) => setMenu({ anchor: ev.currentTarget, event: e })}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </RoleGuard>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </DataState>

      <Menu anchorEl={menu.anchor} open={!!menu.anchor} onClose={closeMenu}>
        <RoleGuard permission="school.manage">
          {menu.event?.approval_status !== "approved" && (
            <MenuItem onClick={() => handleApprove(menu.event)}>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Approve</ListItemText>
            </MenuItem>
          )}
          {menu.event?.approval_status !== "rejected" && (
            <MenuItem
              onClick={() => {
                setRejecting(menu.event);
                setRejectReason("");
                closeMenu();
              }}
            >
              <ListItemIcon>
                <CancelIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Reject</ListItemText>
            </MenuItem>
          )}
          <Divider />
        </RoleGuard>
        <MenuItem onClick={() => openEdit(menu.event)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            setRemoving(menu.event);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {dialogOpen && (
        <EventDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          event={editing}
          years={years}
          terms={terms}
          grades={grades}
          onSaved={() => {
            setDialogOpen(false);
            notify(editing ? "Event updated" : "Event created");
            refetch();
          }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejecting} onClose={() => setRejecting(null)} fullWidth maxWidth="sm">
        <DialogTitle>Reject “{rejecting?.title}”?</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            fullWidth
            multiline
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setRejecting(null)}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!removing} onClose={() => setRemoving(null)}>
        <DialogTitle>Delete “{removing?.title}”?</DialogTitle>
        <DialogContent>
          <DialogContentText>This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function EventDialog({ open, onClose, event, years, terms, grades, onSaved, onError }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    category: event?.category || "other",
    scope: event?.scope || "school",
    grade_levels: event?.grade_levels?.map((g) => (typeof g === "object" ? g.id : g)) || [],
    start_date: event?.start_date || "",
    end_date: event?.end_date || "",
    academic_year: event?.academic_year || "",
    term: event?.term || "",
    visible_to_parents: event?.visible_to_parents || false,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) return onError("Enter a title");
    if (!form.start_date || !form.end_date) return onError("Enter both dates");
    if (form.end_date < form.start_date) return onError("End date cannot be before the start date");
    if (form.scope === "grade" && form.grade_levels.length === 0)
      return onError("Select at least one grade level");
    if (form.scope === "school" && form.grade_levels.length > 0)
      return onError("School-wide events cannot target specific grades");

    setSaving(true);
    try {
      const payload = {
        ...form,
        term: form.term || null,
        academic_year: form.academic_year || undefined,
      };
      if (isEdit) {
        await schoolApi.updateCalendarEvent(event.id, payload);
      } else {
        await schoolApi.createCalendarEvent(payload);
      }
      onSaved();
    } catch (e) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const availableTerms = terms.filter(
    (t) => !form.academic_year || t.academic_year === form.academic_year,
  );

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? "Edit event" : "New calendar event"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category}
                label="Category"
                onChange={(e) => handleChange("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {EVENT_CATEGORY[c].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Scope</InputLabel>
              <Select
                value={form.scope}
                label="Scope"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    scope: e.target.value,
                    grade_levels: e.target.value === "school" ? [] : prev.grade_levels,
                  }))
                }
              >
                <MenuItem value="school">School-wide</MenuItem>
                <MenuItem value="grade">Grade level(s)</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {form.scope === "grade" && (
            <FormControl fullWidth>
              <InputLabel>Grades</InputLabel>
              <Select
                multiple
                value={form.grade_levels}
                label="Grades"
                onChange={(e) => handleChange("grade_levels", e.target.value)}
                renderValue={(selected) =>
                  selected
                    .map((id) => grades.find((g) => g.id === id)?.name)
                    .filter(Boolean)
                    .join(", ")
                }
              >
                {grades.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    <Checkbox checked={form.grade_levels.includes(g.id)} />
                    {g.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Stack direction="row" spacing={2}>
            <TextField
              label="Start date"
              type="date"
              value={form.start_date}
              onChange={(e) => handleChange("start_date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End date"
              type="date"
              value={form.end_date}
              onChange={(e) => handleChange("end_date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Academic year</InputLabel>
              <Select
                value={form.academic_year}
                label="Academic year"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    academic_year: e.target.value,
                    term: "",
                  }))
                }
              >
                <MenuItem value="">Auto-detect</MenuItem>
                {years.map((y) => (
                  <MenuItem key={y.id} value={y.id}>
                    {y.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Term</InputLabel>
              <Select
                value={form.term}
                label="Term"
                onChange={(e) => handleChange("term", e.target.value)}
              >
                <MenuItem value="">None (holiday / break)</MenuItem>
                {availableTerms.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={form.visible_to_parents}
                onChange={(e) => handleChange("visible_to_parents", e.target.checked)}
              />
            }
            label="Visible to parents (only approved events are shown)"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create event"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
