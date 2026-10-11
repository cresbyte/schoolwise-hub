"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Chip,
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { feesApi, PAYMENT_METHODS, formatKES } from "@/lib/feesApi";
import { RecordPaymentDialog } from "@/components/fees/RecordPaymentDialog";
import { api } from "@/lib/api";

export default function PaymentsPage() {
  return (
    <>
      <PageGuard permission="fees.view">
        <PaymentsContent />
      </PageGuard>
    </>
  );
}

export function PaymentsContent() {
  const [filters, setFilters] = useState({ method: "", from: "", to: "" });
  const [payOpen, setPayOpen] = useState(false);
  const [payKey, setPayKey] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data, loading, error, refetch } = useAsync(async () => {
    const payments = await feesApi.listPayments(filters);
    return { payments: Array.isArray(payments) ? payments : [] };
  }, [filters]);

  const payments = data?.payments ?? [];
  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const handleFilter = (field, value) => setFilters((p) => ({ ...p, [field]: value }));

  const exportCsv = () => {
    const rows = [
      ["Date", "Student", "Method", "Reference", "Status", "Amount"],
      ...payments.map((p) => [
        p.paid_on,
        p.studentName,
        p.methodLabel,
        p.mpesa_receipt_number || p.reference || "",
        p.statusLabel,
        p.amount,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Every payment recorded, whether from M-Pesa, cash, bank, or cheque."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<DownloadIcon />}
              onClick={exportCsv}
              disabled={payments.length === 0}
            >
              Export CSV
            </Button>
            <RoleGuard permission="fees.manage">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setPayKey((k) => k + 1);
                  setPayOpen(true);
                }}
              >
                Record payment
              </Button>
            </RoleGuard>
          </Stack>
        }
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} flexwrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Method</InputLabel>
            <Select
              value={filters.method}
              label="Method"
              onChange={(e) => handleFilter("method", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="From"
            type="date"
            value={filters.from}
            onChange={(e) => handleFilter("from", e.target.value)}
            inputlabelprops={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={filters.to}
            onChange={(e) => handleFilter("to", e.target.value)}
            inputlabelprops={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
        </Stack>
      </Card>

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => payments.length === 0}
        emptyMessage="No payments match the filters."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.paid_on}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{p.studentName}</TableCell>
                      <TableCell>{p.methodLabel}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                        {p.mpesa_receipt_number || p.reference || "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={p.statusLabel}
                          color={
                            p.status === "success"
                              ? "success"
                              : p.status === "pending"
                                ? "warning"
                                : "error"
                          }
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 600,
                          color: p.amount < 0 ? "error.main" : "success.main",
                        }}
                      >
                        {formatKES(p.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </DataState>

      <RecordPaymentDialog
        key={payKey}
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onSaved={() => {
          setPayOpen(false);
          notify("Payment recorded");
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
