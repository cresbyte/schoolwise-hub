"use client";

/**
 * Advanced Staff Profile Page: personal details, payroll history, leave, and schedule.
 * @module profile/page
 */
import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MenuItem from "@mui/material/MenuItem";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import BadgeIcon from "@mui/icons-material/Badge";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAuth } from "@/context/AuthContext";
import { useStaffMember } from "@/hooks/domain";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { formatKES, getInitials, MONTH_NAMES } from "@/lib/utils";
import { ROLE_LABELS, CONTRACT_TYPES, LEAVE_TYPES } from "@/lib/constants";
import { useNotification } from "@/context/NotificationContext";
import type { PayrollRecord, LeaveRequest, TimetableSlot } from "@/lib/types";

export default function ProfilePage() {
  const { user } = useAuth();
  const staff = useStaffMember(user?.staffId || "");

  return (
    <DashboardLayout>
      <PageHeader title="My Profile" subtitle="Manage your school presence and records" />
      <DataState loading={staff.loading} error={staff.error} data={staff.data} onRetry={staff.refetch}>
        {(s) => <ProfileContent staff={s} onUpdate={staff.refetch} />}
      </DataState>
    </DashboardLayout>
  );
}

function ProfileContent({ staff, onUpdate }: { staff: any; onUpdate: () => void }) {
  const [tab, setTab] = useState(0);
  const { showNotification } = useNotification();
  
  // Data fetching
  const payrollHistory = useAsync(() => api.getStaffPayrollHistory(staff.id), [staff.id]);
  const leaveHistory = useAsync(() => api.getLeaveRequests({ staffId: staff.id }), [staff.id]);
  const schedule = useAsync(() => api.getTeacherTimetable(staff.id), [staff.id]);

  const [viewPayslip, setViewPayslip] = useState<PayrollRecord | null>(null);
  const [editPayment, setEditPayment] = useState(false);
  const [requestLeave, setRequestLeave] = useState(false);

  const handleAvatarUpdate = async () => {
    // Simulated avatar update with standard mock URL
    const mockUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
    await api.updateStaffAvatar(staff.id, mockUrl);
    showNotification("Profile picture updated successfully!", "success");
    onUpdate();
  };

  return (
    <Box sx={{ maxWidth: 1400 }}>
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 4, display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText" }}>
          <Box sx={{ position: "relative" }}>
            <Avatar src={staff.photo} sx={{ width: 120, height: 120, border: "4px solid white", bgcolor: "secondary.main", fontSize: 40 }}>
              {getInitials(`${staff.firstName} ${staff.lastName}`)}
            </Avatar>
            <IconButton
              size="small"
              onClick={handleAvatarUpdate}
              sx={{ position: "absolute", bottom: 0, right: 0, bgcolor: "white", "&:hover": { bgcolor: "white" } }}
            >
              <CloudUploadIcon fontSize="small" sx={{ color: "primary.main" }} />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{staff.firstName} {staff.lastName}</Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>{staff.designation} · {staff.department}</Typography>
            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
              <Chip label={staff.staffNumber} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 700 }} />
              <Chip label={staff.status} size="small" sx={{ bgcolor: "white", color: "primary.main", fontWeight: 700 }} />
            </Box>
          </Box>
        </Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab label="Overview" />
          <Tab label="Employment & Payment" />
          <Tab label="Finance & Payroll" />
          <Tab label="Leave Requests" />
          <Tab label="My Schedule" />
          <Tab label="Security" />
        </Tabs>

        <CardContent sx={{ p: 4 }}>
          {tab === 0 && <OverviewTab staff={staff} />}
          {tab === 1 && <EmploymentTab staff={staff} onEditPayment={() => setEditPayment(true)} />}
          {tab === 2 && <FinanceTab payrollHistory={payrollHistory} onViewPayslip={setViewPayslip} />}
          {tab === 3 && <LeaveTab leaveHistory={leaveHistory} onRequestLeave={() => setRequestLeave(true)} />}
          {tab === 4 && <ScheduleTab schedule={schedule} />}
          {tab === 5 && <SecurityTab />}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PayslipDialog payslip={viewPayslip} onClose={() => setViewPayslip(null)} />
      <PaymentEditDialog open={editPayment} staff={staff} onClose={() => setEditPayment(false)} onSave={onUpdate} />
      <LeaveRequestModal open={requestLeave} staff={staff} onClose={() => setRequestLeave(false)} onSave={leaveHistory.refetch} />
    </Box>
  );
}

// --- Tabs Components ---

function OverviewTab({ staff }: { staff: any }) {
  return (
    <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Personal Information</Typography>
        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" } }}>
          <DetailItem label="First Name" value={staff.firstName} />
          <DetailItem label="Last Name" value={staff.lastName} />
          <DetailItem label="Gender" value={staff.gender} />
          <DetailItem label="Date of Birth" value={staff.dateOfBirth} />
          <DetailItem label="ID Number" value={staff.idNumber} />
          <DetailItem label="KRA PIN" value={staff.kraPin} />
          <DetailItem label="NSSF Number" value={staff.nssfNumber || "—"} />
          <DetailItem label="SHIF Number" value={staff.shifNumber || "—"} />
        </Box>
      </Box>
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Contact Details</Typography>
        <List>
          <ContactItem icon={<PhoneIcon />} label="Phone" value={staff.phone} />
          <ContactItem icon={<EmailIcon />} label="Email" value={staff.email || "—"} />
          <ContactItem icon={<LocationOnIcon />} label="Next of Kin" value={`${staff.nextOfKin?.name} (${staff.nextOfKin?.relationship})`} />
          <ContactItem icon={<BadgeIcon />} label="NOK Phone" value={staff.nextOfKin?.phone} />
        </List>
      </Box>
    </Box>
  );
}

function EmploymentTab({ staff, onEditPayment }: { staff: any; onEditPayment: () => void }) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Employment Profile</Typography>
        <Button startIcon={<EditIcon />} onClick={onEditPayment} size="small">Edit Payment Details</Button>
      </Box>
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" } }}>
        <DetailItem label="Designation" value={staff.designation} />
        <DetailItem label="Department" value={staff.department || "General"} />
        <DetailItem label="Contract Type" value={CONTRACT_TYPES.find(c => c.value === staff.contractType)?.label || staff.contractType} />
        <DetailItem label="Date Joined" value={staff.dateJoined} />
        <DetailItem label="Payment Method" value={staff.paymentMethod || "Bank Transfer"} />
        <DetailItem label="Bank Name" value={staff.bankName || "—"} />
        <DetailItem label="Bank Account" value={staff.bankAccount ? `****${staff.bankAccount.slice(-4)}` : "—"} />
        <DetailItem label="M-Pesa Number" value={staff.mpesaNumber || "—"} />
      </Box>
      {staff.subjectsTeaching && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Subjects Teaching</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {staff.subjectsTeaching.map((s: string) => <Chip key={s} label={s} variant="outlined" />)}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function FinanceTab({ payrollHistory, onViewPayslip }: { payrollHistory: any; onViewPayslip: (p: any) => void }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Payroll History</Typography>
      <DataState loading={payrollHistory.loading} error={payrollHistory.error} data={payrollHistory.data}>
        {(list: PayrollRecord[]) => (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Month / Year</TableCell>
                  <TableCell align="right">Gross Pay</TableCell>
                  <TableCell align="right">Deductions</TableCell>
                  <TableCell align="right">Net Pay</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{MONTH_NAMES[p.month - 1]} {p.year}</TableCell>
                    <TableCell align="right">{formatKES(p.grossPay)}</TableCell>
                    <TableCell align="right" sx={{ color: "error.main" }}>{formatKES(p.totalDeductions)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKES(p.netPay)}</TableCell>
                    <TableCell><Chip size="small" label={p.paymentStatus} color={p.paymentStatus === "paid" ? "success" : "warning"} /></TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => onViewPayslip(p)}>View Payslip</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataState>
    </Box>
  );
}

function LeaveTab({ leaveHistory, onRequestLeave }: { leaveHistory: any; onRequestLeave: () => void }) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 4 }}>
          <StatMini label="Annual Leave Left" value="12 Days" color="primary.main" />
          <StatMini label="Sick Leave Taken" value="2 Days" color="error.main" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onRequestLeave}>Request Leave</Button>
      </Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Leave History</Typography>
      <DataState loading={leaveHistory.loading} error={leaveHistory.error} data={leaveHistory.data} isEmpty={(d: any) => d.length === 0}>
        {(list: LeaveRequest[]) => (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Dates</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.startDate} to {l.endDate}</TableCell>
                    <TableCell>{l.days}</TableCell>
                    <TableCell><Chip size="small" label={LEAVE_TYPES.find(t => t.value === l.leaveType)?.label} variant="outlined" /></TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.reason}</TableCell>
                    <TableCell><Chip size="small" label={l.status} color={l.status === "approved" ? "success" : l.status === "rejected" ? "error" : "warning"} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataState>
    </Box>
  );
}

function ScheduleTab({ schedule }: { schedule: any }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const grid = useMemo(() => {
    const data = schedule.data || [];
    const hours = Array.from(new Set(data.map((s: any) => s.startTime))).sort();
    return { hours, data };
  }, [schedule.data]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>My Teaching Schedule (Term 2, 2026)</Typography>
      <DataState loading={schedule.loading} error={schedule.error} data={schedule.data} isEmpty={(d: any) => d.length === 0}>
        {() => (
          <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
            <Table size="small" sx={{ minWidth: 1000, tableLayout: "fixed" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell sx={{ width: 100, borderRight: 1, borderColor: "divider" }}>Time</TableCell>
                  {days.map(d => <TableCell key={d} align="center" sx={{ fontWeight: 700, borderRight: 1, borderColor: "divider" }}>{d}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {grid.hours.map((time: any) => (
                  <TableRow key={String(time)}>
                    <TableCell sx={{ verticalAlign: "middle", borderRight: 1, borderColor: "divider", fontWeight: 600 }}>{String(time)}</TableCell>
                    {days.map(day => {
                      const slot = grid.data.find((s: any) => s.day === day && s.startTime === time);
                      return (
                        <TableCell key={`${day}-${time}`} sx={{ height: 80, borderRight: 1, borderColor: "divider", p: 0.5 }}>
                          {slot && (
                            <Box sx={{ bgcolor: slot.isBreak ? "action.hover" : "primary.main", color: slot.isBreak ? "text.primary" : "white", p: 1, borderRadius: 0.5, height: "100%", overflow: "hidden" }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>{slot.isBreak ? slot.breakName : slot.subjectName}</Typography>
                              {!slot.isBreak && <Typography variant="caption" sx={{ opacity: 0.8 }}>Class: {slot.classId}</Typography>}
                            </Box>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataState>
    </Box>
  );
}

function SecurityTab() {
  const { showNotification } = useNotification();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    showNotification("Password updated successfully", "success");
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 500 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Security Settings</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2.5 }}>
        <TextField label="Current Password" type={show ? "text" : "password"} size="small" required fullWidth 
          slotProps={{ input: { endAdornment: (
            <IconButton onClick={() => setShow(!show)} size="small">
              {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            </IconButton>
          )}}}
        />
        <TextField label="New Password" type={show ? "text" : "password"} size="small" required fullWidth />
        <TextField label="Confirm New Password" type={show ? "text" : "password"} size="small" required fullWidth />
        <Box sx={{ mt: 1 }}>
          <Button variant="contained" type="submit" disabled={loading}>{loading ? "Updating..." : "Update Password"}</Button>
        </Box>
      </Box>
    </Box>
  );
}

// --- Modals & Popups ---

function PayslipDialog({ payslip, onClose }: { payslip: PayrollRecord | null; onClose: () => void }) {
  if (!payslip) return null;
  return (
    <Dialog open={!!payslip} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Payslip: {MONTH_NAMES[payslip.month - 1]} {payslip.year}
        <Button startIcon={<DownloadIcon />} size="small">Download PDF</Button>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Box>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 700 }}>EARNINGS</Typography>
            <Stack spacing={1}>
              <Row label="Basic Salary" value={formatKES(payslip.basicSalary)} />
              <Row label="House Allowance" value={formatKES(payslip.houseAllowance)} />
              <Row label="Transport Allowance" value={formatKES(payslip.transportAllowance)} />
              <Row label="Other Allowances" value={formatKES(payslip.otherAllowances)} />
              <Divider sx={{ my: 1 }} />
              <Row label="Gross Earnings" value={formatKES(payslip.grossPay)} bold />
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="error" sx={{ mb: 2, fontWeight: 700 }}>DEDUCTIONS</Typography>
            <Stack spacing={1}>
              <Row label="PAYE (Income Tax)" value={formatKES(payslip.paye)} />
              <Row label="NSSF Contribution" value={formatKES(payslip.nssf)} />
              <Row label="SHIF (Health)" value={formatKES(payslip.shif)} />
              <Row label="Housing Levy" value={formatKES(payslip.housingLevy)} />
              {payslip.loanDeduction > 0 && <Row label="Loan" value={formatKES(payslip.loanDeduction)} />}
              <Divider sx={{ my: 1 }} />
              <Row label="Total Deductions" value={formatKES(payslip.totalDeductions)} bold />
            </Stack>
          </Box>
        </Box>
        <Box sx={{ mt: 4, p: 2, bgcolor: "primary.main", color: "white", borderRadius: 1, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Net Pay (Take Home)</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatKES(payslip.netPay)}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function PaymentEditDialog({ open, staff, onClose, onSave }: { open: boolean; staff: any; onClose: () => void; onSave: () => void }) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    showNotification("Payment preferences updated successfully!", "success");
    onSave();
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Payment Preferences</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField defaultValue={staff.paymentMethod || "bank_transfer"} select label="Default Payment Method" size="small" fullWidth>
            <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
            <MenuItem value="mpesa">M-Pesa</MenuItem>
            <MenuItem value="cash">Cash / Hand</MenuItem>
          </TextField>
          <TextField defaultValue={staff.bankName} label="Bank Name" size="small" fullWidth />
          <TextField defaultValue={staff.bankAccount} label="Account Number" size="small" fullWidth />
          <TextField defaultValue={staff.bankBranch} label="Bank Branch" size="small" fullWidth />
          <TextField defaultValue={staff.mpesaNumber} label="M-Pesa Number" size="small" fullWidth placeholder="07XXXXXXXX" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>{loading ? "Saving..." : "Save Preferences"}</Button>
      </DialogActions>
    </Dialog>
  );
}

function LeaveRequestModal({ open, staff, onClose, onSave }: { open: boolean; staff: any; onClose: () => void; onSave: () => void }) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    const data: any = {
      staffId: staff.id,
      staffName: `${staff.firstName} ${staff.lastName}`,
      leaveType: fd.get("type"),
      startDate: fd.get("start"),
      endDate: fd.get("end"),
      reason: fd.get("reason"),
      days: 5, // Simulated count
    };
    await api.createLeaveRequest(data);
    showNotification("Leave request submitted for review", "success");
    onSave();
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Request for Leave</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField name="type" select label="Leave Type" defaultValue="annual" size="small" fullWidth>
              {LEAVE_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField name="start" type="date" label="Start Date" size="small" slotProps={{ inputLabel: { shrink: true } }} required />
              <TextField name="end" type="date" label="End Date" size="small" slotProps={{ inputLabel: { shrink: true } }} required />
            </Box>
            <TextField name="reason" label="Reason / Notes" multiline rows={3} size="small" fullWidth required />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" type="submit" disabled={loading}>{loading ? "Submit Request" : "Submit Request"}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// --- Utils ---

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

function ContactItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <ListItem sx={{ px: 0 }}>
      <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
      <ListItemText primary={value} secondary={label} />
    </ListItem>
  );
}

function StatMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color }}>{value}</Typography>
    </Box>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 400 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 800 : 500 }}>{value}</Typography>
    </Box>
  );
}

