"use client";

import { useState } from "react";
import {
  Alert, Button, Card, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, LinearProgress, Snackbar, Stack, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs,
  TextField, Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import { useAsync } from "@/hooks/useAsync";
import { accountantApi } from "@/lib/accountantApi";
import { feesApi, formatKES } from "@/lib/feesApi";

export default function ReconciliationPage() {
  const [tab, setTab] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const notify = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const pending = useAsync(() => accountantApi.mpesaPending(), []);
  const failed = useAsync(() => accountantApi.mpesaFailed(), []);

  const list = tab === 0 ? pending.data ?? [] : failed.data ?? [];
  const loading = tab === 0 ? pending.loading : failed.loading;
  const refetch = tab === 0 ? pending.refetch : failed.refetch;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Reconciliation
        </Typography>
        <Button startIcon={<ReplayIcon />} onClick={() => refetch()}>
          Refresh
        </Button>
      </Stack>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
          <Tab label={`Pending (${pending.data?.length ?? 0})`} />
          <Tab label={`Failed (${failed.data?.length ?? 0})`} />
        </Tabs>
        <Divider />
        {loading ? (
          <LinearProgress />
        ) : list.length === 0 ? (
          <Alert severity="info" sx={{ m: 3 }}>
            {tab === 0
              ? "No pending M-Pesa payments. Everything the parent initiated has been confirmed."
              : "No failed M-Pesa attempts."}
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Checkout ID</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.paid_on}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{p.studentName}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                      {p.mpesa_phone || "—"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>
                      {p.mpesa_checkout_request_id || "—"}
                    </TableCell>
                    <TableCell align="right">{formatKES(p.amount)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={p.statusLabel}
                        color={p.status === "pending" ? "warning" : "error"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {tab === 0 && (
                        <Button
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => setConfirm(p)}
                        >
                          Confirm
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <ConfirmDialog
        payment={confirm}
        onClose={() => setConfirm(null)}
        onConfirmed={() => {
          setConfirm(null);
          notify("Payment confirmed");
          pending.refetch();
        }}
        onError={(msg) => notify(msg, "error")}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

function ConfirmDialog({ payment, onClose, onConfirmed, onError }) {
  const [receipt, setReceipt] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset when a new payment is opened
  if (payment && amount === "" && payment.amount) {
    setAmount(String(payment.amount));
  }

  const handleConfirm = async () => {
    if (!receipt.trim()) return onError("Enter the M-Pesa receipt number.");
    if (!amount || Number(amount) <= 0) return onError("Enter the amount.");
    setBusy(true);
    try {
      await accountantApi.reconcileMpesa(payment.id, receipt.trim(), Number(amount));
      onConfirmed();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!payment} onClose={() => !busy && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>Confirm M-Pesa payment</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Confirm that <strong>{payment?.studentName}</strong>'s family paid via M-Pesa.
            Enter the receipt number from their SMS.
          </Alert>
          <TextField
            label="M-Pesa receipt number"
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            placeholder="e.g. QK12AB34CD"
            fullWidth
          />
          <TextField
            label="Amount (KES)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={busy}>
          {busy ? "Confirming…" : "Confirm payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
