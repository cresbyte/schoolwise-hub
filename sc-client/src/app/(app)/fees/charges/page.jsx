"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputLabel,
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
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { feesApi, CHARGE_SCOPES, formatKES } from "@/lib/feesApi";
import { schoolApi } from "@/lib/schoolApi";
import { academicsApi } from "@/lib/academicsApi";
import CircularProgress from "@mui/material/CircularProgress";

const STATUS_META = {
  draft: { label: "Draft", color: "default" },
  active: { label: "Active", color: "success" },
  closed: { label: "Closed", color: "default" },
  cancelled: { label: "Cancelled", color: "error" },
};

const PAYMENT_STATUS_META = {
  paid: { label: "Paid", color: "success" },
  partial: { label: "Partial", color: "warning" },
  unpaid: { label: "Unpaid", color: "error" },
  not_applied: { label: "Not applied", color: "default" },
};

export default function ChargesPage() {
  return (
    <>
      <PageGuard permission="fees.view">
        <ChargesContent />
      </PageGuard>
    </>
  );
}

// ---------------------------------------------------------------------
// ChargesContent
// ---------------------------------------------------------------------
export function ChargesContent() {
  const [filters, setFilters] = useState({ year: "", status: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState({ anchor: null, charge: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [previewData, setPreviewData] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [rosterCharge, setRosterCharge] = useState(null);

  const { data, loading, error, refetch } = useAsync(async () => {
    const [charges, years, terms, grades, classes] = await Promise.all([
      feesApi.listCharges(filters),
      schoolApi.getAcademicYears(),
      schoolApi.getTerms(),
      schoolApi.getGradeLevels(),
      academicsApi.getClasses({ academic_year: null }),
    ]);
    return {
      charges: Array.isArray(charges) ? charges : [],
      years: Array.isArray(years) ? years : [],
      terms: Array.isArray(terms) ? terms : [],
      grades: Array.isArray(grades) ? grades : [],
      classes: Array.isArray(classes) ? classes : [],
    };
  }, [filters]);

  const charges = data?.charges ?? [];
  const years = data?.years ?? [];
  const terms = data?.terms ?? [];
  const grades = data?.grades ?? [];
  const classes = data?.classes ?? [];

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const closeMenu = () => setMenu({ anchor: null, charge: null });

  const openPreview = async (charge) => {
    setPreviewBusy(true);
    setPreviewData({ charge, loading: true });
    try {
      const data = await feesApi.previewCharge(charge.id);
      setPreviewData({ charge, data });
    } catch (e) {
      notify(e.message, "error");
      setPreviewData(null);
    } finally {
      setPreviewBusy(false);
    }
  };

  const confirmActivate = async () => {
    if (!previewData?.charge) return;
    const { charge } = previewData;
    setPreviewBusy(true);
    try {
      const result = await feesApi.activateCharge(charge.id);
      notify(`Applied to ${result.applied} students.`);
      setPreviewData(null);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setPreviewBusy(false);
    }
  };

  const handleCancel = async () => {
    const c = menu.charge;
    closeMenu();
    if (!window.confirm(`Cancel "${c.name}"? Parents who paid will receive a credit.`)) return;
    try {
      await feesApi.cancelCharge(c.id, "Cancelled by admin");
      notify("Charge cancelled");
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async () => {
    const c = menu.charge;
    closeMenu();
    if (c.status !== "draft") return notify("Only draft charges can be deleted.", "error");
    if (!window.confirm(`Delete "${c.name}"?`)) return;
    try {
      await feesApi.deleteCharge(c.id);
      notify("Charge deleted");
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <>
      <PageHeader
        title="One-off charges"
        subtitle="Trips, activities, exam fees. Added to invoices alongside the standard structure."
        actions={
          <RoleGuard permission="fees.manage">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              New charge
            </Button>
          </RoleGuard>
        }
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} flexwrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={filters.year}
              label="Year"
              onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
            >
              <MenuItem value="">All</MenuItem>
              {years.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => charges.length === 0}
        emptyMessage="No one-off charges yet."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Due</TableCell>
                    <TableCell align="center">Optional</TableCell>
                    <TableCell align="right">Applied</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell padding="checkbox" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {charges.map((c) => {
                    const meta = STATUS_META[c.status] || STATUS_META.draft;
                    return (
                      <TableRow key={c.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {c.name}
                          {c.description && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {c.description.slice(0, 60)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {CHARGE_SCOPES.find((s) => s.value === c.scope)?.label || c.scope}
                        </TableCell>
                        <TableCell align="right">{formatKES(c.amount)}</TableCell>
                        <TableCell>{c.due_date}</TableCell>
                        <TableCell align="center">
                          {c.is_optional ? (
                            <Chip size="small" label="Yes" variant="outlined" />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell align="right">{c.appliedCount || 0}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={meta.label}
                            color={meta.color}
                          />
                        </TableCell>
                        <TableCell padding="checkbox">
                          <RoleGuard permission="fees.manage">
                            <IconButton
                              size="small"
                              onClick={(e) => setMenu({ anchor: e.currentTarget, charge: c })}
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
        {/* View roster — available for any status once applied */}
        {menu.charge && menu.charge.status !== "draft" && (
          <MenuItem
            onClick={() => {
              const charge = menu.charge;
              closeMenu();
              setRosterCharge(charge);
            }}
          >
            <ReceiptIcon fontSize="small" sx={{ mr: 1 }} />
            View roster
          </MenuItem>
        )}
        {menu.charge?.status === "draft" && (
          <MenuItem
            onClick={() => {
              const charge = menu.charge;
              closeMenu();
              openPreview(charge);
            }}
          >
            <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} color="primary" />
            Activate and apply
          </MenuItem>
        )}
        {(menu.charge?.status === "draft" || menu.charge?.status === "active") && (
          <MenuItem
            onClick={() => {
              setEditing(menu.charge);
              setDialogOpen(true);
              closeMenu();
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        {menu.charge?.status === "active" && (
          <MenuItem onClick={handleCancel} sx={{ color: "error.main" }}>
            <CancelIcon fontSize="small" sx={{ mr: 1 }} />
            Cancel charge
          </MenuItem>
        )}
        {menu.charge?.status === "draft" && (
          <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {dialogOpen && (
        <ChargeDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          charge={editing}
          years={years}
          terms={terms}
          grades={grades}
          classes={classes}
          onSaved={(response) => {
            setDialogOpen(false);
            const sync = response?.syncResult;
            if (sync) {
              const parts = [];
              if (sync.added) parts.push(`${sync.added} added`);
              if (sync.updated) parts.push(`${sync.updated} updated`);
              if (sync.removed) parts.push(`${sync.removed} credited`);
              notify(
                (editing ? "Charge updated" : "Charge created") +
                  (parts.length ? ` · ${parts.join(", ")}` : ""),
              );
            } else {
              notify(editing ? "Charge updated" : "Charge created");
            }
            refetch();
          }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      {/* Activate preview dialog */}
      <Dialog
        open={!!previewData}
        onClose={() => !previewBusy && setPreviewData(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Activate {previewData?.charge?.name}?</DialogTitle>
        <DialogContent dividers>
          {previewData?.loading ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Counting affected students…
              </Typography>
            </Stack>
          ) : previewData?.data ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                This will add <strong>{formatKES(previewData.data.amount)}</strong> to{" "}
                <strong>{previewData.data.studentCount}</strong> students' invoices. Total value:{" "}
                <strong>{formatKES(previewData.data.totalValue)}</strong>.
              </Alert>

              {previewData.data.sample.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Sample students
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>Class</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.data.sample.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell sx={{ fontWeight: 500 }}>{s.name}</TableCell>
                            <TableCell>{s.className}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {previewData.data.hasMore && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      … and {previewData.data.studentCount - previewData.data.sample.length} more.
                    </Typography>
                  )}
                </>
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setPreviewData(null)} disabled={previewBusy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmActivate}
            disabled={previewBusy || previewData?.loading}
          >
            {previewBusy ? "Applying…" : "Activate and apply"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Roster dialog */}
      <ChargeRosterDialog charge={rosterCharge} onClose={() => setRosterCharge(null)} />

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

// ---------------------------------------------------------------------
// ChargeRosterDialog
// ---------------------------------------------------------------------
function ChargeRosterDialog({ charge, onClose }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, loading, error, refetch } = useAsync(
    () =>
      charge
        ? feesApi.getChargeRoster(charge.id, statusFilter ? { status: statusFilter } : {})
        : null,
    [charge?.id, statusFilter],
  );

  const students = data?.students ?? [];
  const summary = data?.summary ?? {};

  const filtered = search
    ? students.filter(
        (s) =>
          (s.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
          (s.admissionNumber || "").toLowerCase().includes(search.toLowerCase()),
      )
    : students;

  const collectionRate =
    summary.totalValue && Number(summary.totalValue) > 0
      ? Math.min(
          100,
          Math.round((Number(summary.totalCollected) / Number(summary.totalValue)) * 100),
        )
      : 0;

  return (
    <Dialog open={!!charge} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ReceiptIcon color="action" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {charge?.name} — Roster
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {charge?.is_optional ? "Optional charge" : "Mandatory charge"} ·{" "}
              {formatKES(charge?.amount || 0)} per student
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading roster…
            </Typography>
          </Stack>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={refetch}>
                Retry
              </Button>
            }
          >
            {error.message || "Failed to load roster."}
          </Alert>
        ) : (
          <>
            {/* Summary chips */}
            <Stack direction="row" spacing={1} flexwrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Chip label={`Total: ${summary.total ?? 0}`} />
              {charge?.is_optional && (
                <>
                  <Chip
                    label={`Opted in: ${summary.optedIn ?? 0}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip label={`Opted out: ${summary.optedOut ?? 0}`} variant="outlined" />
                </>
              )}
              <Chip label={`Paid: ${summary.paid ?? 0}`} color="success" />
              <Chip label={`Partial: ${summary.partial ?? 0}`} color="warning" />
              <Chip label={`Unpaid: ${summary.unpaid ?? 0}`} color="error" />
              {summary.notApplied > 0 && (
                <Chip label={`Not applied: ${summary.notApplied}`} variant="outlined" />
              )}
            </Stack>

            {/* Collection progress */}
            <Card variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: "grey.50" }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <Typography variant="caption" color="text.secondary">
                  Collected: <strong>{formatKES(summary.totalCollected || 0)}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Expected: <strong>{formatKES(summary.totalValue || 0)}</strong> ({collectionRate}
                  %)
                </Typography>
              </Stack>
              <Box
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "grey.200",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${collectionRate}%`,
                    height: "100%",
                    bgcolor:
                      collectionRate >= 100
                        ? "success.main"
                        : collectionRate >= 50
                          ? "primary.main"
                          : "warning.main",
                    transition: "width 0.3s ease",
                  }}
                />
              </Box>
            </Card>

            {/* Filters */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexwrap="wrap" useFlexGap>
              <TextField
                size="small"
                placeholder="Search name or admission no."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ minWidth: 240 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All students</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                  <MenuItem value="not_applied">Not applied</MenuItem>
                  {charge?.is_optional && (
                    <>
                      <MenuItem value="opted_in">Opted in</MenuItem>
                      <MenuItem value="opted_out">Opted out</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
              <Button size="small" onClick={refetch}>
                Refresh
              </Button>
            </Stack>

            {/* Roster table */}
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Class</TableCell>
                    {charge?.is_optional && <TableCell align="center">Opted in</TableCell>}
                    <TableCell align="right">Owed</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((s) => {
                    const meta =
                      PAYMENT_STATUS_META[s.paymentStatus] || PAYMENT_STATUS_META.not_applied;
                    return (
                      <TableRow key={s.studentId} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {s.studentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {s.admissionNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>{s.className || "—"}</TableCell>
                        {charge?.is_optional && (
                          <TableCell align="center">
                            {s.optedIn ? (
                              <Chip size="small" label="Yes" color="primary" variant="outlined" />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell align="right">{formatKES(s.amountOwed)}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: Number(s.amountPaid) > 0 ? "success.main" : "text.secondary",
                            fontWeight: 600,
                          }}
                        >
                          {formatKES(s.amountPaid)}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={meta.label} color={meta.color} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={charge?.is_optional ? 6 : 5}
                        align="center"
                        sx={{ py: 3 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No students match this filter.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// ChargeDialog (unchanged from original)
// ---------------------------------------------------------------------
function ChargeDialog({ open, onClose, charge, years, terms, grades, classes, onSaved, onError }) {
  const isEdit = !!charge;
  const [form, setForm] = useState({
    name: charge?.name || "",
    description: charge?.description || "",
    amount: charge?.amount || "",
    academic_year: charge?.academic_year || "",
    term: charge?.term || "",
    scope: charge?.scope || "grade",
    gradeLevels: charge?.gradeLevels || [],
    classIds: charge?.classIds || [],
    is_optional: charge?.is_optional || false,
    due_date: charge?.due_date || "",
  });
  const [busy, setBusy] = useState(false);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const availableTerms = terms.filter(
    (t) => !form.academic_year || String(t.academic_year) === String(form.academic_year),
  );

  const handleSave = async () => {
    if (!form.name.trim()) return onError("Enter a name.");
    if (!form.amount || Number(form.amount) <= 0) return onError("Enter a valid amount.");
    if (!form.academic_year) return onError("Pick a year.");
    if (!form.due_date) return onError("Pick a due date.");
    if (form.scope === "grade" && form.gradeLevels.length === 0)
      return onError("Pick at least one grade.");
    if (form.scope === "class" && form.classIds.length === 0)
      return onError("Pick at least one class.");

    if (isEdit && charge.status === "active") {
      const scopeChanged = charge.scope !== form.scope;
      const amountChanged = Number(charge.amount) !== Number(form.amount);
      const dueChanged = charge.due_date !== form.due_date;
      const nameChanged = charge.name !== form.name.trim();

      if (scopeChanged || amountChanged || dueChanged || nameChanged) {
        const ok = window.confirm(
          "This charge is already applied to students. " +
            "Changing its scope, amount, name, or due date will update existing " +
            "invoices. Students who no longer match the scope will be credited. Continue?",
        );
        if (!ok) return;
      }
    }

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        amount: Number(form.amount),
        academic_year: Number(form.academic_year),
        term: form.term || null,
        scope: form.scope,
        gradeLevels: form.scope === "grade" ? form.gradeLevels : [],
        classIds: form.scope === "class" ? form.classIds : [],
        is_optional: form.is_optional,
        due_date: form.due_date,
      };
      const response = isEdit
        ? await feesApi.updateCharge(charge.id, payload)
        : await feesApi.createCharge(payload);
      onSaved(response);
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit charge" : "New one-off charge"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            placeholder="e.g. Grade 4 trip to Nairobi Museum"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
          />
          <TextField
            label="Description (optional)"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Amount (KES)"
              type="number"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              fullWidth
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Due date"
              type="date"
              value={form.due_date}
              onChange={(e) => handleChange("due_date", e.target.value)}
              inputlabelprops={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Academic year</InputLabel>
              <Select
                value={form.academic_year}
                label="Academic year"
                onChange={(e) => {
                  handleChange("academic_year", e.target.value);
                  handleChange("term", "");
                }}
              >
                {years.map((y) => (
                  <MenuItem key={y.id} value={y.id}>
                    {y.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Term (optional)</InputLabel>
              <Select
                value={form.term}
                label="Term (optional)"
                onChange={(e) => handleChange("term", e.target.value)}
              >
                <MenuItem value="">No specific term</MenuItem>
                {availableTerms.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Divider />

          <FormControl fullWidth>
            <InputLabel>Applies to</InputLabel>
            <Select
              value={form.scope}
              label="Applies to"
              onChange={(e) => handleChange("scope", e.target.value)}
            >
              {CHARGE_SCOPES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.scope === "grade" && (
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
                  <MenuItem key={g.id} value={g.name}>
                    {g.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {form.scope === "class" && (
            <FormControl fullWidth>
              <InputLabel>Classes</InputLabel>
              <Select
                multiple
                value={form.classIds}
                label="Classes"
                onChange={(e) => handleChange("classIds", e.target.value)}
                renderValue={(selected) =>
                  selected.map((id) => classes.find((c) => c.id === id)?.name || id).join(", ")
                }
              >
                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_optional}
                onChange={(e) => handleChange("is_optional", e.target.checked)}
              />
            }
            label="Optional — parents must opt in before it's charged"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={busy}>
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create charge"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
