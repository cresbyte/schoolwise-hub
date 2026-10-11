"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { schoolApi } from "@/lib/schoolApi";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StarIcon from "@mui/icons-material/Star";
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
  TextField
} from "@mui/material";
import { useState } from "react";

const MAX_TERMS = 3;

export default function TermsPage() {
  return (
    <>
      <PageGuard permission="school.view">
        <TermsContent />
      </PageGuard>
    </>
  );
}

function TermsContent() {
  const [yearFilter, setYearFilter] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState({ anchor: null, term: null });
  const [removing, setRemoving] = useState(null);

  const { data, loading, error, refetch } = useAsync(async () => {
    const [years, terms] = await Promise.all([
      schoolApi.getAcademicYears(),
      schoolApi.getTerms(yearFilter ? { academic_year: yearFilter } : {}),
    ]);
    return {
      years: Array.isArray(years) ? years : [],
      terms: Array.isArray(terms) ? terms : [],
    };
  }, [yearFilter]);

  const years = data?.years ?? [];
  const terms = data?.terms ?? [];
  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const closeMenu = () => setMenu({ anchor: null, term: null });

  const handleSetCurrent = async (term) => {
    closeMenu();
    try {
      await schoolApi.setCurrentTerm(term.id);
      notify(`${term.label} is now the current term`);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await schoolApi.deleteTerm(removing.id);
      notify(`${removing.label} deleted`);
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

  const openEdit = (term) => {
    closeMenu();
    setEditing(term);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Terms"
        subtitle="Each academic year has up to 3 terms. Only one term can be current."
        actions={
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 180 }}>
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
            <RoleGuard permission="school.manage">
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                New term
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
        isEmpty={() => terms.length === 0}
        emptyMessage="No terms yet. Create one to get started."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Academic year</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell>Start date</TableCell>
                    <TableCell>End date</TableCell>
                    <TableCell>Current</TableCell>
                    <TableCell padding="checkbox" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {terms.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell>{t.academic_year_name}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Term {t.number}</TableCell>
                      <TableCell>{t.start_date}</TableCell>
                      <TableCell>{t.end_date}</TableCell>
                      <TableCell>
                        {t.is_current ? (
                          <Chip size="small" icon={<StarIcon />} label="Current" color="success" />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell padding="checkbox">
                        <RoleGuard permission="school.manage">
                          <IconButton
                            size="small"
                            aria-label={`Actions for ${t.label}`}
                            onClick={(e) => setMenu({ anchor: e.currentTarget, term: t })}
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
        {!menu.term?.is_current && (
          <MenuItem onClick={() => handleSetCurrent(menu.term)}>
            <ListItemIcon>
              <StarIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Set as current</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => openEdit(menu.term)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {!menu.term?.is_current && (
          <>
            <Divider />
            <MenuItem
              sx={{ color: "error.main" }}
              onClick={() => {
                setRemoving(menu.term);
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
        <TermDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          term={editing}
          years={years}
          onSaved={() => {
            setDialogOpen(false);
            notify(editing ? "Term updated" : "Term created");
            refetch();
          }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      <Dialog open={!!removing} onClose={() => setRemoving(null)}>
        <DialogTitle>Delete {removing?.label}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Only non-current terms in non-closed years can be deleted.
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

function TermDialog({ open, onClose, term, years, onSaved, onError }) {
  const isEdit = !!term;
  const [form, setForm] = useState({
    academic_year: term?.academic_year || "",
    number: term?.number || 1,
    start_date: term?.start_date || "",
    end_date: term?.end_date || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.academic_year) return onError("Select an academic year");
    if (!form.start_date || !form.end_date) return onError("Enter both dates");
    if (form.end_date <= form.start_date) return onError("End date must be after the start date");

    setSaving(true);
    try {
      if (isEdit) {
        await schoolApi.updateTerm(term.id, form);
      } else {
        await schoolApi.createTerm(form);
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
      <DialogTitle>{isEdit ? "Edit term" : "New term"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth disabled={isEdit}>
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
            <InputLabel>Term number</InputLabel>
            <Select
              value={form.number}
              label="Term number"
              onChange={(e) => handleChange("number", Number(e.target.value))}
            >
              {[1, 2, 3].map((n) => (
                <MenuItem key={n} value={n}>
                  Term {n}
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
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create term"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
