"use client";

/**
 * Monthly payroll run with statutory deductions and payslips.
 * @module payroll/page
 */
import { useState } from "react";
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
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import GroupsIcon from "@mui/icons-material/Groups";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { StatCard } from "@/components/StatCard";
import { StatusChip } from "@/components/StatusChip";
import { Letterhead } from "@/components/Letterhead";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { formatKES } from "@/lib/utils";
import type { PayrollRecord } from "@/lib/types";

export default function PayrollPage() {
  return (
    <DashboardLayout>
      <PayrollContent />
    </DashboardLayout>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Payroll content. */
function PayrollContent() {
  const { showNotification } = useNotification();
  const [month, setMonth] = useState(6);
  const year = 2026;
  const [payslip, setPayslip] = useState<PayrollRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const payroll = useAsync(() => api.getPayroll(month, year), [month]);
  const list = payroll.data ?? [];

  const totalNet = list.reduce((s, p) => s + p.netPay, 0);
  const totalGross = list.reduce((s, p) => s + p.grossPay, 0);

  const run = async () => {
    setBusy(true);
    await api.calculatePayroll(month, year);
    setBusy(false);
    payroll.refetch();
    showNotification("Payroll calculated", "success");
  };
  const approve = async () => {
    setBusy(true);
    await api.approvePayroll(month, year);
    setBusy(false);
    payroll.refetch();
    showNotification("Payroll approved", "success");
  };
  const pay = async () => {
    setBusy(true);
    await api.markPayrollPaid(month, year);
    setBusy(false);
    payroll.refetch();
    showNotification("Payroll marked as paid", "success");
  };

  return (
    <>
      <PageHeader
        title="Payroll"
        subtitle={`${MONTHS[month - 1]} ${year}`}
        actions={
          <RoleGuard permission="payroll.process">
            {list.length === 0 ? (
              <Button variant="contained" onClick={run} disabled={busy}>Run Payroll</Button>
            ) : (
              <>
                <Button variant="outlined" onClick={approve} disabled={busy} sx={{ mr: 1 }}>Approve</Button>
                <Button variant="contained" onClick={pay} disabled={busy}>Mark Paid</Button>
              </>
            )}
          </RoleGuard>
        }
      />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, mb: 2 }}>
        <StatCard icon={<GroupsIcon />} label="Staff on Payroll" value={list.length} />
        <StatCard icon={<AccountBalanceWalletIcon />} color="#6A1B9A" label="Total Gross" value={formatKES(totalGross)} />
        <StatCard icon={<AccountBalanceWalletIcon />} color="#2E7D32" label="Total Net Pay" value={formatKES(totalNet)} />
      </Box>
      <Card sx={{ p: 2, mb: 2 }}>
        <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} sx={{ width: 180 }}>
          {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m} {year}</MenuItem>)}
        </TextField>
      </Card>
      <Card>
        <DataState loading={payroll.loading} error={payroll.error} data={list} onRetry={payroll.refetch} isEmpty={(d: any) => d.length === 0} emptyMessage="Payroll not yet run for this month">
          {() => (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff</TableCell>
                    <TableCell align="right">Gross</TableCell>
                    <TableCell align="right">PAYE</TableCell>
                    <TableCell align="right">NSSF</TableCell>
                    <TableCell align="right">SHIF</TableCell>
                    <TableCell align="right">Housing</TableCell>
                    <TableCell align="right">Net Pay</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((p: any) => (
                    <TableRow key={p.id} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{p.staffName}</Typography><Typography variant="caption" color="text.secondary">{p.staffNumber}</Typography></TableCell>
                      <TableCell align="right">{formatKES(p.grossPay)}</TableCell>
                      <TableCell align="right">{formatKES(p.paye)}</TableCell>
                      <TableCell align="right">{formatKES(p.nssf)}</TableCell>
                      <TableCell align="right">{formatKES(p.shif)}</TableCell>
                      <TableCell align="right">{formatKES(p.housingLevy)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKES(p.netPay)}</TableCell>
                      <TableCell><StatusChip status={p.paymentStatus} /></TableCell>
                      <TableCell><Button size="small" onClick={() => setPayslip(p)}>Payslip</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DataState>
      </Card>
      <PayslipDialog payslip={payslip} month={month} year={year} onClose={() => setPayslip(null)} />
    </>
  );
}

/** Printable payslip. */
function PayslipDialog({ payslip, month, year, onClose }: { payslip: PayrollRecord | null; month: number; year: number; onClose: () => void }) {
  const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 400 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 400 }}>{value}</Typography>
    </Box>
  );
  return (
    <Dialog open={!!payslip} onClose={onClose} maxWidth="sm" fullWidth>
      {payslip && (
        <>
          <DialogContent>
            <Box className="printable">
              <Letterhead title={`Payslip — ${MONTHS[month - 1]} ${year}`} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="body2"><strong>Name:</strong> {payslip.staffName}</Typography>
                <Typography variant="body2"><strong>Staff No:</strong> {payslip.staffNumber}</Typography>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Earnings</Typography>
              <Row label="Basic Salary" value={formatKES(payslip.basicSalary)} />
              <Row label="House Allowance" value={formatKES(payslip.houseAllowance)} />
              <Row label="Transport Allowance" value={formatKES(payslip.transportAllowance)} />
              <Row label="Other Allowances" value={formatKES(payslip.otherAllowances)} />
              <Row label="Gross Pay" value={formatKES(payslip.grossPay)} bold />
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Statutory Deductions</Typography>
              <Row label="PAYE" value={formatKES(payslip.paye)} />
              <Row label="NSSF" value={formatKES(payslip.nssf)} />
              <Row label="SHIF" value={formatKES(payslip.shif)} />
              <Row label="Housing Levy" value={formatKES(payslip.housingLevy)} />
              {payslip.loanDeduction > 0 && <Row label="Loan Deduction" value={formatKES(payslip.loanDeduction)} />}
              <Row label="Total Deductions" value={formatKES(payslip.totalDeductions)} bold />
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                <Row label="NET PAY" value={formatKES(payslip.netPay)} bold />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>Processed by: {payslip.processedBy}</Typography>
            </Box>
          </DialogContent>
          <DialogActions className="no-print" sx={{ p: 2 }}>
            <Button onClick={onClose}>Close</Button>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
