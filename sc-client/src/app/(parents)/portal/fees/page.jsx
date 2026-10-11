"use client";

import DescriptionIcon from "@mui/icons-material/Description";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PaymentsIcon from "@mui/icons-material/Payments";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  LinearProgress,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ChildSelector } from "@/components/portal/ChildSelector";
import { FeeStatementDialog } from "@/components/portal/FeeStatementDialog";
import { InlinePayPanel } from "@/components/portal/InlinePayPanel";
import { useAsync } from "@/hooks/useAsync";
import { portalApi } from "@/lib/portalApi";
import { formatDate, formatKES } from "@/lib/utils";

export default function PortalFeesPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <PortalFeesContent />
    </Suspense>
  );
}

function PortalFeesContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const searchParams = useSearchParams();
  const initialChild = searchParams.get("child") || "";
  const autoOpenPay = searchParams.get("pay") === "1";
  const autoOpenStatement = searchParams.get("statement") === "1";

  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState(initialChild);
  const [showPayPanel, setShowPayPanel] = useState(autoOpenPay);
  const [payAmount, setPayAmount] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Invoices, 1: Ledger
  const [showStatementDialog, setShowStatementDialog] = useState(autoOpenStatement);

  // Per-charge busy state — only used for the decline (opt-out) action now.
  // Opt-in is handled server-side automatically when M-Pesa payment succeeds.
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    portalApi.getChildren().then((kids) => {
      const list = Array.isArray(kids) ? kids : [];
      setChildren(list);
      if (!childId && list.length > 0) setChildId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data: summary,
    loading,
    refetch,
  } = useAsync(
    () => (childId ? portalApi.getStudentFeeSummary(childId) : null),
    [childId],
  );

  const { data: statement, loading: statementLoading } = useAsync(
    () => (childId ? portalApi.getStudentStatement(childId) : null),
    [childId],
  );

  // Pending optional charges for the selected child (not yet paid / declined)
  const {
    data: pendingData,
    loading: pendingLoading,
    refetch: refetchPending,
  } = useAsync(
    () => (childId ? portalApi.getPendingCharges(childId) : null),
    [childId],
  );

  // Invoices for the selected child
  const {
    data: invoicesData,
    loading: invoicesLoading,
    refetch: refetchInvoices,
  } = useAsync(
    () => (childId ? portalApi.getStudentInvoices(childId) : null),
    [childId],
  );

  const child = children.find((c) => c.id === childId);
  const balance = summary ? Number(summary.balance || 0) : 0;
  const invoiced = summary ? Number(summary.totalInvoiced || 0) : 0;
  const paid = summary ? Number(summary.totalPaid || 0) : 0;
  const paymentRate =
    invoiced > 0 ? Math.min(100, Math.round((paid / invoiced) * 100)) : 100;

  const transactions = statement?.transactions || statement?.entries || [];
  const pendingCharges = pendingData?.pendingCharges ?? [];

  // Invoices fallback if invoices API is empty but statement has invoice entries
  const rawInvoices = Array.isArray(invoicesData) ? invoicesData : [];
  const invoices =
    rawInvoices.length > 0
      ? rawInvoices
      : (statement?.entries || [])
          .filter((e) => e.type === "invoice")
          .map((e, idx) => ({
            id: e.details?.invoiceId || `inv-${idx}`,
            number: e.reference || `INV-${idx + 1}`,
            termLabel: e.description || "Term Invoice",
            total: Number(e.debit || 0),
            paid_amount: 0,
            balanceDue: Number(e.debit || 0),
            issued_on: e.date,
            due_on: e.details?.dueOn || null,
            status: e.details?.status || "issued",
            statusLabel: e.details?.status === "paid" ? "Paid" : "Issued",
            lines: e.details?.lines || [],
          }));

  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const handlePaymentSuccess = () => {
    refetch();
    refetchPending();
    refetchInvoices();
    setTimeout(() => {
      setShowPayPanel(false);
      setPayAmount(null);
    }, 2000);
  };

  // ------------------------------------------------------------------
  // Decline handler — parent skips an optional charge
  // ------------------------------------------------------------------
  const handleOptOut = async (chargeId) => {
    try {
      await portalApi.optOutCharge(chargeId, childId);
      notify("Charge declined.");
      refetchPending();
      refetch();
    } catch (e) {
      notify(e.message || "Failed to decline charge.", "error");
    }
  };

  const handlePaySpecificInvoice = (amount) => {
    setPayAmount(amount);
    setShowPayPanel(true);
  };

  return (
    <Stack spacing={2.5}>
      {/* Child Switcher */}
      <ChildSelector
        children={children}
        selectedId={childId}
        onSelect={(id) => {
          setChildId(id);
          setShowPayPanel(false);
          setPayAmount(null);
        }}
      />

      {/* ------------------------------------------------------------ */}
      {/* Optional charges — shown when there are charges to pay.      */}
      {/* Sits above the balance card so parents see it first.         */}
      {/* ------------------------------------------------------------ */}
      {!pendingLoading && pendingCharges.length > 0 && (
        <PayableChargesCard
          charges={pendingCharges}
          childName={child?.name || "your child"}
          childId={childId}
          onDecline={handleOptOut}
          onPaid={() => {
            refetchPending();
            refetch();
            refetchInvoices();
          }}
        />
      )}

      {loading ? (
        <LinearProgress sx={{ borderRadius: 1 }} />
      ) : !summary ? (
        <Card sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No fee information available for this student.
          </Typography>
        </Card>
      ) : (
        <>
          {/* Main Fee Balance Card */}
          <Card
            elevation={1}
            sx={{
              borderRadius: 3,
              p: { xs: 2.5, sm: 3 },
              border: 1,
              borderColor: "divider",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "text.secondary",
                    textTransform: "uppercase",
                  }}
                >
                  Current Outstanding Balance
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: balance > 0 ? "error.main" : "success.main",
                    mt: 0.5,
                  }}
                >
                  {formatKES(balance)}
                </Typography>
              </Box>

              {summary.daysOverdue > 0 ? (
                <Chip
                  size="small"
                  color="error"
                  label={`${summary.daysOverdue} days overdue`}
                  sx={{ fontWeight: 700 }}
                />
              ) : balance === 0 ? (
                <Chip
                  size="small"
                  color="success"
                  label="Fully Cleared"
                  sx={{ fontWeight: 700 }}
                />
              ) : null}
            </Stack>

            {/* Fee Progress Bar */}
            <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 2, bgcolor: "grey.50" }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 0.75 }}
              >
                <Typography variant="caption" color="text.secondary">
                  Paid: <strong>{formatKES(paid)}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total: <strong>{formatKES(invoiced)}</strong>
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={paymentRate}
                sx={{ height: 8, borderRadius: 4 }}
                color={
                  paymentRate >= 100
                    ? "success"
                    : paymentRate >= 50
                      ? "primary"
                      : "warning"
                }
              />
            </Box>

            {/* Pay Now Button (Expands Inline Pay Panel) */}
            {balance > 0 && !showPayPanel && (
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PaymentsIcon />}
                onClick={() => {
                  setPayAmount(balance);
                  setShowPayPanel(true);
                }}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  bgcolor: "#00a859",
                  "&:hover": { bgcolor: "#008f4c" },
                  fontSize: "1rem",
                }}
              >
                Pay {formatKES(balance)} with M-Pesa
              </Button>
            )}
          </Card>

          {/* Inline M-Pesa Payment Panel (No Dialog, Expands smoothly) */}
          <Collapse in={showPayPanel} timeout="auto" unmountOnExit>
            <InlinePayPanel
              studentId={childId}
              studentName={child?.name || "Student"}
              suggestedAmount={payAmount || balance}
              onSuccess={handlePaymentSuccess}
              onCancel={() => {
                setShowPayPanel(false);
                setPayAmount(null);
              }}
            />
          </Collapse>

          {/* Section Header with View Official Statement action */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1.5}
            sx={{ pt: 1 }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Invoices & Statement
              </Typography>
              <Typography variant="caption" color="text.secondary">
                View term bill breakdown or official certified fee records
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={() => setShowStatementDialog(true)}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                py: 1,
                px: 2,
                fontWeight: 700,
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": { bgcolor: "primary.50" },
              }}
            >
              View Official Statement
            </Button>
          </Stack>

          {/* Invoices & Ledger Tabs Container */}
          <Card elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "grey.50" }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant={isMobile ? "fullWidth" : "standard"}
                textColor="primary"
                indicatorColor="primary"
                sx={{ px: { sm: 2 } }}
              >
                <Tab
                  icon={<ReceiptLongIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Term Invoices (${invoices.length})`}
                  sx={{ fontWeight: 700, textTransform: "none", minHeight: 48 }}
                />
                <Tab
                  icon={<HistoryIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Fee Ledger (${transactions.length})`}
                  sx={{ fontWeight: 700, textTransform: "none", minHeight: 48 }}
                />
              </Tabs>
            </Box>

            {/* TAB 0: Term Invoices with Itemized Breakdown */}
            {activeTab === 0 && (
              <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                {invoicesLoading && invoices.length === 0 ? (
                  <LinearProgress sx={{ borderRadius: 1, my: 3 }} />
                ) : invoices.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <ReceiptLongIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No invoices issued yet for this student.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {invoices.map((inv) => (
                      <InvoiceCard
                        key={inv.id}
                        invoice={inv}
                        isMobile={isMobile}
                        onPayInvoice={(amt) => handlePaySpecificInvoice(amt)}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* TAB 1: Fee History Ledger */}
            {activeTab === 1 && (
              <Box>
                {transactions.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No payment transactions recorded yet.
                    </Typography>
                  </Box>
                ) : isMobile ? (
                  /* Mobile Card-Based Feed (No Horizontal Overflow) */
                  <Stack spacing={0} divider={<Divider />}>
                    {transactions.map((t, idx) => {
                      const isPayment = Number(t.paid || t.credit || 0) > 0;
                      const amt = isPayment
                        ? Number(t.paid || t.credit)
                        : Number(t.invoiced || t.debit || t.amount || 0);

                      return (
                        <Box key={t.id || idx} sx={{ p: 2 }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                          >
                            <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {t.description || t.title || (isPayment ? "Fee Payment" : "Term Invoice")}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(t.date || t.created_at)}
                                {t.receiptNumber || t.reference ? ` • #${t.receiptNumber || t.reference}` : ""}
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: "right" }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 800,
                                  color: isPayment ? "success.main" : "text.primary",
                                }}
                              >
                                {isPayment ? `-${formatKES(amt)}` : `+${formatKES(amt)}`}
                              </Typography>
                              <Chip
                                size="small"
                                variant="outlined"
                                label={isPayment ? "Payment" : "Invoice"}
                                color={isPayment ? "success" : "default"}
                                sx={{ height: 20, fontSize: "0.68rem" }}
                              />
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  /* Desktop Table */
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "grey.50" }}>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Invoiced</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Paid</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.map((t, idx) => (
                          <TableRow key={t.id || idx} hover>
                            <TableCell>{formatDate(t.date || t.created_at)}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>
                              {t.description || t.title || "Transaction"}
                              {t.receiptNumber || t.reference ? ` (Rec: ${t.receiptNumber || t.reference})` : ""}
                            </TableCell>
                            <TableCell align="right">
                              {Number(t.invoiced || t.debit || 0) > 0 ? formatKES(t.invoiced || t.debit) : "—"}
                            </TableCell>
                            <TableCell align="right" sx={{ color: "success.main", fontWeight: 600 }}>
                              {Number(t.paid || t.credit || 0) > 0 ? formatKES(t.paid || t.credit) : "—"}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {t.balance !== undefined ? formatKES(t.balance) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Card>
        </>
      )}

      {/* Official Fee Statement Modal */}
      <FeeStatementDialog
        open={showStatementDialog}
        onClose={() => setShowStatementDialog(false)}
        statement={statement}
        loading={statementLoading}
        childName={child?.name}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

// ---------------------------------------------------------------------
// InvoiceCard — itemized term invoice for parents
// ---------------------------------------------------------------------
function InvoiceCard({ invoice, isMobile, onPayInvoice }) {
  const [expanded, setExpanded] = useState(false);

  const statusMeta = {
    paid: { label: "Fully Paid", color: "success" },
    partially_paid: { label: "Partially Paid", color: "warning" },
    issued: { label: "Unpaid", color: "error" },
    draft: { label: "Draft", color: "default" },
    void: { label: "Void", color: "default" },
  };

  const meta = statusMeta[invoice.status] || {
    label: invoice.statusLabel || invoice.status || "Invoice",
    color: "default",
  };

  const total = Number(invoice.total || 0);
  const paid = Number(invoice.paid_amount || 0);
  const balanceDue = Number(
    invoice.balanceDue !== undefined ? invoice.balanceDue : total - paid,
  );
  const lines = invoice.lines || [];

  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2.5,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Stack spacing={1.5}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {invoice.termLabel || `Invoice #${invoice.number}`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
              #{invoice.number}
              {invoice.academicYearName ? ` · ${invoice.academicYearName}` : ""}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={meta.label}
            color={meta.color}
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {/* Financials Row */}
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "grey.50" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Invoiced
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {formatKES(total)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Amount Paid
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                {formatKES(paid)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Balance Due
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  color: balanceDue > 0 ? "error.main" : "success.main",
                }}
              >
                {formatKES(balanceDue)}
              </Typography>
            </Box>
            {invoice.due_on && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatDate(invoice.due_on)}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Line Items Collapse/Toggle */}
        {lines.length > 0 && (
          <Box>
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: expanded ? "rotate(180deg)" : "none",
                    transition: "0.2s",
                  }}
                />
              }
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "text.secondary",
                p: 0,
                "&:hover": { bgcolor: "transparent", color: "text.primary" },
              }}
            >
              {expanded ? "Hide fee breakdown" : `View fee breakdown (${lines.length} items)`}
            </Button>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <TableContainer sx={{ mt: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Fee Item</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Due</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((l, idx) => (
                      <TableRow key={l.id || idx}>
                        <TableCell sx={{ fontSize: 12.5 }}>{l.description}</TableCell>
                        <TableCell sx={{ fontSize: 12.5, color: "text.secondary" }}>
                          {l.due_date ? formatDate(l.due_date) : "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 12.5, fontWeight: 600 }}>
                          {formatKES(l.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Box>
        )}

        {/* Quick Pay Button for this Invoice */}
        {balanceDue > 0 && onPayInvoice && (
          <Box sx={{ pt: 0.5 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PaymentsIcon />}
              onClick={() => onPayInvoice(balanceDue)}
              sx={{
                fontWeight: 700,
                textTransform: "none",
                borderColor: "#00a859",
                color: "#008f4c",
                "&:hover": { borderColor: "#008f4c", bgcolor: "rgba(0,168,89,0.04)" },
              }}
            >
              Pay invoice balance with M-Pesa ({formatKES(balanceDue)})
            </Button>
          </Box>
        )}
      </Stack>
    </Card>
  );
}

// ---------------------------------------------------------------------
// PayableChargesCard — shown when there are optional charges to pay
// ---------------------------------------------------------------------
function PayableChargesCard({ charges, childName, childId, onDecline, onPaid }) {
  // Which charge is currently showing its inline pay panel (by id)
  const [activePayId, setActivePayId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);

  const handleDecline = async (chargeId) => {
    const confirmed = window.confirm(
      "Skip this charge? You can ask the school office to add it later if you change your mind.",
    );
    if (!confirmed) return;
    setDecliningId(chargeId);
    try {
      await onDecline(chargeId);
    } finally {
      setDecliningId(null);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        p: { xs: 2, sm: 2.5 },
        border: 1.5,
        borderColor: "info.main",
        bgcolor: "info.50",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <InfoOutlinedIcon sx={{ color: "info.dark" }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Optional charges available
        </Typography>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2, lineHeight: 1.5 }}
      >
        The following optional charges are available for{" "}
        <strong>{childName}</strong>. Pay now to confirm your spot, or skip to
        decline.
      </Typography>

      <Stack spacing={2} divider={<Divider flexItem />}>
        {charges.map((c) => {
          const isPayingThis = activePayId === c.id;
          const isBusy = decliningId === c.id;

          return (
            <Box key={c.id}>
              {/* Charge info row */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={1.5}
                sx={{ mb: isPayingThis ? 2 : 0 }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {c.name}
                  </Typography>
                  {c.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 0.25 }}
                    >
                      {c.description}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    Due {formatDate(c.dueDate)}
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "row", sm: "column" }}
                  alignItems={{ xs: "center", sm: "flex-end" }}
                  spacing={1}
                  sx={{ flexShrink: 0 }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, lineHeight: 1, mb: { xs: 0, sm: 0.5 } }}
                  >
                    {formatKES(c.amount)}
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    {!isPayingThis ? (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={isBusy || activePayId !== null}
                        onClick={() => setActivePayId(c.id)}
                        startIcon={<PaymentsIcon />}
                        sx={{
                          bgcolor: "#00a859",
                          "&:hover": { bgcolor: "#008f4c" },
                          textTransform: "none",
                          fontWeight: 700,
                          minWidth: 110,
                        }}
                      >
                        Pay now
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => setActivePayId(null)}
                        sx={{ textTransform: "none", minWidth: 80 }}
                      >
                        Cancel
                      </Button>
                    )}

                    {!isPayingThis && (
                      <Button
                        size="small"
                        variant="text"
                        color="inherit"
                        disabled={isBusy || activePayId !== null}
                        onClick={() => handleDecline(c.id)}
                        sx={{
                          textTransform: "none",
                          color: "text.secondary",
                          minWidth: 50,
                          fontSize: "0.75rem",
                        }}
                      >
                        {isBusy ? "..." : "Skip"}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Stack>

              {/* Inline M-Pesa pay panel for this specific charge */}
              <Collapse in={isPayingThis} timeout="auto" unmountOnExit>
                <InlinePayPanel
                  studentId={childId}
                  studentName={childName}
                  suggestedAmount={Number(c.amount)}
                  chargeId={c.id}
                  onSuccess={() => {
                    setActivePayId(null);
                    onPaid();
                  }}
                  onCancel={() => setActivePayId(null)}
                />
              </Collapse>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}

