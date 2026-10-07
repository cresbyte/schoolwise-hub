"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GenerateIcon from "@mui/icons-material/AutoFixHigh";
import PaymentIcon from "@mui/icons-material/Payment";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";

const CURRENT_YEAR = new Date().getFullYear();

const STATUS_COLORS = {
  unpaid: "default",
  partial: "warning",
  paid: "success",
  overdue: "error",
};

export default function InvoicesPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [term, setTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [generateDialog, setGenerateDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(null);
  const { showNotification } = useNotification();

  const params = { year };
  if (term) params.term = term;
  if (statusFilter) params.status = statusFilter;

  const {
    data: invoices,
    loading,
    error,
    refetch,
  } = useAsync(() => api.getInvoices(params), [year, term, statusFilter]);

  const invoiceList = Array.isArray(invoices) ? invoices : invoices?.results || [];

  // Stats
  const totalAmount = invoiceList.reduce((s, i) => s + Number(i.total_amount), 0);
  const totalPaid = invoiceList.reduce((s, i) => s + Number(i.paid_amount), 0);
  const totalBalance = totalAmount - totalPaid;
  const overdueCount = invoiceList.filter((i) => i.status === "overdue").length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Invoices"
        subtitle="Manage student invoices and payments"
        actions={
          <Button
            variant="contained"
            startIcon={<GenerateIcon />}
            onClick={() => setGenerateDialog(true)}
          >
            Generate Term Invoices
          </Button>
        }
      />

      {/* Stats Overview */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Card sx={{ p: 2, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Total Billed
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            KES {totalAmount.toLocaleString()}
          </Typography>
        </Card>
        <Card sx={{ p: 2, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Total Collected
          </Typography>
          <Typography variant="h5" fontWeight={700} color="success.main">
            KES {totalPaid.toLocaleString()}
          </Typography>
        </Card>
        <Card sx={{ p: 2, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Outstanding
          </Typography>
          <Typography variant="h5" fontWeight={700} color="error.main">
            KES {totalBalance.toLocaleString()}
          </Typography>
        </Card>
        <Card sx={{ p: 2, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Overdue
          </Typography>
          <Typography variant="h5" fontWeight={700} color="error.main">
            {overdueCount}
          </Typography>
        </Card>
      </Stack>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select
            size="small"
            label="Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ width: { xs: "100%", sm: 100 } }}
          >
            <MenuItem value={CURRENT_YEAR - 1}>{CURRENT_YEAR - 1}</MenuItem>
            <MenuItem value={CURRENT_YEAR}>{CURRENT_YEAR}</MenuItem>
            <MenuItem value={CURRENT_YEAR + 1}>{CURRENT_YEAR + 1}</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            sx={{ width: { xs: "100%", sm: 100 } }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="1">Term 1</MenuItem>
            <MenuItem value="2">Term 2</MenuItem>
            <MenuItem value="3">Term 3</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ width: { xs: "100%", sm: 140 } }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="unpaid">Unpaid</MenuItem>
            <MenuItem value="partial">Partial</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
          </TextField>
        </Stack>
      </Card>

      {/* Invoices Table */}
      <Card>
        <DataState
          loading={loading}
          error={error}
          data={invoiceList}
          onRetry={refetch}
          isEmpty={(d) => d.length === 0}
          emptyMessage="No invoices found"
        >
          {() => (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceList.map((inv) => {
                    const balance = Number(inv.total_amount) - Number(inv.paid_amount);
                    const pct =
                      inv.total_amount > 0
                        ? (Number(inv.paid_amount) / Number(inv.total_amount)) * 100
                        : 0;
                    return (
                      <TableRow key={inv.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {inv.student_name || "Unknown Student"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {inv.student_admission || "N/A"} • {inv.student_class || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          Term {inv.term}, {inv.year}
                        </TableCell>
                        <TableCell align="right">
                          KES {Number(inv.total_amount).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          KES {Number(inv.paid_amount).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={balance > 0 ? 700 : 400}
                            color={balance > 0 ? "error.main" : "text.primary"}
                          >
                            KES {balance.toLocaleString()}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            color={pct === 100 ? "success" : "primary"}
                            sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                          />
                        </TableCell>
                        <TableCell>{inv.due_date || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            label={inv.status}
                            size="small"
                            color={STATUS_COLORS[inv.status] || "default"}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {inv.status !== "paid" && (
                            <Tooltip title="Record Payment">
                              <IconButton
                                size="small"
                                onClick={() => setPaymentDialog(inv)}
                                color="primary"
                              >
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      </Card>

      {/* Generate Dialog */}
      {generateDialog && (
        <GenerateInvoicesDialog
          onClose={() => setGenerateDialog(false)}
          onGenerated={(msg) => {
            setGenerateDialog(false);
            showNotification(msg, "success");
            refetch();
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}

      {/* Payment Dialog */}
      {paymentDialog && (
        <RecordPaymentDialog
          invoice={paymentDialog}
          onClose={() => setPaymentDialog(null)}
          onRecorded={() => {
            setPaymentDialog(null);
            showNotification("Payment recorded successfully", "success");
            refetch();
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}
    </DashboardLayout>
  );
}

function GenerateInvoicesDialog({ onClose, onGenerated, onError }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [term, setTerm] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await api.generateTermInvoices(year, term, dueDate || null);
      onGenerated(result.message || `Generated ${result.created} invoices`);
    } catch (e) {
      onError(e.message || "Failed to generate invoices");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Generate Term Invoices</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          This will create invoices for all active students based on the active fee structure.
          Students with existing invoices for this term will be skipped.
        </Alert>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              sx={{ flex: 1 }}
            >
              <MenuItem value={new Date().getFullYear() - 1}>
                {new Date().getFullYear() - 1}
              </MenuItem>
              <MenuItem value={new Date().getFullYear()}>{new Date().getFullYear()}</MenuItem>
              <MenuItem value={new Date().getFullYear() + 1}>
                {new Date().getFullYear() + 1}
              </MenuItem>
            </TextField>
            <TextField
              select
              label="Term"
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
              sx={{ flex: 1 }}
            >
              <MenuItem value={1}>Term 1</MenuItem>
              <MenuItem value={2}>Term 2</MenuItem>
              <MenuItem value={3}>Term 3</MenuItem>
            </TextField>
          </Stack>
          <TextField
            label="Due Date (optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating..." : "Generate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RecordPaymentDialog({ invoice, onClose, onRecorded, onError }) {
  const balance = Number(invoice.total_amount) - Number(invoice.paid_amount);
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [recording, setRecording] = useState(false);

  const handleRecord = async () => {
    if (!amount || Number(amount) <= 0) return onError("Amount must be greater than 0");
    if (Number(amount) > balance) return onError("Amount exceeds outstanding balance");

    setRecording(true);
    try {
      await api.recordPayment({
        student: invoice.student,
        amount: Number(amount),
        method,
        reference: reference || null,
      });
      onRecorded();
    } catch (e) {
      onError(e.message || "Failed to record payment");
    } finally {
      setRecording(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Student: <strong>{invoice.student_name || invoice.student}</strong> • Balance:{" "}
          <strong>KES {balance.toLocaleString()}</strong>
        </Alert>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Amount (KES)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ max: balance }}
          />
          <TextField
            select
            label="Payment Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            fullWidth
          >
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="bank_deposit">Bank Deposit</MenuItem>
            <MenuItem value="cheque">Cheque</MenuItem>
            <MenuItem value="mpesa">M-Pesa</MenuItem>
          </TextField>
          <TextField
            label="Reference (optional)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            fullWidth
            placeholder="Receipt no, transaction code, etc."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleRecord} disabled={recording}>
          {recording ? "Recording..." : "Record Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
