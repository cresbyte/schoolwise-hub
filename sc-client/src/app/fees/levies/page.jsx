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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Radio,
  RadioGroup,
  FormLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatKES } from "@/lib/utils";
import Link from "next/link";

const TERMS = [1, 2, 3];
const YEARS = ["2024", "2025", "2026", "2027"];

export default function AdditionalChargesPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="fees.view">
        <AdditionalChargesContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function AdditionalChargesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialYear = searchParams.get("year") || "2026";

  const [year, setYear] = useState(initialYear);
  const [term, setTerm] = useState("all");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);

  const { data, loading, error, refetch } = useAsync(async () => {
    const [grades, students, charges] = await Promise.all([
      api.getGrades(),
      api.getStudents(),
      api.getAdditionalCharges({ year: Number(year), term: term === "all" ? null : Number(term) }),
    ]);
    return { grades, students, charges };
  }, [year, term]);

  const grades = data?.grades ?? [];
  const students = data?.students ?? [];
  const charges = data?.charges ?? [];

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAdd = () => {
    setEditingCharge(null);
    setDialogOpen(true);
  };

  const handleEdit = (charge) => {
    setEditingCharge(charge);
    setDialogOpen(true);
  };

  const handleRemove = async (charge) => {
    if (window.confirm(`Remove "${charge.name}"? It will no longer be applied to new invoices.`)) {
      try {
        await api.removeAdditionalCharge(charge.id);
        showSnackbar("Charge removed");
        refetch();
      } catch (e) {
        showSnackbar(e.message || "Failed to remove charge", "error");
      }
    }
  };

  return (
    <>
      <PageHeader
        title="Additional Charges"
        subtitle="Manage ad-hoc fees, trips, activities, and levies."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              href={`/fees/structures?year=${year}`}
              startIcon={<ArrowBackIcon />}
              variant="outlined"
            >
              Back to Fee Structures
            </Button>
            <RoleGuard permission="finance.*">
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                Add Charge
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
        isEmpty={(d) => !d.grades || d.grades.length === 0}
        emptyMessage="No grades found."
      >
        {() => (
          <Stack spacing={3}>
            {/* Filters */}
            <Card sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    value={year}
                    label="Academic Year"
                    onChange={(e) => setYear(e.target.value)}
                  >
                    {YEARS.map((y) => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Term</InputLabel>
                  <Select value={term} label="Term" onChange={(e) => setTerm(e.target.value)}>
                    <MenuItem value="all">All Terms</MenuItem>
                    {TERMS.map((t) => (
                      <MenuItem key={t} value={t}>
                        Term {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Card>

            {/* Charges Table */}
            <Card>
              {charges.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary">
                    No additional charges found for this filter.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Charge Name</TableCell>
                        <TableCell>Term</TableCell>
                        <TableCell>Applies To</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Deadline</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {charges.map((c) => (
                        <TableRow key={c.id} sx={{ opacity: c.status === "Removed" ? 0.5 : 1 }}>
                          <TableCell>
                            {c.name}
                            {c.isOptional && <Chip size="small" label="Optional" sx={{ ml: 1 }} />}
                          </TableCell>
                          <TableCell>Term {c.term}</TableCell>
                          <TableCell>
                            {c.appliesTo === "school" && "Whole School"}
                            {c.appliesTo === "grades" &&
                              c.targetGrades
                                .map((gid) => grades.find((g) => g.id === gid)?.name)
                                .join(", ")}
                            {c.appliesTo === "students" &&
                              `${c.targetStudents.length} Selected Students`}
                          </TableCell>
                          <TableCell align="right">{formatKES(c.amount)}</TableCell>
                          <TableCell>{c.deadline ? new Date(c.deadline).toLocaleDateString() : "-"}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={c.status}
                              color={c.status === "Active" ? "success" : "default"}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {c.status === "Active" && (
                              <RoleGuard permission="finance.*">
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => handleEdit(c)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemove(c)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </RoleGuard>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </Stack>
        )}
      </DataState>

      {dialogOpen && (
        <ChargeDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          charge={editingCharge}
          year={Number(year)}
          grades={grades}
          students={students}
          onSaved={() => {
            setDialogOpen(false);
            showSnackbar("Charge saved successfully");
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

function ChargeDialog({ open, onClose, charge, year, grades, students, onSaved, onError }) {
  const isEdit = !!charge;
  const [form, setForm] = useState({
    id: charge?.id || null,
    name: charge?.name || "",
    amount: charge?.amount || "",
    term: charge?.term || 1,
    deadline: charge?.deadline || "",
    appliesTo: charge?.appliesTo || "school",
    targetGrades: charge?.targetGrades || [],
    targetStudents: charge?.targetStudents || [],
    isOptional: charge?.isOptional || false,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "appliesTo") {
      if (value === "school")
        setForm((prev) => ({ ...prev, targetGrades: [], targetStudents: [] }));
      else if (value === "grades") setForm((prev) => ({ ...prev, targetStudents: [] }));
      else if (value === "students") setForm((prev) => ({ ...prev, targetGrades: [] }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return onError("Name is required");
    if (!form.amount || Number(form.amount) <= 0) return onError("Valid amount is required");
    if (form.appliesTo === "grades" && form.targetGrades.length === 0)
      return onError("Please select at least one grade");
    if (form.appliesTo === "students" && form.targetStudents.length === 0)
      return onError("Please select at least one student");

    setSaving(true);
    try {
      await api.saveAdditionalCharge({ ...form, deadline: form.deadline || null, year });
      onSaved();
    } catch (e) {
      onError(e.message || "Failed to save charge");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit Additional Charge" : "Add Additional Charge"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Charge Name"
            placeholder="e.g., Science Trip, Swimming"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Term</InputLabel>
              <Select
                value={form.term}
                label="Term"
                onChange={(e) => handleChange("term", Number(e.target.value))}
              >
                {TERMS.map((t) => (
                  <MenuItem key={t} value={t}>
                    Term {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Amount (KES)"
              type="number"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              fullWidth
            />
            <TextField
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => handleChange("deadline", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>

          <FormControl component="fieldset">
            <FormLabel component="legend">Applies To</FormLabel>
            <RadioGroup
              row
              value={form.appliesTo}
              onChange={(e) => handleChange("appliesTo", e.target.value)}
            >
              <FormControlLabel value="school" control={<Radio />} label="Whole School" />
              <FormControlLabel value="grades" control={<Radio />} label="Specific Grades" />
              <FormControlLabel value="students" control={<Radio />} label="Selected Students" />
            </RadioGroup>
          </FormControl>

          {form.appliesTo === "grades" && (
            <FormControl fullWidth size="small">
              <InputLabel>Grades</InputLabel>
              <Select
                multiple
                value={form.targetGrades}
                label="Grades"
                onChange={(e) => handleChange("targetGrades", e.target.value)}
                renderValue={(selected) =>
                  selected.map((id) => grades.find((g) => g.id === id)?.name).join(", ")
                }
              >
                {grades.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    <Checkbox checked={form.targetGrades.includes(g.id)} />
                    {g.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {form.appliesTo === "students" && (
            <FormControl fullWidth size="small">
              <InputLabel>Students</InputLabel>
              <Select
                multiple
                value={form.targetStudents}
                label="Students"
                onChange={(e) => handleChange("targetStudents", e.target.value)}
                renderValue={(selected) => `${selected.length} students selected`}
              >
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Checkbox checked={form.targetStudents.includes(s.id)} />
                    {s.name} ({grades.find((g) => g.id === s.gradeId)?.name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={form.isOptional}
                onChange={(e) => handleChange("isOptional", e.target.checked)}
              />
            }
            label="Optional (only charged to students who opt-in)"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Charge"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
