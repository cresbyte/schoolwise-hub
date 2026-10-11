"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
import DownloadIcon from "@mui/icons-material/Download";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { feesApi, formatKES } from "@/lib/feesApi";
import { schoolApi } from "@/lib/schoolApi";
import { academicsApi } from "@/lib/academicsApi";

const STATUS_META = {
  draft: { label: "Draft", color: "default" },
  issued: { label: "Unpaid", color: "error" },
  partially_paid: { label: "Partial", color: "warning" },
  paid: { label: "Paid", color: "success" },
  void: { label: "Void", color: "default" },
};

export default function InvoicesPage() {
  return (
    <>
      <PageGuard permission="fees.view">
        <InvoicesContent />
      </PageGuard>
    </>
  );
}

export function InvoicesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState({
    year: "",
    term: "",
    class_room: "",
    status: "",
  });
  const [generateOpen, setGenerateOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data, loading, error, refetch } = useAsync(async () => {
    const [invoices, years, terms, classes] = await Promise.all([
      feesApi.listInvoices(filters),
      schoolApi.getAcademicYears(),
      schoolApi.getTerms(),
      academicsApi.getClasses({ academic_year: null }),
    ]);
    return {
      invoices: Array.isArray(invoices) ? invoices : [],
      years: Array.isArray(years) ? years : [],
      terms: Array.isArray(terms) ? terms : [],
      classes: Array.isArray(classes) ? classes : [],
    };
  }, [filters]);

  const invoices = data?.invoices ?? [];
  const years = data?.years ?? [];
  const terms = data?.terms ?? [];
  const classes = data?.classes ?? [];

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const handleFilter = (field, value) => setFilters((p) => ({ ...p, [field]: value }));

  const availableTerms = terms.filter(
    (t) => !filters.year || String(t.academic_year) === String(filters.year),
  );

  const exportCsv = () => {
    const rows = [
      ["Invoice #", "Student", "Grade", "Class", "Term", "Total", "Paid", "Balance", "Status"],
      ...invoices.map((i) => [
        i.number,
        i.studentName,
        i.grade_level,
        i.className || "",
        i.termLabel,
        i.total,
        i.paid_amount,
        i.balanceDue,
        i.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Every student's bill for a term. Generate in bulk or view individually."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<DownloadIcon />}
              onClick={exportCsv}
              disabled={invoices.length === 0}
            >
              Export CSV
            </Button>
            <RoleGuard permission="fees.manage">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setGenerateOpen(true)}
              >
                Generate invoices
              </Button>
            </RoleGuard>
          </Stack>
        }
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} flexwrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={filters.year}
              label="Year"
              onChange={(e) => handleFilter("year", e.target.value)}
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
            <InputLabel>Term</InputLabel>
            <Select
              value={filters.term}
              label="Term"
              onChange={(e) => handleFilter("term", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {availableTerms.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={filters.class_room}
              label="Class"
              onChange={(e) => handleFilter("class_room", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilter("status", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="issued">Unpaid</MenuItem>
              <MenuItem value="partially_paid">Partial</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="void">Void</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => invoices.length === 0}
        emptyMessage="No invoices match the filters."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => {
                    const meta = STATUS_META[inv.status] || STATUS_META.issued;
                    return (
                      <TableRow
                        key={inv.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          router.push(
                            `${pathname.startsWith("/accounts") ? "/accounts" : ""}/fees/invoices/${inv.id}`,
                          )
                        }
                      >
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                          {inv.number}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{inv.studentName}</TableCell>
                        <TableCell>{inv.grade_level}</TableCell>
                        <TableCell>{inv.termLabel}</TableCell>
                        <TableCell align="right">{formatKES(inv.total)}</TableCell>
                        <TableCell align="right">{formatKES(inv.paid_amount)}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 600,
                            color: inv.balanceDue > 0 ? "error.main" : "success.main",
                          }}
                        >
                          {formatKES(inv.balanceDue)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={meta.label}
                            color={meta.color}
                            variant="outlined"
                          />
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

      <GenerateDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        years={years}
        terms={terms}
        onGenerated={(result) => {
          setGenerateOpen(false);
          notify(`Created ${result.created} invoices (skipped ${result.skipped}).`);
          refetch();
        }}
        onError={(msg) => notify(msg, "error")}
      />

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

function GenerateDialog({ open, onClose, years, terms, onGenerated, onError }) {
  const [yearId, setYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [busy, setBusy] = useState(false);

  const availableTerms = terms.filter((t) => !yearId || String(t.academic_year) === String(yearId));

  const handleGenerate = async () => {
    if (!yearId || !termId) return onError("Pick a year and term.");
    setBusy(true);
    try {
      const result = await feesApi.generateInvoices(Number(yearId), Number(termId));
      onGenerated(result);
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Generate invoices</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
          Creates one invoice per actively-enrolled student for the selected term, filled with the
          fee structure for their grade. Students who already have an invoice for that term are
          skipped.
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Academic year</InputLabel>
            <Select
              value={yearId}
              label="Academic year"
              onChange={(e) => {
                setYearId(e.target.value);
                setTermId("");
              }}
            >
              {years.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth disabled={!yearId}>
            <InputLabel>Term</InputLabel>
            <Select value={termId} label="Term" onChange={(e) => setTermId(e.target.value)}>
              {availableTerms.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleGenerate} disabled={busy || !yearId || !termId}>
          {busy ? "Generating…" : "Generate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
