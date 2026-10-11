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
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { academicsApi, CBC_GRADES, LEARNING_AREAS } from "@/lib/academicsApi";

export default function SubjectsPage() {
  return (
    <>
      <PageGuard permission="settings.view">
        <SubjectsContent />
      </PageGuard>
    </>
  );
}

function SubjectsContent() {
  const [gradeFilter, setGradeFilter] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState({ anchor: null, subject: null });
  const [removing, setRemoving] = useState(null);

  const { data, loading, error, refetch } = useAsync(async () => {
    const subjects = await academicsApi.getSubjects(
      gradeFilter ? { grade_level: gradeFilter } : {},
    );
    return { subjects: Array.isArray(subjects) ? subjects : [] };
  }, [gradeFilter]);

  const subjects = data?.subjects ?? [];
  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const closeMenu = () => setMenu({ anchor: null, subject: null });

  const handleDelete = async () => {
    try {
      await academicsApi.deleteSubject(removing.id);
      notify(`${removing.name} deleted`);
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
  const openEdit = (s) => {
    closeMenu();
    setEditing(s);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle="CBC learning areas offered across grade levels."
        actions={
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Grade</InputLabel>
              <Select
                value={gradeFilter}
                label="Grade"
                onChange={(e) => setGradeFilter(e.target.value)}
              >
                <MenuItem value="">All grades</MenuItem>
                {CBC_GRADES.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <RoleGuard permission="settings.manage">
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                New subject
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
        isEmpty={() => subjects.length === 0}
        emptyMessage="No subjects yet. Create one or run the seeder."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Learning area</TableCell>
                    <TableCell>Grades</TableCell>
                    <TableCell>Core</TableCell>
                    <TableCell padding="checkbox" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjects.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell>
                        <Chip size="small" label={s.code} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {LEARNING_AREAS.find((l) => l.value === s.learningArea)?.label || "—"}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexwrap="wrap" useFlexGap>
                          {(s.gradeLevels || []).map((g) => (
                            <Chip key={g} size="small" label={g} />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {s.isCore ? (
                          <Chip size="small" color="primary" label="Core" />
                        ) : (
                          <Chip size="small" variant="outlined" label="Elective" />
                        )}
                      </TableCell>
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          aria-label={`Actions for ${s.name}`}
                          onClick={(e) => setMenu({ anchor: e.currentTarget, subject: s })}
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
        <RoleGuard permission="settings.manage">
          <MenuItem onClick={() => openEdit(menu.subject)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            sx={{ color: "error.main" }}
            onClick={() => {
              setRemoving(menu.subject);
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
        <SubjectDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          subject={editing}
          onSaved={() => {
            setDialogOpen(false);
            notify(editing ? "Subject updated" : "Subject created");
            refetch();
          }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      <Dialog open={!!removing} onClose={() => setRemoving(null)}>
        <DialogTitle>Delete {removing?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Subjects assigned to classes or with timetable slots cannot be deleted.
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

function SubjectDialog({ open, onClose, subject, onSaved, onError }) {
  const isEdit = !!subject;
  const [form, setForm] = useState({
    name: subject?.name || "",
    code: subject?.code || "",
    description: subject?.description || "",
    gradeLevels: subject?.gradeLevels || [],
    isCore: subject?.isCore ?? true,
    learningArea: subject?.learningArea || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) return onError("Enter a name");
    if (!form.code.trim()) return onError("Enter a code");
    if (!form.gradeLevels.length) return onError("Select at least one grade");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description,
        gradeLevels: form.gradeLevels,
        isCore: form.isCore,
        learningArea: form.learningArea || null,
      };
      if (isEdit) {
        await academicsApi.updateSubject(subject.id, payload);
      } else {
        await academicsApi.createSubject(payload);
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
      <DialogTitle>{isEdit ? "Edit subject" : "New subject"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Code"
              placeholder="MATH-U"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
              sx={{ maxWidth: 160 }}
            />
          </Stack>

          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          <Autocomplete
            multiple
            options={CBC_GRADES}
            value={form.gradeLevels}
            onChange={(_, value) => handleChange("gradeLevels", value)}
            renderInput={(params) => <TextField {...params} label="Grades offered" />}
          />

          <FormControl fullWidth>
            <InputLabel>Learning area</InputLabel>
            <Select
              value={form.learningArea}
              label="Learning area"
              onChange={(e) => handleChange("learningArea", e.target.value)}
            >
              <MenuItem value="">— None —</MenuItem>
              {LEARNING_AREAS.map((l) => (
                <MenuItem key={l.value} value={l.value}>
                  {l.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={form.isCore}
                onChange={(e) => handleChange("isCore", e.target.checked)}
              />
            }
            label="Core subject (compulsory for all students)"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create subject"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
