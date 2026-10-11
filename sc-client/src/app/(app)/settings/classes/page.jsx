"use client";

import { useState } from "react";
import {
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import GroupIcon from "@mui/icons-material/Group";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { academicsApi } from "@/lib/academicsApi";
import { schoolApi } from "@/lib/schoolApi";
import { api } from "@/lib/api";

export default function ClassesPage() {
  return (
    <>
      <PageGuard permission="settings.view">
        <ClassesContent />
      </PageGuard>
    </>
  );
}

function ClassesContent() {
  const [yearFilter, setYearFilter] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState({ anchor: null, cls: null });
  const [removing, setRemoving] = useState(null);
  const [roster, setRoster] = useState(null);

  const { data, loading, error, refetch } = useAsync(async () => {
    const [classes, years, grades, staff] = await Promise.all([
      academicsApi.getClasses(yearFilter ? { academic_year: yearFilter } : {}),
      schoolApi.getAcademicYears(),
      schoolApi.getGradeLevels(),
      api.getStaff().catch(() => []),
    ]);
    return {
      classes: Array.isArray(classes) ? classes : [],
      years: Array.isArray(years) ? years : [],
      grades: Array.isArray(grades) ? grades : [],
      staff: Array.isArray(staff) ? staff : [],
    };
  }, [yearFilter]);

  const classes = data?.classes ?? [];
  const years = data?.years ?? [];
  const grades = data?.grades ?? [];
  const staff = data?.staff ?? [];
  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const closeMenu = () => setMenu({ anchor: null, cls: null });

  const handleDelete = async () => {
    try {
      await academicsApi.deleteClass(removing.id);
      notify(`${removing.name} deleted`);
      setRemoving(null);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

const handleViewRoster = async (cls) => {
  console.log("view roster:", cls); // sanity check
  closeMenu();
  try {
    const students = await academicsApi.getClassRoster(cls.id);
    console.log("roster payload:", students);
    setRoster({
      cls,
      students: Array.isArray(students) ? students : [],
    });
  } catch (e) {
    console.error("roster error:", e);
    notify(e.message, "error");
  }
};

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (cls) => {
    closeMenu();
    setEditing(cls);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Classes"
        subtitle="Streams and grade groups for each academic year."
        actions={
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Academic year</InputLabel>
              <Select
                value={yearFilter}
                label="Academic year"
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <MenuItem value="">All years</MenuItem>
                {years.map((y) => (
                  <MenuItem key={y.id} value={y.id}>
                    {y.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <RoleGuard permission="settings.manage">
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                New class
              </Button>
            </RoleGuard>
          </Stack>
        }
      />

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => classes.length === 0}
        emptyMessage="No classes yet. Create one to get started."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Stream</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Class teacher</TableCell>
                    <TableCell align="right">Students</TableCell>
                    <TableCell align="right">Capacity</TableCell>
                    <TableCell padding="checkbox" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                      <TableCell>{c.gradeLevel}</TableCell>
                      <TableCell>{c.stream}</TableCell>
                      <TableCell>{c.room || "—"}</TableCell>
                      <TableCell>{c.classTeacherName || "—"}</TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={c.studentCount}
                          color={c.studentCount >= c.capacity ? "warning" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{c.capacity}</TableCell>
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          aria-label={`Actions for ${c.name}`}
                          onClick={(e) => setMenu({ anchor: e.currentTarget, cls: c })}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </DataState>

      <Menu anchorEl={menu.anchor} open={!!menu.anchor} onClose={closeMenu}>
        <MenuItem onClick={() => handleViewRoster(menu.cls)}>
          <ListItemIcon>
            <GroupIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View roster</ListItemText>
        </MenuItem>
        <RoleGuard permission="settings.manage">
          <MenuItem onClick={() => openEdit(menu.cls)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            sx={{ color: "error.main" }}
            onClick={() => {
              setRemoving(menu.cls);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </RoleGuard>
      </Menu>

      {dialogOpen && (
        <ClassDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          cls={editing}
          years={years}
          grades={grades}
          staff={staff}
          onSaved={() => {
            setDialogOpen(false);
            notify(editing ? "Class updated" : "Class created");
            refetch();
          }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      {/* Roster dialog */}
      {roster && (
        <Dialog open onClose={() => setRoster(null)} fullWidth maxWidth="sm">
          <DialogTitle>{roster.cls?.name || "Class"} — Roster</DialogTitle>
          <DialogContent dividers>
            {roster.students.length === 0 ? (
              <Alert severity="info">No students enrolled in this class yet.</Alert>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1}>
                {roster.students.map((s) => (
                  <Stack key={s.id} direction="row" justifyContent="space-between">
                    <span>
                      {s.firstName} {s.lastName}
                    </span>
                    <span style={{ color: "#888" }}>{s.admissionNumber}</span>
                  </Stack>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRoster(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete confirm */}
      <Dialog open={!!removing} onClose={() => setRemoving(null)}>
        <DialogTitle>Delete {removing?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Only empty classes with no assignments can be deleted.
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

function ClassDialog({ open, onClose, cls, years, grades, staff, onSaved, onError }) {
  const isEdit = !!cls;
  const [form, setForm] = useState({
    gradeLevel: cls?.gradeLevel || "",
    stream: cls?.stream || "A",
    capacity: cls?.capacity || 40,
    room: cls?.room || "",
    academicYear: cls?.academicYear || "",
    classTeacherId: cls?.classTeacherId || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.gradeLevel) return onError("Select a grade level");
    if (!form.academicYear) return onError("Select an academic year");
    if (!form.stream.trim()) return onError("Enter a stream");
    if (Number(form.capacity) < 1) return onError("Capacity must be at least 1");

    setSaving(true);
    try {
      const payload = {
        gradeLevel: form.gradeLevel,
        stream: form.stream.trim(),
        capacity: Number(form.capacity),
        room: form.room.trim() || null,
        academicYear: form.academicYear,
        classTeacherId: form.classTeacherId || null,
      };
      if (isEdit) {
        await academicsApi.updateClass(cls.id, payload);
      } else {
        await academicsApi.createClass(payload);
      }
      onSaved();
    } catch (e) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit class" : "New class"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Grade level</InputLabel>
              <Select
                value={form.gradeLevel}
                label="Grade level"
                onChange={(e) => handleChange("gradeLevel", e.target.value)}
              >
                {grades.map((g) => (
                  <MenuItem key={g.id} value={g.name}>
                    {g.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Stream"
              placeholder="A, B, East, West"
              value={form.stream}
              onChange={(e) => handleChange("stream", e.target.value)}
              sx={{ maxWidth: 140 }}
            />
          </Stack>

          <FormControl fullWidth>
            <InputLabel>Academic year</InputLabel>
            <Select
              value={form.academicYear}
              label="Academic year"
              onChange={(e) => handleChange("academicYear", e.target.value)}
            >
              {years.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Capacity"
              type="number"
              value={form.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
              inputProps={{ min: 1 }}
              fullWidth
            />
            <TextField
              label="Room (optional)"
              placeholder="e.g. 4B"
              value={form.room}
              onChange={(e) => handleChange("room", e.target.value)}
              fullWidth
            />
          </Stack>

          <FormControl fullWidth>
            <InputLabel>Class teacher (optional)</InputLabel>
            <Select
              value={form.classTeacherId}
              label="Class teacher (optional)"
              onChange={(e) => handleChange("classTeacherId", e.target.value)}
            >
              <MenuItem value="">— None —</MenuItem>
              {staff
                .filter((s) => s.role !== "parent")
                .map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create class"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
