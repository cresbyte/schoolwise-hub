"use client";

import { useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PaymentsIcon from "@mui/icons-material/Payments";
import PrintIcon from "@mui/icons-material/Print";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { feesApi, formatKES } from "@/lib/feesApi";
import { RecordPaymentDialog } from "@/components/fees/RecordPaymentDialog";

export default function InvoiceDetailPage() {
  return (
    <>
      <PageGuard permission="fees.view">
        <InvoiceDetailContent />
      </PageGuard>
    </>
  );
}

export function InvoiceDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [payOpen, setPayOpen] = useState(false);
  const [paySnackbar, setPaySnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data: invoice, loading, error, refetch } = useAsync(() => feesApi.getInvoice(id), [id]);

  const { data: payments } = useAsync(async () => {
    if (!invoice) return [];
    const list = await feesApi.listPayments({ student: invoice.student });
    return Array.isArray(list) ? list : [];
  }, [invoice?.student]);

  if (!loading && !error && !invoice) {
    return <Alert severity="error">Invoice not found.</Alert>;
  }

  return (
    <>
      <PageHeader
        title={invoice ? `Invoice ${invoice.number}` : "Invoice"}
        subtitle={invoice ? `${invoice.studentName} · ${invoice.termLabel}` : ""}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() =>
                router.push(`${pathname.startsWith("/accounts") ? "/accounts" : ""}/fees/invoices`)
              }
            >
              Back
            </Button>
            <Button color="inherit" startIcon={<PrintIcon />} onClick={() => window.print()}>
              Print
            </Button>
            <RoleGuard permission="fees.manage">
              <Button
                variant="contained"
                startIcon={<PaymentsIcon />}
                onClick={() => setPayOpen(true)}
              >
                Record payment
              </Button>
            </RoleGuard>
          </Stack>
        }
      />

      <DataState loading={loading} error={error} data={invoice} onRetry={refetch}>
        {() =>
          invoice && (
            <Stack spacing={3}>
              <Card sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  flexwrap="wrap"
                  useFlexGap
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Student
                    </Typography>
                    <Typography variant="h6">{invoice.studentName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {invoice.grade_level} {invoice.className ? `· ${invoice.className}` : ""}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Issued
                    </Typography>
                    <Typography variant="body2">{invoice.issued_on}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      Due
                    </Typography>
                    <Typography variant="body2">{invoice.due_on}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={invoice.statusLabel}
                        color={
                          invoice.status === "paid"
                            ? "success"
                            : invoice.status === "partially_paid"
                              ? "warning"
                              : "error"
                        }
                      />
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      Balance due
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: invoice.balanceDue > 0 ? "error.main" : "success.main",
                      }}
                    >
                      {formatKES(invoice.balanceDue)}
                    </Typography>
                  </Box>
                </Stack>
              </Card>

              <Card>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Charges
                  </Typography>
                </Box>
                <Divider />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Due</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>{line.description}</TableCell>
                          <TableCell sx={{ color: "text.secondary" }}>
                            {line.due_date || "—"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            {formatKES(line.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>
                          Total
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatKES(invoice.total)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} align="right">
                          Paid
                        </TableCell>
                        <TableCell align="right" sx={{ color: "success.main" }}>
                          {formatKES(invoice.paid_amount)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} align="right" sx={{ fontWeight: 600 }}>
                          Balance
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatKES(invoice.balanceDue)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              <Card>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Payments
                  </Typography>
                </Box>
                <Divider />
                {!payments || payments.length === 0 ? (
                  <Box sx={{ p: 3 }}>
                    <Alert severity="info">No payments recorded yet.</Alert>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell>Reference</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.paid_on}</TableCell>
                            <TableCell>{p.methodLabel}</TableCell>
                            <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                              {p.mpesa_receipt_number || p.reference || "—"}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 500, color: "success.main" }}
                            >
                              {formatKES(p.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </Stack>
          )
        }
      </DataState>

      {invoice && (
        <RecordPaymentDialog
          open={payOpen}
          onClose={() => setPayOpen(false)}
          studentId={invoice.student}
          studentName={invoice.studentName}
          suggestedAmount={invoice.balanceDue}
          onSaved={() => {
            setPayOpen(false);
            setPaySnackbar({ open: true, message: "Payment recorded", severity: "success" });
            refetch();
          }}
          onError={(msg) => setPaySnackbar({ open: true, message: msg, severity: "error" })}
        />
      )}

      {paySnackbar.open && (
        <Alert
          severity={paySnackbar.severity}
          variant="filled"
          sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1500 }}
          onClose={() => setPaySnackbar((s) => ({ ...s, open: false }))}
        >
          {paySnackbar.message}
        </Alert>
      )}
    </>
  );
}
