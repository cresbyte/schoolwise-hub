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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { schoolApi, YEAR_STATUS } from "@/lib/schoolApi";

export default function AcademicYearsPage() {
  return (
    <>
      <PageGuard permission="school.view">
        <AcademicYearsContent />
      </PageGuard>
    </>
  );
}

function AcademicYearsContent() {
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState({ anchor: null, year: null });
  const [removing, setRemoving] = useState(null);
  const [closing, setClosing] = useState(null);

  const { data, loading, error, refetch } = useAsync(async () => {
    const years = await schoolApi.getAcademicYears();
    return { years: Array.isArray(years) ? years : [] };
  }, []);

  const years = data?.years ?? [];
  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });
  const closeMenu = () => setMenu({ anchor: null, year: null });

  const handleActivate = async (year) => {
    closeMenu();
    try {
      await schoolApi.activateAcademicYear(year.id);
      notify(`${year.name} is now active`);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleClose = async () => {
    try {
      await schoolApi.closeAcademicYear(closing.id);
      notify(`${closing.name} has been closed`);
      setClosing(null);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await schoolApi.deleteAcademicYear(removing.id);
      notify(`${removing.name} deleted`);
      setRemoving(null);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const openEdit = (year) => {
    closeMenu();
    setEditing(year);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Academic years"
        subtitle="Each year contains up to 3 terms. Only one year can be active at a time."
        actions={
          <RoleGuard permission="school.manage">
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New academic year
            </Button>
          </RoleGuard>
        }
      />

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => years.length === 0}
        emptyMessage="No academic years yet. Create one to get started."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Start date</TableCell>
                    <TableCell>End date</TableCell>
                    <TableCell>Terms</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell padding="checkbox" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {years.map((y) => {
                    const meta = YEAR_STATUS[y.status] || YEAR_STATUS.draft;
                    return (
                      <TableRow key={y.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{y.name}</TableCell>
                        <TableCell>{y.start_date}</TableCell>
                        <TableCell>{y.end_date}</TableCell>
                        <TableCell>
                          {y.terms?.length
                            ? y.terms.map((t) => (
                                <Chip
                                  key={t.id}
                                  size="small"
                                  variant={t.is_current ? "filled" : "outlined"}
                                  color={t.is_current ? "success" : "default"}
                                  label={t.label}
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={meta.label}
                            color={meta.color}
                          />
                        </TableCell>
                        <TableCell padding="checkbox">
                          <RoleGuard permission="school.manage">
                            <IconButton
                              size="small"
                              aria-label={`Actions for ${y.name}`}
                              onClick={(e) => setMenu({ anchor: e.currentTarget, year: y })}
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
        {menu.year?.status === "draft" && (
          <>
            <MenuItem onClick={() => openEdit(menu.year)}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleActivate(menu.year)}>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Activate</ListItemText>
            </MenuItem>
          </>
        )}
        {menu.year?.status === "active" && (
          <MenuItem
            onClick={() => {
              setClosing(menu.year);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <LockIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Close year</ListItemText>
          </MenuItem>
        )}
        {menu.year?.status === "draft" && (
          <>
            <Divider />
            <MenuItem
              sx={{ color: "error.main" }}
              onClick={() => {
                setRemoving(menu.year);
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

      {/* Create / Edit dialog */}
      {dialogOpen && (
        <YearDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          year={editing}
          onSaved={() => {
            setDialogOpen(false);
            notify(editing ? "Academic year updated" : "Academic year created");
            refetch();
          }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      {/* Close confirm */}
      <Dialog open={!!closing} onClose={() => setClosing(null)}>
        <DialogTitle>Close {closing?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Closing is permanent. No new terms, events or edits can be made in a closed year.
            The current term will be cleared.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setClosing(null)}>
            Cancel
          </Button>
          <Button color="warning" variant="contained" onClick={handleClose}>
            Close year
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!removing} onClose={() => setRemoving(null)}>
        <DialogTitle>Delete {removing?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Only draft years with no linked records can be deleted.
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

function YearDialog({ open, onClose, year, onSaved, onError }) {
  const isEdit = !!year;
  const [form, setForm] = useState({
    name: year?.name || "",
    start_date: year?.start_date || "",
    end_date: year?.end_date || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) return onError("Enter a name");
    if (!form.start_date || !form.end_date) return onError("Enter both dates");
    if (form.end_date <= form.start_date)
      return onError("End date must be after the start date");

    setSaving(true);
    try {
      if (isEdit) {
        await schoolApi.updateAcademicYear(year.id, form);
      } else {
        await schoolApi.createAcademicYear(form);
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
      <DialogTitle>{isEdit ? "Edit academic year" : "New academic year"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            placeholder="e.g. 2026"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
            autoFocus
          />
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
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create year"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
