"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext"; // <-- Added
import { useNotification } from "@/context/NotificationContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GradeIcon from "@mui/icons-material/Grade";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Menu from "@mui/material/Menu";
import Link from "next/link";
import { useState } from "react";

const EXAM_TYPES = [
  { value: "cat", label: "CAT" },
  { value: "midterm", label: "Mid-Term" },
  { value: "endterm", label: "End of Term" },
];

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming", color: "info" },
  { value: "in_progress", label: "In Progress", color: "warning" },
  { value: "completed", label: "Completed", color: "default" },
  { value: "published", label: "Published", color: "success" },
];

export default function ExamsPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="exams.view">
        <ExamsContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function ExamsContent() {
  const { user } = useAuth(); // Get current user to check role
  const [yearFilter, setYearFilter] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const {
    data: exams,
    loading,
    error,
    refetch,
  } = useAsync(
    () => api.exams.list({ year: yearFilter || undefined, term: termFilter || undefined }),
    [yearFilter, termFilter],
  );

  const { data: classes } = useAsync(() => api.getClasses(), []);
  const examsArray = Array.isArray(exams) ? exams : exams?.results || [];

  // Only admin, headteacher, or deputy can publish
  const canPublish = ["admin", "headteacher", "deputy"].includes(user?.role);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDelete = async (exam) => {
    if (!window.confirm(`Delete "${exam.name}"?`)) return;
    try {
      await api.exams.delete(exam.id);
      showSnackbar("Exam deleted");
      refetch();
    } catch (e) {
      showSnackbar(e.message || "Failed to delete", "error");
    }
  };

  const handlePublish = async (exam) => {
    if (
      !window.confirm(
        `Publish "${exam.name}"?\n\nThis will lock all score editing and make results visible to parents.`,
      )
    )
      return;
    try {
      await api.exams.publish(exam.id);
      showSnackbar("Exam published successfully", "success");
      refetch();
    } catch (e) {
      showSnackbar(e.message || "Failed to publish exam", "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Exams"
        subtitle="Manage exams and enter student scores"
        actions={
          <RoleGuard permission="exams.create">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingExam(null);
                setDialogOpen(true);
              }}
            >
              Create Exam
            </Button>
          </RoleGuard>
        }
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            select
            size="small"
            label="Year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            sx={{ width: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="2025">2025</MenuItem>
            <MenuItem value="2026">2026</MenuItem>
            <MenuItem value="2027">2027</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Term"
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            sx={{ width: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="1">Term 1</MenuItem>
            <MenuItem value="2">Term 2</MenuItem>
            <MenuItem value="3">Term 3</MenuItem>
          </TextField>
        </Stack>
      </Card>

      <Card>
        <DataState
          loading={loading}
          error={error}
          data={examsArray}
          onRetry={refetch}
          isEmpty={(d) => !d || d.length === 0}
          emptyMessage="No exams found"
        >
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Exam Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Classes</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examsArray.map((exam) => {
                    const statusOption =
                      STATUS_OPTIONS.find((s) => s.value === exam.status) || STATUS_OPTIONS[0];
                    return (
                      <TableRow key={exam.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{exam.name}</TableCell>
                        <TableCell>
                          {EXAM_TYPES.find((t) => t.value === exam.examType)?.label ||
                            exam.examType}
                        </TableCell>
                        <TableCell>
                          Term {exam.term}, {exam.year}
                        </TableCell>
                        <TableCell>
                          {exam.startDate} → {exam.endDate}
                        </TableCell>
                        <TableCell>{exam.classRooms?.length || 0} classes</TableCell>
                        <TableCell>
                          <Chip
                            label={statusOption.label}
                            color={statusOption.color}
                            size="small"
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Enter Scores">
                              <IconButton
                                size="small"
                                component={Link}
                                href={`/exams/${exam.id}/scores`}
                              >
                                <GradeIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Results">
                              <IconButton
                                size="small"
                                component={Link}
                                href={`/exams/${exam.id}/results`}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {/* 3. Edit & Delete (Only for non-published exams) */}
                            <RoleGuard permission="exams.edit">
                              {exam.status !== "published" && (
                                <>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setEditingExam(exam);
                                        setDialogOpen(true);
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDelete(exam)}
                                      color="error"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </RoleGuard>
                            <ExamStatusMenu exam={exam} onStatusChanged={refetch} />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      </Card>

      {dialogOpen && (
        <ExamDialog
          exam={editingExam}
          classes={classes || []}
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            showSnackbar(editingExam ? "Exam updated" : "Exam created");
            refetch();
          }}
          onError={(msg) => showSnackbar(msg, "error")}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function ExamStatusMenu({ exam, onStatusChanged }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const { showNotification } = useNotification();

  const handleStatusChange = async (newStatus) => {
    setConfirmDialog(null);
    try {
      await api.exams.setExamStatus(exam.id, newStatus);
      showNotification(`Exam status changed to "${newStatus}"`, "success");
      onStatusChanged();
    } catch (e) {
      showNotification(e.message || "Failed to change status", "error");
    }
  };

  const statusOptions = [
    { value: "upcoming", label: "Upcoming", disabled: exam.status === "published" },
    { value: "in_progress", label: "In Progress", disabled: exam.status === "published" },
    { value: "completed", label: "Completed", disabled: exam.status === "published" },
    { value: "published", label: "Published", disabled: exam.status === "published" },
  ];

  return (
    <>
      <Tooltip title="Change Status">
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {statusOptions.map((opt) => (
          <MenuItem
            key={opt.value}
            disabled={opt.disabled || exam.status === opt.value}
            onClick={() => {
              setAnchorEl(null);
              setConfirmDialog({ status: opt.value, label: opt.label });
            }}
          >
            {opt.label} {exam.status === opt.value && "✓"}
          </MenuItem>
        ))}
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog open={Boolean(confirmDialog)} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>Change Exam Status?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to change <strong>"{exam.name}"</strong> to{" "}
            <strong>"{confirmDialog?.label}"</strong>?
          </Typography>
          {confirmDialog?.status === "published" && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Publishing will lock all score editing and make results visible to parents. This
              action cannot be undone.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmDialog?.status === "published" ? "success" : "primary"}
            onClick={() => handleStatusChange(confirmDialog.status)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function ExamDialog({ exam, classes, onClose, onSaved, onError }) {
  const isEdit = !!exam;
  const [form, setForm] = useState({
    name: exam?.name || "",
    examType: exam?.examType || "endterm",
    year: exam?.year || new Date().getFullYear(),
    term: exam?.term || 1,
    startDate: exam?.startDate || "",
    endDate: exam?.endDate || "",
    classRoomIds: exam?.classRoomIds || [],
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) return onError("Name is required");
    if (!form.startDate || !form.endDate) return onError("Dates are required");
    if (form.classRoomIds.length === 0) return onError("Select at least one class");

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        examType: form.examType,
        year: Number(form.year),
        term: Number(form.term),
        startDate: form.startDate,
        endDate: form.endDate,
        classRoomIds: form.classRoomIds,
      };
      if (isEdit) {
        await api.exams.update(exam.id, payload);
      } else {
        await api.exams.create(payload);
      }
      onSaved();
    } catch (e) {
      onError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit Exam" : "Create Exam"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Exam Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Exam Type</InputLabel>
              <Select
                value={form.examType}
                label="Exam Type"
                onChange={(e) => handleChange("examType", e.target.value)}
              >
                {EXAM_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Year"
              type="number"
              value={form.year}
              onChange={(e) => handleChange("year", e.target.value)}
              sx={{ width: 100 }}
            />
            <FormControl size="small" sx={{ width: 100 }}>
              <InputLabel>Term</InputLabel>
              <Select
                value={form.term}
                label="Term"
                onChange={(e) => handleChange("term", Number(e.target.value))}
              >
                <MenuItem value={1}>Term 1</MenuItem>
                <MenuItem value={2}>Term 2</MenuItem>
                <MenuItem value={3}>Term 3</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <FormControl size="small">
            <InputLabel>Classes</InputLabel>
            <Select
              multiple
              value={form.classRoomIds}
              label="Classes"
              onChange={(e) => handleChange("classRoomIds", e.target.value)}
              renderValue={(selected) => `${selected.length} classes selected`}
            >
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Checkbox checked={form.classRoomIds.includes(c.id)} />
                  <ListItemText primary={c.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mt: 1 }}>
            Subjects will be auto-created based on teacher assignments for each selected class.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
