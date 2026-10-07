"use client";

import { useState } from "react";
import {
  Box, Button, Card, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Stack, Chip, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, Checkbox,
  ListItemText, RadioGroup, FormControlLabel, Radio, Alert, Snackbar, IconButton, Tooltip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";

const CURRENT_YEAR = new Date().getFullYear();

export default function LeviesPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [term, setTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLevy, setEditingLevy] = useState(null);
  const [applyDialog, setApplyDialog] = useState(null);
  const { showNotification } = useNotification();

  const { data: levies, loading, error, refetch } = useAsync(
    () => api.getLevies(Number(year), term ? Number(term) : null),
    [year, term]
  );

  const { data: classes } = useAsync(() => api.getClasses(), []);
  const levyList = Array.isArray(levies) ? levies : [];

  const handleEdit = (levy) => {
    setEditingLevy(levy);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingLevy(null);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Additional Charges (Levies)"
        subtitle="One-time charges like trips, uniforms, and events"
        actions={
          <Stack direction="row" spacing={1}>
            <TextField select size="small" label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 100 }}>
              <MenuItem value={CURRENT_YEAR - 1}>{CURRENT_YEAR - 1}</MenuItem>
              <MenuItem value={CURRENT_YEAR}>{CURRENT_YEAR}</MenuItem>
              <MenuItem value={CURRENT_YEAR + 1}>{CURRENT_YEAR + 1}</MenuItem>
            </TextField>
            <TextField select size="small" label="Term" value={term} onChange={(e) => setTerm(e.target.value)} sx={{ width: 100 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="1">Term 1</MenuItem>
              <MenuItem value="2">Term 2</MenuItem>
              <MenuItem value="3">Term 3</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Add Levy
            </Button>
          </Stack>
        }
      />

      <Card>
        <DataState loading={loading} error={error} data={levyList} onRetry={refetch} isEmpty={(d) => d.length === 0} emptyMessage="No levies found">
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Applies To</TableCell>
                    <TableCell>Deadline</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {levyList.map((levy) => (
                    <TableRow key={levy.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{levy.name}</TableCell>
                      <TableCell>Term {levy.term}</TableCell>
                      <TableCell align="right">KES {Number(levy.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={levy.appliesTo} size="small" />
                      </TableCell>
                      <TableCell>{levy.deadline || "—"}</TableCell>
                      <TableCell>
                        <Chip label={levy.status} size="small" color={levy.status === "Active" ? "success" : "default"} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit Levy">
                            <IconButton size="small" onClick={() => handleEdit(levy)} color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {levy.status === "Active" && (
                            <Button size="small" startIcon={<PlayArrowIcon />} onClick={() => setApplyDialog(levy)} variant="outlined">
                              Apply to Students
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      </Card>

      {dialogOpen && (
        <LevyDialog
          levy={editingLevy}
          classes={classes || []}
          defaultYear={year}
          onClose={() => { setDialogOpen(false); setEditingLevy(null); }}
          onSaved={(msg) => {
            setDialogOpen(false);
            setEditingLevy(null);
            showNotification(msg || (editingLevy ? "Levy updated" : "Levy created"), "success");
            refetch();
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}

      {applyDialog && (
        <ApplyLevyDialog
          levy={applyDialog}
          onClose={() => setApplyDialog(null)}
          onApplied={(msg) => {
            setApplyDialog(null);
            showNotification(msg, "success");
            refetch();
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}
    </DashboardLayout>
  );
}

function LevyDialog({ levy, classes, defaultYear, onClose, onSaved, onError }) {
  const isEdit = !!levy;

  const [form, setForm] = useState({
    id: levy?.id || null,
    name: levy?.name || "",
    amount: levy?.amount || "",
    year: levy?.year || defaultYear,
    term: levy?.term || 1,
    appliesTo: levy?.appliesTo || "all",
    targetGrades: levy?.targetGrades || [],
    targetStudents: levy?.targetStudents || [],
    deadline: levy?.deadline || "",
    isOptional: levy?.isOptional || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return onError("Name is required");
    if (!form.amount || Number(form.amount) <= 0) return onError("Amount must be greater than 0");
    if (!form.deadline) return onError("Deadline is required");

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        amount: Number(form.amount),
        year: Number(form.year),
        term: Number(form.term),
        appliesTo: form.appliesTo,
        targetGrades: form.appliesTo === "grades" ? form.targetGrades : [],
        targetStudents: form.appliesTo === "students" ? form.targetStudents : [],
        deadline: form.deadline,
        isOptional: form.isOptional,
      };

      if (form.id) {
        await api.updateLevy(form.id, payload);
        onSaved("Levy updated. All related invoices have been updated automatically.");
      } else {
        await api.createLevy(payload);
        onSaved("Levy created successfully");
      }
    } catch (e) {
      onError(e.message || "Failed to save levy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit Levy" : "Add Levy"}</DialogTitle>
      <DialogContent>
        {isEdit && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Editing this levy will automatically update all invoices that include it.
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            placeholder="e.g., Grade 4 School Trip"
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Amount (KES)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Term"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: Number(e.target.value) })}
              sx={{ width: 120 }}
            >
              <MenuItem value={1}>Term 1</MenuItem>
              <MenuItem value={2}>Term 2</MenuItem>
              <MenuItem value={3}>Term 3</MenuItem>
            </TextField>
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Year"
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              sx={{ width: 120 }}
            />
            <TextField
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <FormControl>
            <InputLabel>Applies To</InputLabel>
            <Select
              value={form.appliesTo}
              label="Applies To"
              onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
            >
              <MenuItem value="all">All Students</MenuItem>
              <MenuItem value="grades">Specific Grades</MenuItem>
              <MenuItem value="students">Specific Students</MenuItem>
            </Select>
          </FormControl>
          {form.appliesTo === "grades" && (
            <FormControl>
              <InputLabel>Select Grades</InputLabel>
              <Select
                multiple
                value={form.targetGrades}
                label="Select Grades"
                onChange={(e) => setForm({ ...form, targetGrades: e.target.value })}
                renderValue={(sel) => `${sel.length} selected`}
              >
                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    <Checkbox checked={form.targetGrades.includes(c.id)} />
                    <ListItemText primary={c.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isOptional}
                onChange={(e) => setForm({ ...form, isOptional: e.target.checked })}
              />
            }
            label="Optional (parents can opt out)"
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

function ApplyLevyDialog({ levy, onClose, onApplied, onError }) {
  const [mode, setMode] = useState("create_new");
  const [dueDate, setDueDate] = useState(levy.deadline || "");
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    try {
      const result = await api.applyLevyToInvoices(levy.id, mode, dueDate || null);
      onApplied(result.message || `Applied levy to ${result.created + result.updated} students`);
    } catch (e) {
      onError(e.message || "Failed to apply levy");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Apply Levy: {levy.name}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Amount: KES {Number(levy.amount).toLocaleString()} • Term {levy.term}, {levy.year}
        </Alert>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          How should this be applied?
        </Typography>
        <RadioGroup value={mode} onChange={(e) => setMode(e.target.value)}>
          <FormControlLabel value="add_to_existing" control={<Radio />} label="Add to existing term invoices" />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: "block", mb: 1 }}>
            Adds the levy amount to each student's existing Term {levy.term} invoice
          </Typography>
          <FormControlLabel value="create_new" control={<Radio />} label="Create separate invoices" />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: "block" }}>
            Creates a new invoice just for this levy
          </Typography>
        </RadioGroup>
        <TextField
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleApply} disabled={applying}>
          {applying ? "Applying..." : "Apply Levy"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
