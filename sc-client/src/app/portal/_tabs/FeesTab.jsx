"use client";

import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CheckCircle, ExpandMore } from "@mui/icons-material";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatDate, formatKES } from "@/lib/utils";

const TERMS = [1, 2, 3];
const n = (v) => Number(v) || 0;
const owedText = (owed) =>
  owed > 0 ? formatKES(owed) : owed < 0 ? `Credit ${formatKES(-owed)}` : "Paid";

/* ─────────────────────────────────────────────────────────────────────────
   FeesTab
   Pick a term, see what is owed, see what it is made of, see payments made.
   ───────────────────────────────────────────────────────────────────────── */
export function FeesTab({ student }) {
  const {
    data: feeData,
    loading,
    refetch,
  } = useAsync(() => api.getStudentInvoice(student.id), [student.id]);
  const { data: payments, refetch: refetchPayments } = useAsync(
    () => api.getPayments({ student: student.id }),
    [student.id],
  );

  const [termChoice, setTermChoice] = useState(null);
  const [payTarget, setPayTarget] = useState(null); // null = dialog closed
  const [showAllPayments, setShowAllPayments] = useState(false);

  const feeStructure = feeData?.feeStructure;
  const allInvoices = feeData?.termInvoices || [];
  const allLevies = feeData?.allLevies || [];
  const changeHistory = feeData?.changeHistory || [];

  /* Work within one academic year */
  const year =
    feeStructure?.year ??
    feeData?.year ??
    (allInvoices.length ? Math.max(...allInvoices.map((i) => n(i.year))) : null);
  const invoices = allInvoices.filter((i) => year == null || n(i.year) === n(year));
  const levies = allLevies.filter((l) => l.year == null || year == null || n(l.year) === n(year));

  const defaultTerm =
    feeData?.currentTerm ?? (invoices.length ? Math.max(...invoices.map((i) => n(i.term))) : 1);
  const term = termChoice ?? defaultTerm;

  /* Fees owed for a term (negative = overpaid) */
  const feeOwedFor = (t) => {
    const inv = invoices.find((i) => n(i.term) === t);
    return inv ? n(inv.balance ?? n(inv.total_amount) - n(inv.paid_amount)) : 0;
  };
  const extrasOwedFor = (t) =>
    levies.filter((l) => n(l.term) === t && !l.paid).reduce((s, l) => s + n(l.amount), 0);
  const termOwed = (t) => feeOwedFor(t) + extrasOwedFor(t);

  /* ── This term ── */
  const invoice = invoices.find((i) => n(i.term) === term);
  const termLevies = levies.filter((l) => n(l.term) === term);

  const feeCharged = n(invoice?.total_amount);
  const feePaid = n(invoice?.paid_amount);
  const feeOwed = feeOwedFor(term);
  const extrasOwed = extrasOwedFor(term);

  const broughtForward = TERMS.filter((t) => t < term).reduce((s, t) => s + termOwed(t), 0);
  const due = broughtForward + feeOwed + extrasOwed;
  const dueDate = invoice?.due_date ?? feeData?.dueDate;

  const expectedFee = n(feeStructure?.terms?.[`term_${term}`]?.amount);
  const latestChange = changeHistory.find(
    (h) => n(h.term) === term && (h.year == null || year == null || n(h.year) === n(year)),
  );
  const nothingCharged = !invoice && termLevies.length === 0;

  /* ── Payments (filtered by term if the API provides one) ── */
  const paymentsList = payments || [];
  const paymentsHaveTerm = paymentsList.some((p) => p.term != null);
  const termPayments = paymentsHaveTerm
    ? paymentsList.filter((p) => n(p.term) === term)
    : paymentsList;
  const visiblePayments = showAllPayments ? termPayments : termPayments.slice(0, 5);

  if (loading && !feeData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* 1. Term picker */}
      <Box>
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={term}
          onChange={(_, v) => {
            if (v) {
              setTermChoice(v);
              setShowAllPayments(false);
            }
          }}
          aria-label="Select term"
        >
          {TERMS.map((t) => (
            <ToggleButton key={t} value={t} sx={{ textTransform: "none", fontWeight: 600 }}>
              <Badge
                variant="dot"
                color="error"
                invisible={termOwed(t) <= 0}
                sx={{ "& .MuiBadge-badge": { right: -8, top: 2 } }}
              >
                Term {t}
              </Badge>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          {year ? `Academic year ${year}. ` : ""}A red dot marks a term with a balance to pay.
        </Typography>
      </Box>

      {/* 2. Summary */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        {nothingCharged ? (
          <Typography color="text.secondary">
            Nothing has been charged for Term {term} yet.
            {expectedFee > 0 ? ` Expected school fees: ${formatKES(expectedFee)}.` : ""}
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              {due > 0 ? "Balance to pay" : due < 0 ? "Overpaid (credit)" : "Fully paid"}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: due > 0 ? "error.main" : "success.dark" }}
            >
              {formatKES(Math.abs(due))}
            </Typography>
            {due > 0 && dueDate && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Due by {formatDate(dueDate)}
              </Typography>
            )}
            {broughtForward !== 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {broughtForward > 0
                  ? `Includes ${formatKES(broughtForward)} unpaid from earlier terms.`
                  : `Includes ${formatKES(-broughtForward)} credit from earlier terms.`}
              </Typography>
            )}

            {invoice && feeOwed > 0 && (
              <Button
                variant="contained"
                size="large"
                onClick={() =>
                  setPayTarget({
                    label: `Term ${term} school fees`,
                    amount: feeOwed,
                    invoice_id: invoice.id,
                  })
                }
                sx={{
                  mt: 2.5,
                  width: { xs: "100%", sm: "auto" },
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Pay school fees: {formatKES(feeOwed)}
              </Button>
            )}

            {due < 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You have paid {formatKES(-due)} more than was charged. It will be carried forward
                and applied to {term < 3 ? `Term ${term + 1}` : "next year's fees"}.
              </Alert>
            )}
          </>
        )}
      </Paper>

      {/* 3. Charges for the term */}
      {!nothingCharged && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Charges for Term {term}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">To pay</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice && (
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        School fees
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Paid {formatKES(feePaid)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatKES(feeCharged)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, color: feeOwed > 0 ? "error.main" : "success.dark" }}
                    >
                      {owedText(feeOwed)}
                    </TableCell>
                  </TableRow>
                )}

                {termLevies.map((levy) => {
                  const overdue =
                    !levy.paid && levy.deadline && new Date() > new Date(levy.deadline);
                  const note = overdue
                    ? `Overdue since ${formatDate(levy.deadline)}`
                    : [
                        levy.isOptional ? "Optional" : null,
                        levy.deadline && !levy.paid ? `Pay by ${formatDate(levy.deadline)}` : null,
                      ]
                        .filter(Boolean)
                        .join(", ");

                  return (
                    <TableRow key={levy.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {levy.name}
                        </Typography>
                        {note && (
                          <Typography
                            variant="caption"
                            sx={{ color: overdue ? "error.main" : "text.secondary" }}
                          >
                            {note}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{formatKES(levy.amount)}</TableCell>
                      <TableCell align="right">
                        {levy.paid ? (
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "success.dark" }}
                          >
                            Paid
                          </Typography>
                        ) : (
                          <>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "error.main" }}
                            >
                              {formatKES(levy.amount)}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() =>
                                setPayTarget({
                                  label: levy.name,
                                  amount: n(levy.amount),
                                  levy_id: levy.id,
                                })
                              }
                              sx={{ minWidth: 0, px: 0.5, textTransform: "none", fontWeight: 600 }}
                            >
                              Pay
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {!invoice && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Term {term} school fees haven&apos;t been invoiced yet.
              {expectedFee > 0 ? ` Expected amount: ${formatKES(expectedFee)}.` : ""}
            </Typography>
          )}
          {latestChange && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              School fees were updated from {formatKES(latestChange.previousAmount)} to{" "}
              {formatKES(latestChange.newAmount)}
              {latestChange.reason ? ` (${latestChange.reason})` : ""}.
            </Typography>
          )}
        </Box>
      )}

      {/* 4. Payments */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          {paymentsHaveTerm ? `Payments for Term ${term}` : "Payments"}
        </Typography>
        {termPayments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No payments recorded yet.
          </Typography>
        ) : (
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visiblePayments.map((p) => {
                    const purpose = p.description ?? p.purpose ?? null;
                    const method = String(p.method || "payment").replace("_", " ");
                    const methodLabel = method.charAt(0).toUpperCase() + method.slice(1);
                    const detail = [
                      purpose ? methodLabel : null,
                      p.reference ? `Ref ${p.reference}` : null,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <TableRow key={p.id}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(p.date)}</TableCell>
                        <TableCell sx={{ wordBreak: "break-word" }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {purpose ?? methodLabel}
                          </Typography>
                          {detail && (
                            <Typography variant="caption" color="text.secondary">
                              {detail}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 600, whiteSpace: "nowrap", color: "success.dark" }}
                        >
                          {formatKES(p.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {termPayments.length > 5 && (
              <Button
                fullWidth
                size="small"
                onClick={() => setShowAllPayments((s) => !s)}
                sx={{
                  textTransform: "none",
                  borderTop: 1,
                  borderColor: "divider",
                  borderRadius: 0,
                }}
              >
                {showAllPayments ? "Show fewer" : `Show all ${termPayments.length} payments`}
              </Button>
            )}
          </Paper>
        )}
      </Box>

      <PaymentDialog
        open={!!payTarget}
        target={payTarget}
        student={student}
        onClose={() => setPayTarget(null)}
        onSuccess={() => {
          refetch();
          refetchPayments?.();
        }}
      />
    </Stack>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   M-Pesa payment dialog (unchanged)
   target = { label, amount, invoice_id?, levy_id? }
   ───────────────────────────────────────────────────────────────────────── */
const MAX_POLLS = 15;

function PaymentDialog({ open, target, student, onClose, onSuccess }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [sentAmount, setSentAmount] = useState(0);
  const [stage, setStage] = useState("form"); // form | waiting | success | failed | timeout
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef(null);
  const [error, setError] = useState("");

  const stopPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  /* Each time the dialog opens for a target: start fresh, pre-fill the amount. */
  useEffect(() => {
    if (open && target) {
      stopPolling();
      setStage("form");
      setPollCount(0);
      setAmount(String(target.amount ?? ""));
    }
    return stopPolling;
  }, [open, target]);

  const amountNum = Number(amount);
  const canSend = phone.replace(/\D/g, "").length >= 10 && amountNum > 0;
  const isExtra = target?.amount > 0 && amountNum > target.amount;

  const startPolling = (checkoutRequestId) => {
    let count = 0;
    stopPolling();
    intervalRef.current = setInterval(async () => {
      count += 1;
      setPollCount(count);
      try {
        const result = await api.checkMpesaPaymentStatus(checkoutRequestId);
        if (result.status === "completed") {
          stopPolling();
          setStage("success");
          onSuccess();
          return;
        }
        if (result.status === "failed") {
          stopPolling();
          setStage("failed");
          return;
        }
      } catch {
        /* keep polling until MAX_POLLS */
      }
      if (count >= MAX_POLLS) {
        stopPolling();
        setStage("timeout");
      }
    }, 4000);
  };

  const handleSend = async () => {
    if (!canSend) return;
    setError("");
    setSentAmount(amountNum);
    setStage("waiting");
    try {
      const result = await api.initiateMpesaStkPush({
        student_id: student.id,
        amount: amountNum,
        phone_number: phone.trim(),
        // Optional hints so the backend can apply the payment to the right item.
        ...(target?.invoice_id ? { invoice_id: target.invoice_id } : {}),
        ...(target?.levy_id ? { levy_id: target.levy_id } : {}),
      });
      if (result.checkout_request_id) startPolling(result.checkout_request_id);
      else setStage("failed");
    } catch (e) {
      setError(e.message);
      setStage("failed");
    }
  };

  const handleClose = () => {
    stopPolling();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700 }}>Pay: {target?.label}</DialogTitle>

      <DialogContent>
        {stage === "form" && (
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="M-Pesa phone number"
              placeholder="0712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              type="tel"
              slotProps={{
                htmlInput: { inputMode: "tel", autoComplete: "tel", style: { fontSize: 16 } },
              }}
              helperText="You'll get a prompt on this phone to enter your PIN."
            />
            <TextField
              label="Amount (KES)"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              fullWidth
              slotProps={{ htmlInput: { inputMode: "decimal", style: { fontSize: 16 } } }}
              helperText={
                isExtra
                  ? "The extra will be kept as credit for the next term."
                  : "You can pay part of the amount if you prefer."
              }
            />

            <Accordion
              variant="outlined"
              disableGutters
              sx={{ borderRadius: 2, "&:before": { display: "none" } }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Prefer to pay by Paybill?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemText primary="1. M-PESA, Lipa na M-PESA, Paybill" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText primary="2. Business No: 522533" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText
                      primary="3. Account No:"
                      secondary={<strong>{student?.admissionNumber}</strong>}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText primary="4. Enter the amount and your M-PESA PIN" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}

        {stage === "waiting" && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Waiting for your payment</Typography>
            <Typography variant="body2" color="text.secondary">
              Check <strong>{phone}</strong> and enter your M-Pesa PIN.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
              Checking ({pollCount}/{MAX_POLLS})
            </Typography>
          </Box>
        )}

        {stage === "success" && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircle sx={{ fontSize: 56, color: "success.main", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: "success.main" }}>
              Payment received
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {formatKES(sentAmount)} received for {target?.label}.
            </Typography>
          </Box>
        )}

        {stage === "failed" && (
          <Box sx={{ py: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error ||
                "The payment was declined or cancelled. No money was taken. Please try again."}
            </Alert>
            <Button variant="outlined" fullWidth onClick={() => setStage("form")}>
              Try again
            </Button>
          </Box>
        )}

        {stage === "timeout" && (
          <Box sx={{ py: 3 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              We couldn&apos;t confirm your payment in time. If you entered your PIN, check your
              M-Pesa SMS. Your balance will update once the payment is confirmed.
            </Alert>
            <Button variant="outlined" fullWidth onClick={() => setStage("form")}>
              Try again
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>{stage === "success" ? "Done" : "Cancel"}</Button>
        {stage === "form" && (
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!canSend}
            sx={{ boxShadow: "none" }}
          >
            Send M-Pesa prompt
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
