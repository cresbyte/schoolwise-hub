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
  FormControlLabel,
  Checkbox,
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
import { schoolApi } from "@/lib/schoolApi";

export default function GradeLevelsPage() {
  return (
    <>
      <PageGuard permission="school.view">
        <GradeLevelsContent />
      </PageGuard>
    </>
  );
}

function GradeLevelsContent() {
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState({ anchor: null, grade: null });
  const [removing, setRemoving] = useState(null);

  const { data, loading, error, refetch } = useAsync(async () => {
    const grades = await schoolApi.getGradeLevels();
    return { grades: Array.isArray(grades) ? grades : [] };
  }, []);

  const grades = data?.grades ?? [];
  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const closeMenu = () => setMenu({ anchor: null, grade: null });

  const handleDelete = async () => {
    try {
      await schoolApi.deleteGradeLevel(removing.id);
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

  const openEdit = (grade) => {
    closeMenu();
    setEditing(grade);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Grade levels"
        subtitle="Ordered grades from PP1 to the final class. Order drives promotion."
        actions={
          <RoleGuard permission="school.manage">
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New grade level
            </Button>
          </RoleGuard>
        }
      />

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => grades.length === 0}
        emptyMessage="No grade levels yet. Create one to get started."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Final grade</TableCell>
                    <TableCell padding="checkbox" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grades.map((g) => (
                    <TableRow key={g.id} hover>
                      <TableCell>{g.order}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{g.name}</TableCell>
                      <TableCell>
                        {g.is_final ? (
                          <Chip size="small" label="Final" color="primary" variant="outlined" />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell padding="checkbox">
                        <RoleGuard permission="school.manage">
                          <IconButton
                            size="small"
                            aria-label={`Actions for ${g.name}`}
                            onClick={(e) => setMenu({ anchor: e.currentTarget, grade: g })}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </RoleGuard>
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
        <MenuItem onClick={() => openEdit(menu.grade)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            setRemoving(menu.grade);
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
        <GradeDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          grade={editing}
          onSaved={() => {
            setDialogOpen(false);
            notify(editing ? "Grade level updated" : "Grade level created");
            refetch();
          }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      <Dialog open={!!removing} onClose={() => setRemoving(null)}>
        <DialogTitle>Delete {removing?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Grades that are in use (e.g. by students or events) cannot be deleted.
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

function GradeDialog({ open, onClose, grade, onSaved, onError }) {
  const isEdit = !!grade;
  const [form, setForm] = useState({
    name: grade?.name || "",
    order: grade?.order || "",
    is_final: grade?.is_final || false,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) return onError("Enter a name");
    if (!form.order || Number(form.order) < 1) return onError("Enter a valid order");

    setSaving(true);
    try {
      const payload = { ...form, order: Number(form.order) };
      if (isEdit) {
        await schoolApi.updateGradeLevel(grade.id, payload);
      } else {
        await schoolApi.createGradeLevel(payload);
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
      <DialogTitle>{isEdit ? "Edit grade level" : "New grade level"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            placeholder="e.g. Grade 1, PP1"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            label="Order"
            type="number"
            value={form.order}
            onChange={(e) => handleChange("order", e.target.value)}
            inputProps={{ min: 1 }}
            helperText="Lower numbers come first (PP1 = 1, PP2 = 2, Grade 1 = 3, …)"
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_final}
                onChange={(e) => handleChange("is_final", e.target.checked)}
              />
            }
            label="Students graduate after this grade"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create grade level"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
