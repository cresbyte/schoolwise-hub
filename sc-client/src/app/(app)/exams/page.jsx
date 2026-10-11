"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { academicsApi } from "@/lib/academicsApi";
import { EXAM_STATUS, EXAM_TYPES, examsApi } from "@/lib/examsApi";
import { schoolApi } from "@/lib/schoolApi";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import {
  Alert,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
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
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExamsPage() {
  return (
    <>
      <PageGuard permission="exams.view">
        <ExamsContent />
      </PageGuard>
    </>
  );
}

function ExamsContent() {
  const router = useRouter();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState({ anchor: null, exam: null });
  const [removing, setRemoving] = useState(null);



  const { data, loading, error, refetch } = useAsync(async () => {
    const [exams, years, terms, grades, classes] = await Promise.all([
      examsApi.list(),
      schoolApi.getAcademicYears(),
      schoolApi.getTerms(),
      schoolApi.getGradeLevels(),
      academicsApi.getClasses(),
    ]);
    return {
      exams: Array.isArray(exams) ? exams : [],
      years: Array.isArray(years) ? years : [],
      terms: Array.isArray(terms) ? terms : [],
      grades: Array.isArray(grades) ? grades : [],
      classes: Array.isArray(classes) ? classes : [],
    };
  }, []);

  const exams = data?.exams ?? [];
  const years = data?.years ?? [];
  const terms = data?.terms ?? [];
  const grades = data?.grades ?? [];
  const classes = data?.classes ?? [];


  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const closeMenu = () => setMenu({ anchor: null, exam: null });

  const handleLifecycle = async (exam, action) => {
    closeMenu();
    const labels = { open: "opened", close: "closed", release: "released", reopen: "reopened" };
    try {
      await examsApi[action](exam.id);
      notify(`${exam.name} ${labels[action]}`);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await examsApi.delete(removing.id);
      notify(`${removing.name} deleted`);
      setRemoving(null);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Examinations"
        subtitle="Create exams, enter marks, produce report cards."
        actions={
          <RoleGuard permission="exams.manage">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              New exam
            </Button>
          </RoleGuard>
        }
      />

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => exams.length === 0}
        emptyMessage="No exams yet. Create one to get started."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Subjects</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell padding="checkbox" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exams.map((e) => {
                    const meta = EXAM_STATUS[e.status] || EXAM_STATUS.draft;
                    return (
                      <TableRow
                        key={e.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => router.push(`/exams/${e.id}`)}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{e.name}</TableCell>
                        <TableCell>{e.termLabel}</TableCell>
                        <TableCell>
                          {e.start_date} → {e.end_date}
                        </TableCell>
                        <TableCell>{e.subjectCount}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={meta.label}
                            color={meta.color}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell padding="checkbox" onClick={(ev) => ev.stopPropagation()}>
                          <RoleGuard permission="exams.manage">
                            <IconButton
                              size="small"
                              onClick={(ev) => setMenu({ anchor: ev.currentTarget, exam: e })}
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
        {menu.exam?.status === "draft" && (
          <MenuItem onClick={() => handleLifecycle(menu.exam, "open")}>
            <ListItemIcon>
              <PlayArrowIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>Open for marks</ListItemText>
          </MenuItem>
        )}
        {menu.exam?.status === "open" && (
          <MenuItem onClick={() => handleLifecycle(menu.exam, "close")}>
            <ListItemIcon>
              <LockIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Close marks</ListItemText>
          </MenuItem>
        )}
        {(menu.exam?.status === "closed" || menu.exam?.status === "open") && (
          <MenuItem onClick={() => handleLifecycle(menu.exam, "release")}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Release report cards</ListItemText>
          </MenuItem>
        )}
        {menu.exam?.status === "released" && (
          <MenuItem onClick={() => handleLifecycle(menu.exam, "reopen")}>
            <ListItemIcon>
              <ReplayIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Reopen for corrections</ListItemText>
          </MenuItem>
        )}
        {menu.exam?.status === "draft" && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                setEditing(menu.exam);
                setDialogOpen(true);
                closeMenu();
              }}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem
              sx={{ color: "error.main" }}
              onClick={() => {
                setRemoving(menu.exam);
                closeMenu();
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {dialogOpen && (
        <ExamDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          exam={editing}
          years={years}
          terms={terms}
          grades={grades}
          classes={classes}
          onSaved={() => {
            setDialogOpen(false);
            notify(editing ? "Exam updated" : "Exam created");
            refetch();
          }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      <Dialog open={!!removing} onClose={() => setRemoving(null)}>
        <DialogTitle>Delete {removing?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            All subjects and marks for this exam will be deleted.
          </DialogContentText>
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
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function ExamDialog({ open, onClose, exam, years, terms, grades, classes, onSaved, onError }) {
  const isEdit = !!exam;
  const [form, setForm] = useState({
    name: exam?.name || "",
    exam_type: exam?.exam_type || "end_term",
    academic_year: exam?.academic_year || "",
    term: exam?.term || "",
    gradeLevels: exam?.gradeLevels || [],
    classRooms: exam?.classRooms || [],
    start_date: exam?.start_date || "",
    end_date: exam?.end_date || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const availableTerms = terms.filter(
    (t) => !form.academic_year || String(t.academic_year) === String(form.academic_year),
  );
const availableClasses = classes.filter(
  (c) =>
    String(c.academicYear) === String(form.academic_year) &&
    (form.gradeLevels.length === 0 || form.gradeLevels.includes(c.gradeLevel)),
);

const handleSave = async () => {
  // Picking classes decides the grades; otherwise use the grades picked.
  const picked = classes.filter((c) => form.classRooms.includes(c.id));
  const gradeLevels = picked.length
    ? [...new Set(picked.map((c) => c.gradeLevel))]
    : form.gradeLevels;

  if (!form.name.trim()) return onError("Enter a name");
  if (!form.academic_year) return onError("Select a year");
  if (!form.term) return onError("Select a term");
  if (!form.start_date || !form.end_date) return onError("Enter dates");
  if (gradeLevels.length === 0) return onError("Select a grade or at least one class");

  setSaving(true);
  try {
    const payload = { ...form, gradeLevels };
    if (isEdit) await examsApi.update(exam.id, payload);
    else await examsApi.create(payload);
    onSaved();
  } catch (e) {
    onError(e.message);
  } finally {
    setSaving(false);
  }
};

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit exam" : "New exam"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            placeholder="End of Term 1, 2026"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
            autoFocus
          />
          <FormControl fullWidth>
            <InputLabel>Academic year</InputLabel>
            <Select
              value={form.academic_year}
              label="Academic year"
              onChange={(e) => handleChange("academic_year", e.target.value)}
            >
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
              {availableTerms.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Exam type</InputLabel>
            <Select
              value={form.exam_type}
              label="Exam type"
              onChange={(e) => handleChange("exam_type", e.target.value)}
            >
              {EXAM_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Grades</InputLabel>
            <Select
              multiple
              value={form.gradeLevels}
              label="Grades"
              onChange={(e) => handleChange("gradeLevels", e.target.value)}
              renderValue={(selected) => selected.join(", ")}
            >
              {grades.map((g) => (
                <MenuItem key={g.name} value={g.name}>
                  {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Classes (optional)</InputLabel>
            <Select
              multiple
              value={form.classRooms}
              helperText="Leave empty to include the whole grade"
              label="Classes (optional)"
              onChange={(e) => handleChange("classRooms", e.target.value)}
              renderValue={(selected) =>
                classes
                  .filter((c) => selected.includes(c.id))
                  .map((c) => c.name)
                  .join(", ")
              }
            >
              {availableClasses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create exam"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
