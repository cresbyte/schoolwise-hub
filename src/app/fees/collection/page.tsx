"use client";

/**
 * Fee collection: record a payment and print an official receipt.
 * @module fees/collection/page
 */
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import PrintIcon from "@mui/icons-material/Print";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { StudentSelect } from "@/components/StudentSelect";
import { Letterhead } from "@/components/Letterhead";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { formatKES, formatDate, numberToWords } from "@/lib/utils";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { Student, FeePayment } from "@/lib/types";

export default function FeesCollectionPage() {
  return (
    <DashboardLayout>
      <FeesCollectionContent />
    </DashboardLayout>
  );
}

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paymentMethod: z.enum(["mpesa", "cash", "bank_cheque", "bank_transfer"]),
  paymentDate: z.string().min(1, "Date is required"),
  mpesaCode: z.string().optional(),
  bankReference: z.string().optional(),
  chequeNumber: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

/** Fee collection content. */
function FeesCollectionContent() {
  const { showNotification } = useNotification();
  const [student, setStudent] = useState<Student | null>(null);
  const [receipt, setReceipt] = useState<FeePayment | null>(null);
  const payments = useAsync(() => api.getPayments(), []);

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, paymentMethod: "mpesa", paymentDate: new Date().toISOString().slice(0, 10), mpesaCode: "", bankReference: "", chequeNumber: "", notes: "" },
  });
  const method = watch("paymentMethod");

  const onSubmit = handleSubmit(async (values) => {
    if (!student) {
      showNotification("Please select a student first", "warning");
      return;
    }
    const pay = await api.recordPayment({ ...values, studentId: student.id });
    setReceipt(pay);
    showNotification(`Payment of ${formatKES(values.amount)} recorded`, "success");
    reset({ amount: 0, paymentMethod: "mpesa", paymentDate: new Date().toISOString().slice(0, 10), mpesaCode: "", bankReference: "", chequeNumber: "", notes: "" });
    payments.refetch();
  });

  return (
    <>
      <PageHeader title="Fee Collection" subtitle="Record a payment and issue a receipt" />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1.2fr" } }}>
        <Card>
          <CardContent component="form" onSubmit={onSubmit}>
            <Typography variant="h6" sx={{ mb: 2 }}>New Payment</Typography>
            <Box sx={{ mb: 2 }}>
              <StudentSelect value={student} onChange={setStudent} />
            </Box>
            {student && (
              <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}>
                <Typography variant="body2">{student.className} · Current balance:{" "}
                  <strong style={{ color: student.feeBalance > 0 ? "#C62828" : "#2E7D32" }}>{formatKES(student.feeBalance)}</strong>
                </Typography>
              </Box>
            )}
            <Box sx={{ display: "grid", gap: 2 }}>
              <Controller name="amount" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="Amount (KES)" size="small" error={!!errors.amount} helperText={errors.amount?.message} />
              )} />
              <Controller name="paymentMethod" control={control} render={({ field }) => (
                <TextField {...field} select label="Payment Method" size="small">
                  {PAYMENT_METHODS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </TextField>
              )} />
              {method === "mpesa" && (
                <Controller name="mpesaCode" control={control} render={({ field }) => <TextField {...field} label="M-Pesa Code" size="small" placeholder="e.g. SGH4XYZ12K" />} />
              )}
              {method === "bank_transfer" && (
                <Controller name="bankReference" control={control} render={({ field }) => <TextField {...field} label="Bank Reference" size="small" />} />
              )}
              {method === "bank_cheque" && (
                <Controller name="chequeNumber" control={control} render={({ field }) => <TextField {...field} label="Cheque Number" size="small" />} />
              )}
              <Controller name="paymentDate" control={control} render={({ field }) => (
                <TextField {...field} type="date" label="Payment Date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.paymentDate} helperText={errors.paymentDate?.message} />
              )} />
              <Controller name="notes" control={control} render={({ field }) => <TextField {...field} label="Notes (optional)" size="small" multiline rows={2} />} />
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Recording…" : "Record Payment"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Recent Payments</Typography>
            <DataState loading={payments.loading} error={payments.error} data={payments.data} onRetry={payments.refetch} isEmpty={(d: any) => d.length === 0}>
              {(data: any) => (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Receipt</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.slice(0, 12).map((p: any) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{p.receiptNumber}</TableCell>
                        <TableCell>{p.studentName}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatKES(p.amount)}</TableCell>
                        <TableCell>{PAYMENT_METHOD_LABELS[p.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}</TableCell>
                        <TableCell><Button size="small" onClick={() => setReceipt(p)}>Receipt</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataState>
          </CardContent>
        </Card>
      </Box>

      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}

/** Printable receipt dialog. */
function ReceiptDialog({ receipt, onClose }: { receipt: FeePayment | null; onClose: () => void }) {
  return (
    <Dialog open={!!receipt} onClose={onClose} maxWidth="sm" fullWidth>
      {receipt && (
        <>
          <DialogContent>
            <Box className="printable">
              <Letterhead title="Official Fee Receipt" />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box>
                  <Typography variant="body2"><strong>Receipt No:</strong> {receipt.receiptNumber}</Typography>
                  <Typography variant="body2"><strong>Date:</strong> {formatDate(receipt.paymentDate)}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2"><strong>Adm No:</strong> {receipt.admissionNumber}</Typography>
                  <Typography variant="body2"><strong>Class:</strong> {receipt.className}</Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Received from <strong>{receipt.studentName}</strong> the sum of:</Typography>
              <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>{numberToWords(receipt.amount)}</Typography>
              </Box>
              <Table size="small" sx={{ mb: 2 }}>
                <TableHead><TableRow><TableCell>Description</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                <TableBody>
                  <TableRow><TableCell>Fee Payment ({PAYMENT_METHOD_LABELS[receipt.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}{receipt.mpesaCode ? ` · ${receipt.mpesaCode}` : ""})</TableCell><TableCell align="right">{formatKES(receipt.amount)}</TableCell></TableRow>
                </TableBody>
              </Table>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total Paid</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{formatKES(receipt.amount)}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
                Received by: {receipt.receivedBy} · This is a computer-generated receipt.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions className="no-print" sx={{ p: 2 }}>
            <Button onClick={onClose}>Close</Button>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Print Receipt</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
