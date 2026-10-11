"use client";

import { useState, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
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
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { feesApi, formatKES } from "@/lib/feesApi";
import { schoolApi } from "@/lib/schoolApi";
import { FormControlLabel, Checkbox } from "@mui/material";

const CATEGORIES = [
  { value: "tuition", label: "Tuition" },
  { value: "activities", label: "Activities" },
  { value: "meals", label: "Meals" },
  { value: "transport", label: "Transport" },
  { value: "boarding", label: "Boarding" },
  { value: "exam", label: "Exam fee" },
  { value: "other", label: "Other" },
];

export default function FeeStructuresPage() {
  return (
    <>
      <PageGuard permission="fees.view">
        <FeeStructuresContent />
      </PageGuard>
    </>
  );
}

export function FeeStructuresContent() {
  const [yearId, setYearId] = useState("");
  const [editing, setEditing] = useState(null); // { grade, term, structure? }
  const [copyOpen, setCopyOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data, loading, error, refetch } = useAsync(async () => {
    const [years, terms, grades] = await Promise.all([
      schoolApi.getAcademicYears(),
      schoolApi.getTerms(),
      schoolApi.getGradeLevels(),
    ]);
    const yearList = Array.isArray(years) ? years : [];
    if (!yearId && yearList.length > 0) {
      const active = yearList.find((y) => y.status === "active");
      setYearId(active?.id || yearList[0].id);
    }
    const structures = yearId ? await feesApi.listStructures({ year: yearId }) : [];
    return {
      years: yearList,
      terms: Array.isArray(terms) ? terms : [],
      grades: Array.isArray(grades) ? grades : [],
      structures: Array.isArray(structures) ? structures : [],
    };
  }, [yearId]);

  const years = data?.years ?? [];
  const terms = (data?.terms ?? []).filter((t) => String(t.academic_year) === String(yearId));
  const grades = data?.grades ?? [];
  const structures = data?.structures ?? [];

  // Index: `${termId}:${gradeName}` -> structure
  const structureByTermGrade = useMemo(() => {
    const out = {};
    structures.forEach((s) => {
      out[`${s.term}:${s.gradeLevel}`] = s;
    });
    return out;
  }, [structures]);

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const totalCells = terms.length * grades.length;
  const filledCells = structures.length;

  return (
    <>
      <PageHeader
        title="Fee structures"
        subtitle="The price list per term, per grade. Editable — changes only affect future invoices."
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Academic year</InputLabel>
              <Select
                value={yearId}
                label="Academic year"
                onChange={(e) => setYearId(e.target.value)}
              >
                {years.map((y) => (
                  <MenuItem key={y.id} value={y.id}>
                    {y.name} {y.status === "active" ? "· Active" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <RoleGuard permission="fees.manage">
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => setCopyOpen(true)}
                disabled={!yearId}
              >
                Copy from another year
              </Button>
            </RoleGuard>
          </Stack>
        }
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center" flexwrap="wrap" useFlexGap>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Grades
            </Typography>
            <Typography variant="h6">{grades.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Terms
            </Typography>
            <Typography variant="h6">{terms.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Structures set
            </Typography>
            <Typography variant="h6">
              {filledCells} / {totalCells}
            </Typography>
          </Box>
        </Stack>
      </Card>

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() => (
          <>
            {terms.length === 0 ? (
              <Alert severity="info">
                This year has no terms set up. Add terms in School Settings first.
              </Alert>
            ) : grades.length === 0 ? (
              <Alert severity="info">
                No grade levels found. Add grade levels in School Settings first.
              </Alert>
            ) : (
              <Card>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>Grade</TableCell>
                        {terms.map((t) => (
                          <TableCell key={t.id} align="right" sx={{ fontWeight: 600 }}>
                            Term {t.number}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Annual total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grades.map((g) => {
                        const annualTotal = terms.reduce((sum, t) => {
                          const s = structureByTermGrade[`${t.id}:${g.name}`];
                          return sum + (s ? Number(s.total) : 0);
                        }, 0);
                        return (
                          <TableRow key={g.id} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{g.name}</TableCell>
                            {terms.map((t) => {
                              const s = structureByTermGrade[`${t.id}:${g.name}`];
                              return (
                                <TableCell
                                  key={t.id}
                                  align="right"
                                  sx={{
                                    cursor: "pointer",
                                    "&:hover": { bgcolor: "action.hover" },
                                  }}
                                  onClick={() => setEditing({ grade: g, term: t, structure: s })}
                                >
                                  <RoleGuard
                                    permission="fees.manage"
                                    fallback={s ? formatKES(s.total) : "—"}
                                  >
                                    {s ? (
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        justifyContent="flex-end"
                                        alignItems="center"
                                      >
                                        <span style={{ fontWeight: 500 }}>
                                          {formatKES(s.total)}
                                        </span>
                                        <EditIcon
                                          fontSize="small"
                                          sx={{ color: "text.secondary", opacity: 0.5 }}
                                        />
                                      </Stack>
                                    ) : (
                                      <Button size="small" startIcon={<AddIcon />}>
                                        Add
                                      </Button>
                                    )}
                                  </RoleGuard>
                                </TableCell>
                              );
                            })}
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {annualTotal > 0 ? formatKES(annualTotal) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </>
        )}
      </DataState>

      {editing && (
        <StructureDialog
          open={!!editing}
          onClose={() => setEditing(null)}
          yearId={yearId}
          grade={editing.grade}
          term={editing.term}
          structure={editing.structure}
          onSaved={() => {
            setEditing(null);
            notify("Fee structure saved");
            refetch();
          }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      {copyOpen && (
        <CopyForwardDialog
          open={copyOpen}
          onClose={() => setCopyOpen(false)}
          years={years}
          currentYearId={yearId}
          onSaved={(result) => {
            setCopyOpen(false);
            notify(
              `Copied ${result.created} new, updated ${result.updated}, skipped ${result.skipped}.`,
            );
            refetch();
          }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

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

function CopyForwardDialog({ open, onClose, years, currentYearId, onSaved, onError }) {
  const [fromYear, setFromYear] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);

  // Default the source to whatever year isn't the current one
  const otherYears = years.filter((y) => String(y.id) !== String(currentYearId));

  const handleCopy = async () => {
    if (!fromYear) return onError("Pick a source year.");
    setBusy(true);
    try {
      const result = await feesApi.copyStructuresForward(
        Number(fromYear),
        Number(currentYearId),
        overwrite,
      );
      onSaved(result);
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Copy fee structures</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Copy every fee structure (term × grade) into{" "}
            <strong>{years.find((y) => String(y.id) === String(currentYearId))?.name}</strong>.
            Items are copied as-is.
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Copy from</InputLabel>
            <Select
              value={fromYear}
              label="Copy from"
              onChange={(e) => setFromYear(e.target.value)}
            >
              {otherYears.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            }
            label="Overwrite existing structures (deletes their items)"
          />

          {!overwrite && (
            <Alert severity="info">
              Structures that already exist in the target year will be skipped.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleCopy} disabled={busy || !fromYear}>
          {busy ? "Copying…" : "Copy structures"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StructureDialog({ open, onClose, yearId, grade, term, structure, onSaved, onError }) {
  const isEdit = !!structure;
  const [items, setItems] = useState(
    isEdit
      ? structure.items.map((i) => ({
          name: i.name,
          category: i.category,
          amount: String(i.amount),
          is_mandatory: i.is_mandatory,
        }))
      : [{ name: "Tuition", category: "tuition", amount: "", is_mandatory: true }],
  );
  const [busy, setBusy] = useState(false);

  const handleChange = (i, field, value) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));

  const addLine = () =>
    setItems((prev) => [...prev, { name: "", category: "other", amount: "", is_mandatory: true }]);

  const removeLine = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  const handleSave = async () => {
    if (!yearId || !term?.id || !grade?.name) {
      return onError("Missing year, term or grade");
    }

    const cleaned = items
      .filter((it) => it.name.trim() && Number(it.amount) > 0)
      .map((it) => ({
        name: it.name.trim(),
        category: it.category,
        amount: Number(it.amount),
        is_mandatory: it.is_mandatory,
      }));

    if (cleaned.length === 0) {
      return onError("Add at least one item with an amount.");
    }

    const payload = {
      academic_year: Number(yearId),
      term: term.id,
      gradeLevel: grade.name,
      items: cleaned,
    };

    setBusy(true);
    try {
      if (isEdit) {
        await feesApi.updateStructure(structure.id, payload);
      } else {
        await feesApi.createStructure(payload);
      }
      onSaved();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? "Edit" : "New"} fee structure · {grade?.name} · {term?.label}
      </DialogTitle>
      <DialogContent dividers>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount (KES)</TableCell>
                <TableCell padding="checkbox" />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <TextField
                      size="small"
                      value={it.name}
                      onChange={(e) => handleChange(i, "name", e.target.value)}
                      placeholder="e.g. Tuition"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={it.category}
                        onChange={(e) => handleChange(i, "category", e.target.value)}
                      >
                        {CATEGORIES.map((c) => (
                          <MenuItem key={c.value} value={c.value}>
                            {c.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={it.amount}
                      onChange={(e) => handleChange(i, "amount", e.target.value)}
                      inputProps={{ min: 0, style: { textAlign: "right" } }}
                      sx={{ width: 140 }}
                    />
                  </TableCell>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => removeLine(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button startIcon={<AddIcon />} onClick={addLine} sx={{ mt: 2 }}>
          Add item
        </Button>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" justifyContent="flex-end" spacing={3}>
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
            Total per student
          </Typography>
          <Typography variant="h5">{formatKES(total)}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
