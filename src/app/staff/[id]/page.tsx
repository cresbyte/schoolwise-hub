"use client";

/**
 * Staff member detail page with tabbed sections.
 * @module staff/[id]/page
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataState } from "@/components/DataState";
import { StatusChip } from "@/components/StatusChip";
import { Letterhead } from "@/components/Letterhead";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { formatDate, formatKES, getInitials } from "@/lib/utils";
import { CONTRACT_TYPES, LEAVE_TYPES } from "@/lib/constants";
import type { Staff } from "@/lib/types";

export default function StaffDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  return (
    <DashboardLayout>
      <StaffDetailContent id={id} />
    </DashboardLayout>
  );
}

function Field({ label, value }: { label: string; value?: string | number }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value ?? "—"}</Typography>
    </Box>
  );
}

function StaffDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { data, loading, error, refetch } = useAsync(() => api.getStaffById(id), [id]);
  const [tab, setTab] = useState(0);

  return (
    <DataState loading={loading} error={error} data={data} onRetry={refetch}>
      {(s: Staff) => (
        <>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/staff")} sx={{ mb: 2 }}>
            Back to Staff
          </Button>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
                <Avatar sx={{ width: 84, height: 84, fontSize: 28, bgcolor: "secondary.main" }}>
                  {getInitials(`${s.firstName} ${s.lastName}`)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography variant="h5">{s.firstName} {s.lastName}</Typography>
                    <Chip size="small" label={s.staffNumber} sx={{ fontFamily: "monospace" }} />
                    <StatusChip status={s.status} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {s.designation} · {s.department ?? "—"} · {CONTRACT_TYPES.find((c) => c.value === s.contractType)?.label} · {s.phone}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tab label="Personal Info" />
              <Tab label="Teaching Load" />
              <Tab label="Leave History" />
              <Tab label="Payroll History" />
            </Tabs>
            <CardContent>
              {tab === 0 && <PersonalTab s={s} />}
              {tab === 1 && <TeachingTab staffId={s.id} />}
              {tab === 2 && <LeaveTab staffId={s.id} />}
              {tab === 3 && <PayrollTab staffId={s.id} staffName={`${s.firstName} ${s.lastName}`} staffNumber={s.staffNumber} />}
            </CardContent>
          </Card>
        </>
      )}
    </DataState>
  );
}

function PersonalTab({ s }: { s: Staff }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Employment Details</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <Field label="Staff Number" value={s.staffNumber} />
        <Field label="Designation" value={s.designation} />
        <Field label="Department" value={s.department} />
        <Field label="Contract Type" value={CONTRACT_TYPES.find((c) => c.value === s.contractType)?.label} />
        <Field label="Date of Joining" value={formatDate(s.dateJoined)} />
        <Field label="TSC / ID Number" value={s.idNumber} />
        <Field label="KRA PIN" value={s.kraPin} />
        <Field label="NSSF Number" value={s.nssfNumber} />
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Salary Details</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <Field label="Basic Salary" value={formatKES(s.basicSalary)} />
        <Field label="House Allowance" value={formatKES(s.houseAllowance)} />
        <Field label="Transport Allowance" value={formatKES(s.transportAllowance)} />
        <Field label="Other Allowances" value={formatKES(s.otherAllowances)} />
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Contact & Next of Kin</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <Field label="Phone" value={s.phone} />
        <Field label="Email" value={s.email} />
        <Field label="Next of Kin" value={s.nextOfKin?.name} />
        <Field label="Next of Kin Phone" value={s.nextOfKin?.phone} />
      </Box>
    </Box>
  );
}

function TeachingTab({ staffId }: { staffId: string }) {
  const timetable = useAsync(() => api.getTeacherTimetable(staffId), [staffId]);
  const list = timetable.data ?? [];

  const classIds = [...new Set(list.map((s) => s.classId))];

  return (
    <DataState loading={timetable.loading} error={timetable.error} data={list} onRetry={timetable.refetch} isEmpty={(d) => d.length === 0} emptyMessage="No timetable slots assigned">
      {() => (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            {list.length} period(s) per week across {classIds.length} class(es).
          </Alert>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Class</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Day</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((slot: any, i: number) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{slot.classId}</TableCell>
                  <TableCell>{slot.subjectName}</TableCell>
                  <TableCell>{slot.day}</TableCell>
                  <TableCell>{slot.startTime} – {slot.endTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </DataState>
  );
}

function LeaveTab({ staffId }: { staffId: string }) {
  const { showNotification } = useNotification();
  const leave = useAsync(() => api.getLeaveRequests({ staffId }), [staffId]);
  const list = leave.data ?? [];

  const approve = async (id: string) => {
    await api.updateLeaveStatus(id, "approved");
    leave.refetch();
    showNotification("Leave approved", "success");
  };
  const reject = async (id: string) => {
    await api.updateLeaveStatus(id, "rejected", "Does not meet leave criteria");
    leave.refetch();
    showNotification("Leave rejected", "info");
  };

  return (
    <DataState loading={leave.loading} error={leave.error} data={list} onRetry={leave.refetch} isEmpty={(d) => d.length === 0} emptyMessage="No leave requests">
      {() => (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Days</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((lv: any) => (
              <TableRow key={lv.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{LEAVE_TYPES.find((t) => t.value === lv.leaveType)?.label ?? lv.leaveType}</TableCell>
                <TableCell>{formatDate(lv.startDate)}</TableCell>
                <TableCell>{formatDate(lv.endDate)}</TableCell>
                <TableCell>{lv.days}</TableCell>
                <TableCell sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lv.reason}</TableCell>
                <TableCell><StatusChip status={lv.status} /></TableCell>
                <TableCell align="right">
                  {lv.status === "pending" && (
                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                      <Button size="small" color="success" onClick={() => approve(lv.id)}>Approve</Button>
                      <Button size="small" color="error" onClick={() => reject(lv.id)}>Reject</Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataState>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function PayrollTab({ staffId, staffName, staffNumber }: { staffId: string; staffName: string; staffNumber: string }) {
  const [month, setMonth] = useState(6);
  const [year] = useState(2026);
  const [p9Open, setP9Open] = useState(false);
  const payslip = useAsync(() => api.getStaffPayslip(staffId, month, year).catch(() => null), [staffId, month, year]);
  const p9 = useAsync(() => (p9Open ? api.getP9Certificate(staffId, year) : Promise.resolve(null)), [staffId, year, p9Open]);
  const p = payslip.data;

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} sx={{ width: 180 }}>
          {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m} {year}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={() => setP9Open(true)}>P9 Certificate ({year})</Button>
      </Box>

      {payslip.loading ? (
        <Typography color="text.secondary">Loading payslip…</Typography>
      ) : !p ? (
        <Alert severity="warning">No payslip found for {MONTHS[month - 1]} {year}. Run payroll first.</Alert>
      ) : (
        <Card variant="outlined" sx={{ maxWidth: 480 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Payslip — {MONTHS[month - 1]} {year}</Typography>
            {[
              ["Basic Salary", formatKES(p.basicSalary)],
              ["House Allowance", formatKES(p.houseAllowance)],
              ["Transport Allowance", formatKES(p.transportAllowance)],
              ["Other Allowances", formatKES(p.otherAllowances)],
            ].map(([label, val]) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2">{label}</Typography>
                <Typography variant="body2">{val}</Typography>
              </Box>
            ))}
            <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 700, my: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Gross Pay</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatKES(p.grossPay)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            {[
              ["PAYE", formatKES(p.paye)],
              ["NSSF", formatKES(p.nssf)],
              ["SHIF", formatKES(p.shif)],
              ["Housing Levy", formatKES(p.housingLevy)],
            ].map(([label, val]) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" color="error.main">{label}</Typography>
                <Typography variant="body2" color="error.main">({val})</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", bgcolor: "primary.main", color: "#fff", p: 1.5, borderRadius: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>NET PAY</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{formatKES(p.netPay)}</Typography>
            </Box>
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="outlined" startIcon={<PrintIcon />} size="small" onClick={() => window.print()}>Print Payslip</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* P9 Certificate Dialog */}
      <Dialog open={p9Open} onClose={() => setP9Open(false)} maxWidth="md" fullWidth>
        <DialogTitle>P9 Certificate — {staffName} · {year}</DialogTitle>
        <DialogContent>
          {p9.loading ? (
            <Typography color="text.secondary">Generating P9…</Typography>
          ) : p9.data ? (
            <Box className="printable">
              <Letterhead title={`P9 Tax Deduction Card — Year ${year}`} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
                <Typography variant="body2"><strong>Employee:</strong> {staffName}</Typography>
                <Typography variant="body2"><strong>Staff No:</strong> {staffNumber}</Typography>
                <Typography variant="body2"><strong>KRA PIN:</strong> {(p9.data as any).staff?.kraPin ?? "—"}</Typography>
                <Typography variant="body2"><strong>ID No:</strong> {(p9.data as any).staff?.idNumber ?? "—"}</Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Gross Pay</TableCell>
                    <TableCell align="right">PAYE</TableCell>
                    <TableCell align="right">NSSF</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(p9.data as any).months.map((m: any) => (
                    <TableRow key={m.month}>
                      <TableCell>{MONTHS[m.month - 1]}</TableCell>
                      <TableCell align="right">{formatKES(m.gross)}</TableCell>
                      <TableCell align="right">{formatKES(m.paye)}</TableCell>
                      <TableCell align="right">{formatKES(m.nssf)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKES((p9.data as any).annualGross)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKES((p9.data as any).annualPaye)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2"><strong>Personal Relief:</strong> {formatKES((p9.data as any).personalRelief)}</Typography>
                <Typography variant="body2"><strong>Taxable Income:</strong> {formatKES((p9.data as any).annualGross)}</Typography>
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions className="no-print" sx={{ p: 2 }}>
          <Button onClick={() => setP9Open(false)}>Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Print P9</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
