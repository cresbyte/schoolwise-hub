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
  Snackbar,
  Alert,
  Radio,
  RadioGroup,
  FormLabel,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  DialogContentText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import HistoryIcon from "@mui/icons-material/History";
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

const TERMS = [1, 2, 3];
const YEARS = ["2024", "2025", "2026", "2027"];

export default function FeeStructuresPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="fees.view">
        <FeeSetupContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function FeeSetupContent() {
  const router = useRouter();
  const [year, setYear] = useState("2026");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data, loading, error, refetch } = useAsync(async () => {
    const [grades, structure, levies, history, students] = await Promise.all([
      api.getClasses(),
      api.getFeeStructure(Number(year)),
      api.getLevies(Number(year)),
      api.getChangeHistory(Number(year)),
      api.getStudents({ status: "active" }),
    ]);
    return { grades, structure, levies, history, students };
  }, [year]);

  const grades = data?.grades ?? [];
  const structure = data?.structure ?? { status: "None", items: {} };
  const levies = data?.levies ?? [];
  const history = data?.history ?? [];
  const students = Array.isArray(data?.students) ? data.students : data?.students?.results || [];

  const hasStructure = structure.status !== "None";
  const isActive = structure.status === "Active";
  const nextYear = String(Number(year) + 1);
  const canCopyForward = hasStructure && YEARS.includes(nextYear);

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const initialize = async () => {
    try {
      await api.createFeeStructure({ year: Number(year), copyFromYear: null });
      notify(`${year} fee structure created. You can now edit the amounts.`);
      refetch();
    } catch (e) {
      notify(e.message || "Could not create the fee structure", "error");
    }
  };

  const copyToNextYear = async () => {
    try {
      await api.createFeeStructure({ year: Number(nextYear), copyFromYear: Number(year) });
      setYear(nextYear);
      notify(`${nextYear} fee structure created from ${year}`);
    } catch (e) {
      notify(e.message || "Could not create the fee structure", "error");
    }
  };

  const refreshStructure = async () => {
    try {
      const result = await api.refreshFeeStructure(Number(year));
      if (result.added === 0) {
        notify("All classes are already in the structure", "info");
      } else {
        notify(`${result.added} new fee rows added for new classes`);
      }
      refetch();
    } catch (e) {
      notify(e.message || "Could not refresh the structure", "error");
    }
  };

  // NEW: Activate the fee structure
  const activateStructure = async () => {
    if (!window.confirm("Activate this fee structure? This will allow invoice generation.")) return;
    try {
      await api.updateFeeStructure(Number(year), {
        changes: [],
        reason: "Activated for invoice generation",
        status: "Active"
      });
      notify("Fee structure activated successfully");
      refetch();
    } catch (e) {
      notify(e.message || "Could not activate the structure", "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Fee structures"
        subtitle="Tuition fees and additional charges for each academic year."
        actions={
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Academic year</InputLabel>
              <Select value={year} label="Academic year" onChange={(e) => setYear(e.target.value)}>
                {YEARS.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {hasStructure ? (
              <StatusChip status={structure.status} />
            ) : (
              <Chip label="Not Set" color="error" size="small" variant="outlined" />
            )}

            {/* CREATE BUTTON - Only show if no structure exists */}
            <RoleGuard permission="finance.*">
              {!hasStructure && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={initialize}>
                  Create {year} Structure
                </Button>
              )}
            </RoleGuard>

            {/* ACTIVATE BUTTON - Only show if structure exists but is not Active */}
            <RoleGuard permission="finance.*">
              {hasStructure && !isActive && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={activateStructure}
                >
                  Activate Structure
                </Button>
              )}
            </RoleGuard>

            <PageMenu
              onPrint={() => router.push(`/fees/structures/print?year=${year}`)}
              onCopy={canCopyForward ? copyToNextYear : null}
              onRefresh={hasStructure ? refreshStructure : null}
              nextYear={nextYear}
              printDisabled={!hasStructure}
              refreshDisabled={!hasStructure}
            />
          </Stack>
        }
      />

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={(d) => !d.grades || d.grades.length === 0}
        emptyMessage="No classes found. Please add classes first before setting up fees."
      >
        {() => (
          <Stack spacing={3}>
            {hasStructure ? (
              <TuitionStructure
                year={Number(year)}
                grades={grades}
                structure={structure}
                history={history}
                onSaved={() => {
                  notify("Fee structure updated");
                  refetch();
                }}
                onError={(msg) => notify(msg, "error")}
              />
            ) : (
              <Card sx={{ p: 6, textAlign: "center" }}>
                <Typography variant="h6" gutterBottom>
                  No fees set for {year}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Select a year above and click "Create Structure" to begin.
                </Typography>
              </Card>
            )}

            <AdditionalChargesSection
              year={Number(year)}
              levies={levies}
              grades={grades}
              students={students}
              onSaved={(msg) => {
                notify(msg);
                refetch();
              }}
              onError={(msg) => notify(msg, "error")}
            />
          </Stack>
        )}
      </DataState>

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

function StatusChip({ status }) {
  const map = {
    Active: { label: "Active", color: "success" },
    Archived: { label: "Archived", color: "default" },
  };
  const { label, color } = map[status] || { label: "Draft", color: "warning" };
  return <Chip label={label} color={color} size="small" variant="outlined" />;
}

function PageMenu({ onPrint, onCopy, onRefresh, nextYear, printDisabled, refreshDisabled }) {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);
  return (
    <>
      <IconButton aria-label="More actions" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={close}>
        <MenuItem
          disabled={printDisabled}
          onClick={() => {
            close();
            onPrint();
          }}
        >
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print fee structure</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={refreshDisabled}
          onClick={() => {
            close();
            onRefresh();
          }}
        >
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sync new classes</ListItemText>
        </MenuItem>
        {onCopy && (
          <RoleGuard permission="finance.*">
            <MenuItem
              onClick={() => {
                close();
                onCopy();
              }}
            >
              <ListItemIcon>
                <ContentCopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Copy to {nextYear}</ListItemText>
            </MenuItem>
          </RoleGuard>
        )}
      </Menu>
    </>
  );
}

function CardHeader({ title, description, actions }) {
  return (
    <Box
      sx={{
        p: 2.5,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Box>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      {actions}
    </Box>
  );
}

function TuitionStructure({ year, grades, structure, history, onSaved, onError }) {
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const amountOf = (source, gradeId, term) => source[`${gradeId}_${term}`] || 0;
  const annualTotal = (source, gradeId) =>
    TERMS.reduce((sum, t) => sum + amountOf(source, gradeId, t), 0);

  const openEdit = () => {
    setEditForm({ ...structure.items });
    setReason("");
    setEditOpen(true);
  };

  const handleCellChange = (gradeId, term, value) => {
    setEditForm((prev) => ({ ...prev, [`${gradeId}_${term}`]: Math.max(0, Number(value) || 0) }));
  };

  const changes = grades.flatMap((g) =>
    TERMS.filter((t) => amountOf(structure.items, g.id, t) !== amountOf(editForm, g.id, t)).map(
      (t) => ({ gradeId: g.id, term: t, amount: amountOf(editForm, g.id, t) }),
    ),
  );
  const reasonMissing = changes.length > 0 && !reason.trim();

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateFeeStructure(year, { changes, reason: reason.trim() });
      setEditOpen(false);
      onSaved();
    } catch (e) {
      onError(e.message || "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title={`${year} tuition`}
          description="Fee per grade and term. Every change is recorded in the history."
          actions={
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                color="inherit"
                startIcon={<HistoryIcon />}
                onClick={() => setHistoryOpen(true)}
                disabled={history.length === 0}
              >
                History{history.length > 0 ? ` (${history.length})` : ""}
              </Button>
              <RoleGuard permission="finance.*">
                <Button variant="contained" startIcon={<EditIcon />} onClick={openEdit}>
                  Edit fees
                </Button>
              </RoleGuard>
            </Stack>
          }
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Grade</TableCell>
                {TERMS.map((t) => (
                  <TableCell key={t} align="right">
                    Term {t}
                  </TableCell>
                ))}
                <TableCell align="right">Annual total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grades.map((g) => (
                <TableRow key={g.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{g.name}</TableCell>
                  {TERMS.map((t) => (
                    <TableCell key={t} align="right">
                      {formatKES(amountOf(structure.items, g.id, t))}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatKES(annualTotal(structure.items, g.id))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit {year} fees</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Changes apply to new invoices only. Invoices already generated stay as they are.
          </Alert>
          <TableContainer sx={{ maxHeight: 360, mb: 3 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Grade</TableCell>
                  {TERMS.map((t) => (
                    <TableCell key={t} align="right">
                      Term {t}
                    </TableCell>
                  ))}
                  <TableCell align="right">Annual total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grades.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>{g.name}</TableCell>
                    {TERMS.map((t) => {
                      const changed =
                        amountOf(structure.items, g.id, t) !== amountOf(editForm, g.id, t);
                      return (
                        <TableCell key={t} align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={amountOf(editForm, g.id, t)}
                            onChange={(e) => handleCellChange(g.id, t, e.target.value)}
                            color={changed ? "warning" : "primary"}
                            focused={changed}
                            sx={{ width: 110 }}
                            inputProps={{
                              min: 0,
                              "aria-label": `${g.name} term ${t}`,
                              style: { textAlign: "right" },
                            }}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatKES(annualTotal(editForm, g.id))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TextField
            required
            fullWidth
            multiline
            rows={2}
            label="Reason for change"
            placeholder="e.g. Approved by the board in September 2026"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={changes.length === 0}
            error={reasonMissing && reason.length > 0}
            helperText={
              changes.length === 0
                ? "Change a fee above to add a reason."
                : "Required. This is saved in the history."
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
            {changes.length === 0
              ? "No changes yet"
              : `${changes.length} fee${changes.length > 1 ? "s" : ""} changed`}
          </Typography>
          <Button color="inherit" onClick={() => setEditOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={changes.length === 0 || reasonMissing || saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <HistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        grades={grades}
      />
    </>
  );
}

function AdditionalChargesSection({ year, levies, grades, students, onSaved, onError }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLevy, setEditingLevy] = useState(null);
  const [menu, setMenu] = useState({ anchor: null, levy: null });
  const [removing, setRemoving] = useState(null);

  const gradeNames = (ids) =>
    ids
      .map((id) => grades.find((g) => g.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  const closeMenu = () => setMenu({ anchor: null, levy: null });

  const confirmRemove = async () => {
    try {
      await api.deleteLevy(removing.id);
      onSaved(`"${removing.name}" removed`);
    } catch (e) {
      onError(e.message || "Could not remove the charge");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Additional charges"
          description="Trips, activities and levies for the whole school, specific grades or selected students."
          actions={
            <RoleGuard permission="finance.*">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingLevy(null);
                  setDialogOpen(true);
                }}
              >
                Add charge
              </Button>
            </RoleGuard>
          }
        />
        <Divider />
        {levies.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No additional charges for {year}. Use “Add charge” to create one.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Charge</TableCell>
                  <TableCell>Term</TableCell>
                  <TableCell>Applies to</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell padding="checkbox" />
                </TableRow>
              </TableHead>
              <TableBody>
                {levies.map((c) => (
                  <TableRow key={c.id} hover sx={{ opacity: c.status === "Removed" ? 0.5 : 1 }}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {c.name}
                      {c.isOptional && (
                        <Chip size="small" variant="outlined" label="Optional" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>Term {c.term}</TableCell>
                    <TableCell>
                      {c.appliesTo === "all" && "Whole school"}
                      {c.appliesTo === "grades" && gradeNames(c.targetGrades)}
                      {c.appliesTo === "students" &&
                        `${c.targetStudents?.length || 0} selected students`}
                    </TableCell>
                    <TableCell align="right">{formatKES(c.amount)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={c.status}
                        color={c.status === "Active" ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell padding="checkbox">
                      {c.status === "Active" && (
                        <RoleGuard permission="finance.*">
                          <IconButton
                            size="small"
                            aria-label={`Actions for ${c.name}`}
                            onClick={(e) => setMenu({ anchor: e.currentTarget, levy: c })}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
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

      <Menu anchorEl={menu.anchor} open={!!menu.anchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            setEditingLevy(menu.levy);
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
            setRemoving(menu.levy);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Remove</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={!!removing} onClose={() => setRemoving(null)}>
        <DialogTitle>Remove “{removing?.name}”?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            It will no longer be added to new invoices. Existing invoices are not changed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmRemove}>
            Remove charge
          </Button>
        </DialogActions>
      </Dialog>

      {dialogOpen && (
        <ChargeDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          levy={editingLevy}
          year={year}
          grades={grades}
          students={students}
          onSaved={() => {
            setDialogOpen(false);
            onSaved("Charge saved");
          }}
          onError={onError}
        />
      )}
    </>
  );
}

function ChargeDialog({ open, onClose, levy, year, grades, students, onSaved, onError }) {
  const isEdit = !!levy;
  const [form, setForm] = useState({
    id: levy?.id || null,
    name: levy?.name || "",
    amount: levy?.amount || "",
    term: levy?.term || 1,
    appliesTo: levy?.appliesTo || "all",
    targetGrades: levy?.targetGrades || [],
    targetStudents: levy?.targetStudents || [],
    isOptional: levy?.isOptional || false,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleAppliesTo = (value) =>
    setForm((prev) => ({
      ...prev,
      appliesTo: value,
      targetGrades: value === "grades" ? prev.targetGrades : [],
      targetStudents: value === "students" ? prev.targetStudents : [],
    }));

  const handleSave = async () => {
    if (!form.name.trim()) return onError("Enter a name for the charge");
    if (!form.amount || Number(form.amount) <= 0)
      return onError("Enter an amount greater than zero");
    if (form.appliesTo === "grades" && form.targetGrades.length === 0)
      return onError("Select at least one grade");
    if (form.appliesTo === "students" && form.targetStudents.length === 0)
      return onError("Select at least one student");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        amount: Number(form.amount),
        year,
        term: form.term,
        appliesTo: form.appliesTo,
        targetGrades: form.targetGrades,
        targetStudents: form.targetStudents,
        isOptional: form.isOptional,
      };

      if (form.id) {
        await api.updateLevy(form.id, payload);
      } else {
        await api.createLevy(payload);
      }
      onSaved();
    } catch (e) {
      onError(e.message || "Could not save the charge");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit charge" : "Add charge"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Charge name"
            placeholder="e.g. Science trip, Swimming"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
            autoFocus
          />
          <Stack direction="row" spacing={2}>
            <FormControl sx={{ minWidth: 130 }}>
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
              inputProps={{ min: 0 }}
              fullWidth
            />
          </Stack>

          <FormControl component="fieldset">
            <FormLabel component="legend">Applies to</FormLabel>
            <RadioGroup
              row
              value={form.appliesTo}
              onChange={(e) => handleAppliesTo(e.target.value)}
            >
              <FormControlLabel value="all" control={<Radio />} label="Whole school" />
              <FormControlLabel value="grades" control={<Radio />} label="Specific grades" />
              <FormControlLabel value="students" control={<Radio />} label="Selected students" />
            </RadioGroup>
          </FormControl>

          {form.appliesTo === "grades" && (
            <FormControl fullWidth>
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
            <FormControl fullWidth>
              <InputLabel>Students</InputLabel>
              <Select
                multiple
                value={form.targetStudents}
                label="Students"
                onChange={(e) => handleChange("targetStudents", e.target.value)}
                renderValue={(selected) => `${selected.length} selected`}
              >
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Checkbox checked={form.targetStudents.includes(s.id)} />
                    {s.name}
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
            label="Optional: only charge students who opt in"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add charge"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function HistoryDialog({ open, onClose, history, grades }) {
  const gradeName = (id) => grades.find((g) => g.id === id)?.name || "Unknown grade";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Change history</DialogTitle>
      <DialogContent dividers>
        {history.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No changes recorded yet.
          </Typography>
        ) : (
          <Stack divider={<Divider flexItem />} spacing={2}>
            {history.map((h) => (
              <Box key={h.id}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={2}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {gradeName(h.gradeId)}, Term {h.term}
                    </Typography>
                    <Typography variant="body2">
                      {formatKES(h.previousAmount)} to {formatKES(h.newAmount)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
                    {new Date(h.changedAt).toLocaleDateString("en-KE")}
                    <br />
                    {h.changedBy}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Reason: {h.reason}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function formatKES(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}
