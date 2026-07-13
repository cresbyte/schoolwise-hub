"use client";

import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Badge, Box,
  Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Drawer, Grid, IconButton, List, ListItem, ListItemText, MenuItem, Stack,
  Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs,
  TextField, Tooltip, Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import {
  AccessTime, Chat, CheckCircle, Close, EventAvailable, ExpandMore, Info,
  Notifications, Payments, Print, Send, WarningAmber
} from "@mui/icons-material";

import { CBCRatingChip } from "@/components/CBCRatingChip";
import { DataState } from "@/components/DataState";
import { GradeChip } from "@/components/GradeChip";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { Letterhead } from "@/components/Letterhead";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import * as mockApi from "@/lib/mockApi";
import { school as SCHOOL_FALLBACK, payments as MOCK_PAYMENTS, attendance as MOCK_ATTENDANCE, exams as MOCK_EXAMS, timetables as MOCK_TIMETABLES, specialLevies as MOCK_LEVIES } from "@/lib/mockData";
import { formatDate, formatKES, getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

// ─── Mock notification data for the portal ───────────────────────────────────
const PORTAL_NOTIFICATIONS = [
  { id: "pn-1", type: "success", icon: "payment", title: "Payment Received", body: "KES 15,000 payment confirmed via M-Pesa (QGH2847561). Receipt RCP-2026-01023.", time: "2026-06-10T09:15:00Z" },
  { id: "pn-2", type: "warning", icon: "fee",     title: "Fee Balance Reminder", body: "Your fee balance of KES 12,500 is due by 31 May 2026. Please clear to avoid disruption.", time: "2026-06-08T08:00:00Z" },
  { id: "pn-3", type: "info",    icon: "exam",    title: "Exam Results Available", body: "Term 2 Mid-Term results are now published. View them under the Results tab.", time: "2026-06-07T11:00:00Z" },
  { id: "pn-4", type: "error",   icon: "absent",  title: "Absence Recorded", body: "Your child was marked absent on 12 June 2026. Please contact the class teacher.", time: "2026-06-12T08:35:00Z" },
  { id: "pn-5", type: "info",    icon: "announcement", title: "School Closes Aug 9", body: "Term 2 will close on 9 August 2026. Next term begins 2 September 2026.", time: "2026-06-10T10:00:00Z" },
];


export default function PortalPage() {
  return (
    <PortalLayout>
      <PortalContent />
    </PortalLayout>
  );
}

function PortalContent() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.role !== "parent") {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" sx={{ mb: 2 }}>This page is for parents only.</Typography>
        <Button variant="contained" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </Box>
    );
  }

  // Fetch children linked to this parent via mock data (real API fallback)
  const { data: students = [], loading: loadingStudents, error: studentsError } = useAsync(async () => {
    // Try mock API first (always works for demo parent accounts)
    try {
      const mockKids = await mockApi.getParentStudents(user.id);
      if (mockKids && mockKids.length > 0) return mockKids;
    } catch {}
    // Fall back to real API
    try {
      const real = await api.getStudents();
      if (real && real.length > 0) return real;
    } catch {}
    return [];
  }, [user?.id]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [tab, setTab] = useState(0);
  const [notifDismissed, setNotifDismissed] = useState({});

  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const selectedStudent = useMemo(() => (students || []).find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  const unreadMessages = useAsync(async () => {
    if (!selectedStudentId) return [];
    try {
      const msgs = await api.getParentMessages(selectedStudentId);
      return (msgs || []).filter(m => m.status !== "read");
    } catch { return []; }
  }, [selectedStudentId]);

  const visibleNotifs = PORTAL_NOTIFICATIONS.filter(n => !notifDismissed[n.id]);

  if (loadingStudents) return <DataState loading={true} data={null} error={null} children={<Box />} />;
  if (studentsError && (!students || students.length === 0)) return <Alert severity="info">No children linked to your account.</Alert>;
  if (!selectedStudent) return <Alert severity="info">No children linked to your account.</Alert>;

  const studentList = students || [];

  return (
    <>
      {/* ── Student selector card ── */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>My Children</Typography>
            {studentList.length > 1 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {studentList.map(s => (
                  <Chip
                    key={s.id}
                    label={s.firstName}
                    onClick={() => setSelectedStudentId(s.id)}
                    color={selectedStudentId === s.id ? "primary" : "default"}
                    sx={{ fontWeight: 600 }}
                    avatar={<Avatar src={s.avatarUrl} sx={{ width: 24, height: 24 }}>{getInitials(s.firstName)}</Avatar>}
                  />
                ))}
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Avatar src={selectedStudent.avatarUrl} sx={{ width: 64, height: 64, bgcolor: "primary.main" }}>
              {getInitials(`${selectedStudent.firstName} ${selectedStudent.lastName}`)}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{selectedStudent.firstName} {selectedStudent.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedStudent.className} · {selectedStudent.admissionNumber}</Typography>
              <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip size="small" label={selectedStudent.curriculum} variant="outlined" />
                <Chip size="small" label={selectedStudent.boardingStatus === "day" ? "Day Scholar" : "Boarder"} variant="outlined" />
                {selectedStudent.feeBalance > 0 ? (
                  <Chip size="small" label={`Balance: ${formatKES(selectedStudent.feeBalance)}`} color="error" />
                ) : (
                  <Chip size="small" label="Fees Fully Paid" color="success" />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── Notifications strip ── */}
      {visibleNotifs.length > 0 && (
        <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Notifications fontSize="small" color="action" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>
              Notifications
            </Typography>
          </Box>
          {visibleNotifs.map(n => (
            <Alert
              key={n.id}
              severity={n.type}
              sx={{ py: 0.75, "& .MuiAlert-message": { width: "100%", overflow: "hidden" } }}
              action={
                <IconButton size="small" onClick={() => setNotifDismissed(d => ({ ...d, [n.id]: true }))}>
                  <Close fontSize="small" />
                </IconButton>
              }
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{n.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, lineHeight: 1.4 }}>{n.body}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                  {formatDate(n.time)}
                </Typography>
              </Box>
            </Alert>
          ))}
        </Box>
      )}

      {/* ── Main tabbed card ── */}
      <Card>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="This Term" />
          <Tab label="Results" />
          <Tab label="Attendance" />
          <Tab label="Fees" />
          <Tab label={
            <Badge badgeContent={(unreadMessages.data || []).length} color="error" sx={{ "& .MuiBadge-badge": { right: -10, top: 0 } }}>
              Messages
            </Badge>
          } />
          <Tab label="Timetable" />
        </Tabs>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {tab === 0 && <ThisTermTab student={selectedStudent} onSwitchTab={(i) => setTab(i)} />}
          {tab === 1 && <ResultsTab student={selectedStudent} />}
          {tab === 2 && <AttendanceTab studentId={selectedStudent.id} />}
          {tab === 3 && <FeesTab student={selectedStudent} />}
          {tab === 4 && <MessagesTab student={selectedStudent} user={user} />}
          {tab === 5 && <TimetableTab student={selectedStudent} />}
        </CardContent>
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Results Tab
// ─────────────────────────────────────────────────────────────────────────────
function ResultsTab({ student }) {
  // Use mock exams as fallback
  const mockPublished = MOCK_EXAMS.filter(e => e.status === "published");
  const examsQuery = useAsync(() => api.getExams({ status: "published" }).then(r => (r && r.length > 0 ? r : mockPublished)).catch(() => mockPublished), []);
  const examOptions = examsQuery.data ?? mockPublished;
  const [examId, setExamId] = useState("");
  const [reportCardOpen, setReportCardOpen] = useState(false);

  useEffect(() => {
    if (!examId && examOptions.length > 0) setExamId(String(examOptions[0].id));
  }, [examOptions, examId]);

  // Mock report card data
  const mockRC = useMemo(() => {
    if (!examId || !student) return null;
    const isCBC = student.curriculum === "CBC";
    const subjects844 = [
      { subjectId: "s1", subjectName: "English", marks: 72, outOf: 100, grade: "B+", teacherComment: "Good grasp of comprehension." },
      { subjectId: "s2", subjectName: "Kiswahili", marks: 68, outOf: 100, grade: "B", teacherComment: "Improvement noted this term." },
      { subjectId: "s3", subjectName: "Mathematics", marks: 81, outOf: 100, grade: "A-", teacherComment: "Excellent problem-solving skills." },
      { subjectId: "s4", subjectName: "Biology", marks: 65, outOf: 100, grade: "B", teacherComment: null },
      { subjectId: "s5", subjectName: "Physics", marks: 58, outOf: 100, grade: "C+", teacherComment: "Needs more practice on calculations." },
      { subjectId: "s6", subjectName: "Chemistry", marks: 62, outOf: 100, grade: "B-", teacherComment: null },
      { subjectId: "s7", subjectName: "History & Government", marks: 74, outOf: 100, grade: "B+", teacherComment: null },
      { subjectId: "s8", subjectName: "Geography", marks: 70, outOf: 100, grade: "B+", teacherComment: null },
    ];
    const subjectsCBC = [
      { subjectId: "c1", subjectName: "English", marks: 78, outOf: 100, grade: "A-", cbcRating: "ME", teacherComment: "Very expressive in written work." },
      { subjectId: "c2", subjectName: "Kiswahili", marks: 82, outOf: 100, grade: "A-", cbcRating: "EE", teacherComment: null },
      { subjectId: "c3", subjectName: "Mathematics", marks: 75, outOf: 100, grade: "A-", cbcRating: "ME", teacherComment: "Shows great understanding." },
      { subjectId: "c4", subjectName: "Science & Technology", marks: 69, outOf: 100, grade: "B+", cbcRating: "ME", teacherComment: null },
      { subjectId: "c5", subjectName: "Social Studies", marks: 71, outOf: 100, grade: "B+", cbcRating: "ME", teacherComment: null },
      { subjectId: "c6", subjectName: "Creative Arts", marks: 88, outOf: 100, grade: "A", cbcRating: "EE", teacherComment: "Outstanding creativity." },
    ];
    const subs = isCBC ? subjectsCBC : subjects844;
    const total = subs.reduce((s, x) => s + x.marks, 0);
    const avg = Math.round(total / subs.length);
    return {
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      className: student.className,
      curriculum: student.curriculum,
      term: 2, year: 2026,
      subjects: subs,
      totalMarks: total,
      average: avg,
      averageGrade: avg >= 80 ? "A" : avg >= 70 ? "B+" : avg >= 60 ? "B" : "C+",
      position: 4,
      classSize: 38,
      classTeacherComment: "A commendable performance this term. Continue with the same spirit.",
      principalComment: "Excellent progress. Keep up the hard work and aim even higher.",
      attendance: { daysPresent: 56, daysAbsent: 4, totalDays: 60 },
      nextTermBegins: "2026-09-02",
      closingDate: "2026-08-09",
    };
  }, [examId, student]);

  const rc = useAsync(
    () => (student?.id && examId ? api.getStudentReportCard(student.id, examId).then(r => (r ? r : mockRC)).catch(() => mockRC) : Promise.resolve(mockRC)),
    [student?.id, examId]
  );

  const data = rc.data || mockRC;

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 3, gap: 2 }}>
        <TextField select size="small" label="Exam Session" value={examId} onChange={(e) => setExamId(e.target.value)} sx={{ width: { xs: "100%", sm: 240 } }} disabled={examOptions.length === 0}>
          {examOptions.map((e) => <MenuItem key={e.id} value={String(e.id)}>{e.name}</MenuItem>)}
        </TextField>
        <Button variant="outlined" startIcon={<Print />} onClick={() => setReportCardOpen(true)} disabled={!data} sx={{ width: { xs: "100%", sm: "auto" } }}>
          Full Report Card
        </Button>
      </Box>

      {data ? (
        <>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell align="right">Marks</TableCell>
                <TableCell>Grade</TableCell>
                {student.curriculum === "CBC" && <TableCell>Rating</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.subjects.map((sub) => (
                <TableRow key={sub.subjectId}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{sub.subjectName}</Typography>
                    {sub.teacherComment && <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", display: "block" }}>{sub.teacherComment}</Typography>}
                  </TableCell>
                  <TableCell align="right">{sub.marks} / {sub.outOf}</TableCell>
                  <TableCell><GradeChip grade={sub.grade} /></TableCell>
                  {student.curriculum === "CBC" && <TableCell><CBCRatingChip rating={sub.cbcRating} /></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, md: 3 }}><StatItem label="Average" value={`${data.average}%`} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatItem label="Position" value={`${data.position} / ${data.classSize}`} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatItem label="Mean Grade" value={data.averageGrade || "B+"} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatItem label="Total Marks" value={data.totalMarks} /></Grid>
          </Grid>
          <Alert severity="info" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Class Teacher's Comment:</Typography>
            <Typography variant="body2">{data.classTeacherComment}</Typography>
          </Alert>
          <Alert severity="info" variant="outlined" icon={<CheckCircle />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Principal's Remarks:</Typography>
            <Typography variant="body2">{data.principalComment}</Typography>
          </Alert>
          <ReportCardDialog rc={data} open={reportCardOpen} onClose={() => setReportCardOpen(false)} />
        </>
      ) : (
        <Alert severity="info">No published exam results yet.</Alert>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Attendance Tab
// ─────────────────────────────────────────────────────────────────────────────
function AttendanceTab({ studentId }) {
  const year = new Date().getFullYear();
  const dateFrom = `${year}-01-01`;
  const dateTo = new Date().toISOString().slice(0, 10);

  // Build mock attendance for this student from the mock data
  const mockRecords = useMemo(() => {
    const base = MOCK_ATTENDANCE.filter(a => a.studentId === studentId);
    if (base.length > 0) return base;
    // generate plausible records if student not in mock data
    const records = [];
    let d = new Date("2026-05-15");
    for (let i = 0; i < 20; i++) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        const iso = d.toISOString().slice(0, 10);
        const r = Math.random();
        records.push({ id: `att-mock-${studentId}-${i}`, studentId, date: iso, status: r > 0.92 ? "absent" : r > 0.88 ? "late" : "present", reason: r > 0.92 ? "Sick" : undefined });
      }
      d.setDate(d.getDate() + 1);
    }
    return records;
  }, [studentId]);

  const att = useAsync(
    () => api.getStudentAttendance(studentId, dateFrom, dateTo).then(r => (r && r.length > 0 ? r : mockRecords)).catch(() => mockRecords),
    [studentId]
  );

  const records = att.data || mockRecords;

  const stats = useMemo(() => ({
    present: records.filter(r => r.status === "present").length,
    absent: records.filter(r => r.status === "absent").length,
    late: records.filter(r => r.status === "late").length,
    total: records.length,
  }), [records]);

  const attendanceRate = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;

  const monthlyData = useMemo(() => records.reduce((acc, r) => {
    const month = new Date(r.date).toLocaleString("default", { month: "long", year: "numeric" });
    if (!acc[month]) acc[month] = [];
    acc[month].push(r);
    return acc;
  }, {}), [records]);

  if (att.loading) return <DataState loading={true} data={null} children={<Box />} />;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}><PortalStatCard label="Present" value={stats.present} color="success.main" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><PortalStatCard label="Absent" value={stats.absent} color="error.main" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><PortalStatCard label="Late" value={stats.late} color="warning.main" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><PortalStatCard label="Attendance %" value={`${attendanceRate}%`} color="primary.main" /></Grid>
      </Grid>

      {attendanceRate < 75 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<WarningAmber />}>
          Attendance is below the required 75% threshold. Please contact the class teacher to discuss the reasons for absence.
        </Alert>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Monthly Breakdown</Typography>
      {Object.entries(monthlyData).map(([month, logs], idx) => (
        <Accordion key={month} defaultExpanded={idx === 0} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", pr: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{month}</Typography>
              <Typography variant="caption" color="text.secondary">
                {logs.filter(l => l.status === "present").length}/{logs.length} days present
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Table size="small">
              <TableBody>
                {logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell sx={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: l.status === "present" ? "success.main" : l.status === "absent" ? "error.main" : "warning.main" }} />
                        <Typography variant="body2">{formatDate(l.date)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid rgba(0,0,0,0.05)", textTransform: "capitalize" }}>{l.status}</TableCell>
                    <TableCell sx={{ borderBottom: "1px solid rgba(0,0,0,0.05)", color: "text.secondary" }}>{l.reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}
      {Object.keys(monthlyData).length === 0 && <Alert severity="info">No attendance records available.</Alert>}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fees Tab
// ─────────────────────────────────────────────────────────────────────────────
function FeesTab({ student }) {
  const mockInvoice = useMemo(() => {
    const charged = student.gradeLevel?.startsWith("Form") ? 18000 : 12500;
    const boardingExtra = student.boardingStatus === "boarding" ? 22000 : 0;
    const total = charged + boardingExtra;
    const paid = Math.max(0, total - student.feeBalance);
    return {
      totalCharged: total, totalPaid: paid, balance: student.feeBalance,
      dueDate: "2026-05-31",
      items: [
        { name: "Tuition", amount: charged - 3000 },
        { name: "Activity Fee", amount: 1500 },
        { name: "Exam Fee", amount: 1500 },
        ...(boardingExtra ? [{ name: "Boarding & Meals", amount: boardingExtra }] : []),
      ],
    };
  }, [student]);

  const inv = useAsync(() => api.getStudentInvoice(student.id).then(r => (r && r.totalCharged ? r : mockInvoice)).catch(() => mockInvoice), [student.id]);

  const mockPaymentsForStudent = useMemo(() => {
    const base = MOCK_PAYMENTS.filter(p => p.studentId === student.id);
    if (base.length > 0) return base.slice(0, 8);
    return [
      { id: "mp-1", receiptNumber: "RCP-2026-01023", paymentDate: "2026-06-10", paymentMethod: "mpesa", mpesaCode: "QGH2847561", amount: 15000 },
      { id: "mp-2", receiptNumber: "RCP-2026-00876", paymentDate: "2026-05-15", paymentMethod: "bank_transfer", amount: 10000 },
    ];
  }, [student.id]);

  const pays = useAsync(() => api.getPayments({ studentId: student.id }).then(r => (r && r.length > 0 ? r : mockPaymentsForStudent)).catch(() => mockPaymentsForStudent), [student.id]);

  const mockLevies = useMemo(() => {
    return MOCK_LEVIES.slice(0, 2).map((l, i) => ({ levy: l, paid: i === 1, receiptNumber: i === 1 ? "RCP-2026-00501" : null, paidAt: i === 1 ? "2026-06-01" : null }));
  }, []);

  const levies = useAsync(() => api.getStudentLevies(student.id).then(r => (r && r.length > 0 ? r : mockLevies)).catch(() => mockLevies), [student.id]);
  const [payInstructionsOpen, setPayInstructionsOpen] = useState(false);

  const invoice = inv.data || mockInvoice;

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,1fr)" }, gap: 2, mb: 3 }}>
        <Card variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">Charged</Typography><Typography variant="h6" sx={{ fontWeight: 800 }}>{formatKES(invoice.totalCharged)}</Typography></Card>
        <Card variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">Paid</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: "success.main" }}>{formatKES(invoice.totalPaid)}</Typography></Card>
        <Card variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">Balance</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: invoice.balance > 0 ? "error.dark" : "success.main" }}>{formatKES(invoice.balance)}</Typography></Card>
        <Card variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">Due Date</Typography><Typography variant="h6" sx={{ fontWeight: 800 }}>{formatDate(invoice.dueDate)}</Typography></Card>
      </Box>

      <Accordion variant="outlined" sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>View Detailed Fee Breakdown</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <Table size="small">
            <TableBody>
              {invoice.items.map((it) => (
                <TableRow key={it.name}>
                  <TableCell>{it.name}</TableCell>
                  <TableCell align="right">{formatKES(it.amount)}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 700 }}>Total Term Charge</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKES(invoice.totalCharged)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>

      <Card variant="outlined" sx={{ bgcolor: "primary.main", color: "white", p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Pay via M-Pesa Paybill</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Business No: <strong>522533</strong> | Account: <strong>{student.admissionNumber}</strong></Typography>
          </Box>
          <Button variant="contained" color="secondary" onClick={() => setPayInstructionsOpen(true)} sx={{ width: { xs: "100%", sm: "auto" } }}>Pay Now</Button>
        </Box>
      </Card>

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Special Levies & Ad-hoc Charges</Typography>
      {(levies.data || mockLevies).length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>No special charges at this time.</Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {(levies.data || mockLevies).map((sl) => (
            <Grid size={{ xs: 12, sm: 6 }} key={sl.levy?.id || sl.id}>
              <Card variant="outlined">
                <CardContent sx={{ pb: "16px !important" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Chip size="small" label={(sl.levy?.category || "general").toUpperCase()} icon={<Info fontSize="small" />} color="primary" variant="outlined" />
                    {sl.paid ? <Chip size="small" label="PAID ✓" color="success" /> : (
                      new Date() > new Date(sl.levy?.dueDate) ? <Chip size="small" label="OVERDUE" color="error" /> : <Chip size="small" label="UNPAID" color="warning" />
                    )}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{sl.levy?.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, height: 40, overflow: "hidden" }}>{sl.levy?.description}</Typography>
                  <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "flex-end" }, gap: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Due Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(sl.levy?.dueDate)}</Typography>
                    </Box>
                    <Typography variant="h6" color={sl.paid ? "success.main" : "error.main"} sx={{ fontWeight: 800 }}>{formatKES(sl.levy?.amount)}</Typography>
                  </Box>
                  {sl.paid && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>Receipt: {sl.receiptNumber} · Paid on {formatDate(sl.paidAt)}</Typography>}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Payment History</Typography>
      <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(pays.data || mockPaymentsForStudent).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{formatDate(p.paymentDate)}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>{(p.paymentMethod || "").replace("_", " ")}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.receiptNumber}</Typography>
                  {p.mpesaCode && <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{p.mpesaCode}</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKES(p.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <PayInstructionsDialog open={payInstructionsOpen} onClose={() => setPayInstructionsOpen(false)} student={student} />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Messages Tab
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_MESSAGES_PARENT = [
  { id: "msg-1", subject: "Term 2 Closing Date", body: "Dear parents, please note that the school will close for Term 2 on August 9th, 2026.", channel: "announcement", sentAt: "2026-06-10T10:00:00Z", status: "read", priority: "normal" },
  { id: "msg-2", subject: "Sports Day Notice", body: "All students are required to have their sports gear ready for the upcoming Sports Day on June 25th.", channel: "announcement", sentAt: "2026-06-11T09:00:00Z", status: "sent", priority: "normal" },
  { id: "msg-4", subject: "Fee Reminder", body: "Dear parent, this is a friendly reminder to clear the outstanding fee balance for your child.", channel: "direct", sentAt: "2026-06-12T10:00:00Z", status: "sent", priority: "normal" },
  { id: "msg-6", subject: "Early Closure Tomorrow", body: "Please note that the school will close at 12:30 PM tomorrow due to a scheduled staff meeting.", channel: "sms_alert", sentAt: "2026-06-12T14:00:00Z", status: "sent", priority: "urgent" },
];

function MessagesTab({ student, user }) {
  const { showNotification } = useNotification();
  const { data: messagesRes = [], loading, refetch } = useAsync(
    () => api.getParentMessages(student.id).then(r => (r && r.length > 0 ? r : MOCK_MESSAGES_PARENT)).catch(() => MOCK_MESSAGES_PARENT),
    [student.id]
  );
  const [replyTo, setReplyTo] = useState(null);
  const [replyBody, setReplyBody] = useState("");

  const messages = messagesRes || MOCK_MESSAGES_PARENT;

  const handleReply = async () => {
    if (!replyBody.trim() || !replyTo) return;
    try {
      await api.sendParentReply({ messageId: replyTo.id, studentName: `${student.firstName} ${student.lastName}`, parentName: user?.name ?? "Parent", body: replyBody });
    } catch {}
    showNotification("Reply sent to school office", "success");
    setReplyTo(null);
    setReplyBody("");
    refetch();
  };

  return (
    <Box>
      {loading ? <DataState loading={true} data={null} children={<Box />} /> : (
        <Stack spacing={2}>
          {messages.map(m => (
            <Card key={m.id} variant="outlined" sx={{ borderLeft: m.status !== "read" ? "4px solid" : "1px solid", borderColor: m.status !== "read" ? "primary.main" : "divider" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, gap: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", minWidth: 0 }}>
                    {m.status !== "read" && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />}
                    <Chip size="small" label={m.channel?.replace("_", " ").toUpperCase()} color={m.priority === "urgent" ? "error" : "default"} variant="outlined" sx={{ fontSize: 10 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{formatDate(m.sentAt)}</Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{m.subject}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>{m.body}</Typography>
                <Button variant="outlined" size="small" startIcon={<Chat />} onClick={() => { setReplyTo(m); }}>
                  Reply to Office
                </Button>
              </CardContent>
            </Card>
          ))}
          {messages.length === 0 && <Alert severity="info">No messages from school.</Alert>}
        </Stack>
      )}

      <Dialog open={!!replyTo} onClose={() => setReplyTo(null)} fullWidth maxWidth="xs">
        <DialogTitle>Reply to Office</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Subject: {replyTo?.subject}</Typography>
          <TextField label="Your Message" fullWidth multiline rows={4} size="small" value={replyBody} onChange={e => setReplyBody(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyTo(null)}>Cancel</Button>
          <Button variant="contained" startIcon={<Send />} onClick={handleReply} disabled={!replyBody.trim()}>Send Reply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Timetable Tab
// ─────────────────────────────────────────────────────────────────────────────
function TimetableTab({ student }) {
  const mockSlots = useMemo(() => {
    const tt = MOCK_TIMETABLES[student.classId];
    if (tt && tt.length > 0) return tt;
    // Fallback generic timetable
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = [["08:00","08:40"],["08:40","09:20"],["09:20","10:00"],["10:20","11:00"],["11:00","11:40"],["11:40","12:20"],["13:00","14:00"],["14:00","14:40"],["14:40","15:20"]];
    const subs844 = ["Mathematics","English","Kiswahili","Physics","Chemistry","Biology","History","Geography","C.R.E"];
    const subsCBC = ["Mathematics","English","Kiswahili","Science & Tech","Social Studies","Creative Arts","Agriculture","Religious Education","Mathematics"];
    const subjectList = student.curriculum === "CBC" ? subsCBC : subs844;
    const slots = [];
    days.forEach(day => {
      periods.forEach(([start, end], idx) => {
        const isBreak = start === "10:00" || start === "13:00";
        slots.push({
          id: `tt-${day}-${idx}`,
          classId: student.classId, day,
          periodNumber: idx + 1,
          startTime: start, endTime: end,
          isBreak,
          breakName: start === "10:00" ? "Morning Break" : start === "13:00" ? "Lunch Break" : null,
          subjectName: !isBreak ? subjectList[(idx + days.indexOf(day)) % subjectList.length] : null,
          teacherName: !isBreak ? "Ms. Grace Mwangi" : null,
        });
      });
    });
    return slots;
  }, [student]);

  const { data: slots = [], loading } = useAsync(
    () => api.getTimetable(student.classId).then(r => (r && r.length > 0 ? r : mockSlots)).catch(() => mockSlots),
    [student.classId]
  );

  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return ["Monday","Tuesday","Wednesday","Thursday","Friday"].includes(today) ? today : "Monday";
  });

  if (loading) return <DataState loading={true} data={null} children={<Box />} />;

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const slotList = slots || mockSlots;
  const slotsByDay = days.reduce((acc, d) => {
    acc[d] = slotList.filter(s => s.day === d).sort((a, b) => a.periodNumber - b.periodNumber);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ mb: 2, display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
        {days.map(d => (
          <Chip key={d} label={d.substring(0, 3)} onClick={() => setActiveDay(d)} color={activeDay === d ? "primary" : "default"} sx={{ flexShrink: 0 }} />
        ))}
      </Box>

      {/* Mobile / single-day view */}
      <Box sx={{ display: { xs: "block", md: "none" }, border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        {(slotsByDay[activeDay] || []).length > 0 ? (
          (slotsByDay[activeDay] || []).map(s => (
            <Box key={s.id} sx={{ p: 2, borderBottom: "1px solid rgba(0,0,0,0.1)", bgcolor: s.isBreak ? "action.hover" : "inherit", "&:last-child": { borderBottom: 0 } }}>
              <Typography variant="caption" color="text.secondary">{s.startTime} - {s.endTime}</Typography>
              {s.isBreak ? (
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{s.breakName}</Typography>
              ) : (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{s.subjectName}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.teacherName}</Typography>
                </>
              )}
            </Box>
          ))
        ) : (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">No lessons today</Typography>
          </Box>
        )}
      </Box>

      {/* Desktop table view */}
      <TableContainer sx={{ display: { xs: "none", md: "block" }, border: 1, borderColor: "divider", borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell>Time</TableCell>
              {days.map(d => (
                <TableCell key={d} align="center" sx={{ fontWeight: 700, bgcolor: d === activeDay ? "primary.main" : "inherit", color: d === activeDay ? "white" : "inherit" }}>{d}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 9 }).map((_, periodIdx) => {
              const periodNum = periodIdx + 1;
              const anySlot = slotList.find(s => s.periodNumber === periodNum);
              if (!anySlot) return null;
              return (
                <TableRow key={periodNum}>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>
                    <Typography variant="body2">{anySlot.startTime} - {anySlot.endTime}</Typography>
                    <Typography variant="caption" color="text.secondary">Period {periodNum}</Typography>
                  </TableCell>
                  {days.map(d => {
                    const slot = slotList.find(s => s.day === d && s.periodNumber === periodNum);
                    if (!slot) return <TableCell key={d} />;
                    if (slot.isBreak) return <TableCell key={d} sx={{ bgcolor: "action.hover", textAlign: "center", fontWeight: 700 }}>{slot.breakName}</TableCell>;
                    return (
                      <TableCell key={d} align="center" sx={{ bgcolor: d === activeDay ? "primary.main" + "08" : "inherit" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{slot.subjectName}</Typography>
                        <Typography variant="caption" color="text.secondary">{slot.teacherName}</Typography>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// This Term Tab
// ─────────────────────────────────────────────────────────────────────────────
function ThisTermTab({ student, onSwitchTab }) {
  const school = SCHOOL_FALLBACK;
  const currentTerm = school.currentTerm;
  const currentYear = school.currentYear;
  const termStartDate = school.termStartDate;
  const termEndDate = school.termEndDate;

  const mockPublished = MOCK_EXAMS.filter(e => e.status !== "upcoming");
  const examsQuery = useAsync(
    () => api.getExams({ status: "published" }).then(r => (r && r.length > 0 ? r : mockPublished)).catch(() => mockPublished),
    []
  );
  const examEvents = examsQuery.data ?? mockPublished;

  const mockLeviesRaw = MOCK_LEVIES.slice(0, 3);
  const levies = useAsync(
    () => api.getStudentLevies(student.id).then(r => (r && r.length > 0 ? r : mockLeviesRaw.map(l => ({ levy: l, paid: false })))).catch(() => mockLeviesRaw.map(l => ({ levy: l, paid: false }))),
    [student.id]
  );

  const daysRemaining = useMemo(() => {
    const diff = new Date(termEndDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [termEndDate]);

  const termProgress = useMemo(() => {
    const start = new Date(termStartDate).getTime();
    const end = new Date(termEndDate).getTime();
    const today = new Date().getTime();
    return Math.min(100, Math.max(0, ((today - start) / (end - start)) * 100));
  }, [termStartDate, termEndDate]);

  const unpaidLevies = useMemo(() => {
    const list = (levies.data ?? []).filter(l => !l.paid && !l.waived);
    return { count: list.length, total: list.reduce((sum, l) => sum + (l.levy?.amount || 0), 0) };
  }, [levies.data]);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return examEvents.filter(e => (e.endDate || e.startDate) >= today);
  }, [examEvents]);

  return (
    <Box>
      {/* Term overview */}
      <Card variant="outlined" sx={{ mb: 3, bgcolor: "primary.main", color: "white" }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "inherit" }}>Term {currentTerm}, {currentYear}</Typography>
              <Typography variant="body2" sx={{ color: "inherit", opacity: 0.9 }}>{formatDate(termStartDate)} — {formatDate(termEndDate)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: { sm: "right" } }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "inherit" }}>{daysRemaining} Days Left</Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: "inherit", opacity: 0.8 }}>Term Progress</Typography>
              <Typography variant="caption" sx={{ color: "inherit", opacity: 0.8 }}>{Math.round(termProgress)}%</Typography>
            </Box>
            <Box sx={{ height: 8, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 4 }}>
              <Box sx={{ height: "100%", width: `${termProgress}%`, bgcolor: "common.white", borderRadius: 4 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Exam schedule */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Exam Schedule</Typography>
          <Stack spacing={2} sx={{ mb: 4 }}>
            {examEvents.length === 0 && <Typography variant="body2" color="text.secondary">No published exams for this term yet.</Typography>}
            {MOCK_EXAMS.map(examEvent => {
              const today = new Date().toISOString().split("T")[0];
              const startDate = examEvent.startDate;
              const endDate = examEvent.endDate || examEvent.startDate;
              const isUpcoming = startDate > today;
              const isOngoing = today >= startDate && today <= endDate;
              return (
                <Card key={examEvent.id} variant="outlined">
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "flex-start" }, gap: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{examEvent.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {startDate !== endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : formatDate(startDate)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: { xs: "left", sm: "right" }, width: { xs: "100%", sm: "auto" } }}>
                        {isUpcoming ? (
                          <Chip label="Upcoming" size="small" color="info" sx={{ fontWeight: 700 }} />
                        ) : isOngoing ? (
                          <Chip label="Ongoing" size="small" color="warning" sx={{ fontWeight: 700 }} />
                        ) : (
                          <Stack spacing={1} direction={{ xs: "row", sm: "column" }} alignItems={{ xs: "center", sm: "flex-end" }}>
                            <Chip label="Results Available" size="small" color="success" sx={{ fontWeight: 700 }} />
                            <Button size="small" onClick={() => onSwitchTab(1)}>View Full Results</Button>
                          </Stack>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          {/* Quick actions */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Quick Actions</Typography>
          <Grid container spacing={2}>
            {[
              { label: "View Report Card", icon: <Print />, tab: 1 },
              { label: "Attendance History", icon: <EventAvailable />, tab: 2 },
              { label: "Pay Fees", icon: <Payments />, tab: 3 },
              { label: "Term Timetable", icon: <AccessTime />, tab: 5 },
            ].map(action => (
              <Grid size={{ xs: 6 }} key={action.label}>
                <Button fullWidth variant="outlined" startIcon={action.icon} onClick={() => onSwitchTab(action.tab)} sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}>
                  {action.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          {/* Coming up */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Coming Up</Typography>
          <List sx={{ bgcolor: "background.paper", borderRadius: 2, border: 1, borderColor: "divider", mb: 3 }}>
            {upcomingEvents.map((e, idx) => (
              <Box key={e.id}>
                <ListItem sx={{ py: 1.5 }}>
                  <Box sx={{ minWidth: 60, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", display: "block", lineHeight: 1 }}>
                      {new Date(e.startDate).toLocaleString("default", { month: "short" }).toUpperCase()}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>{new Date(e.startDate).getDate()}</Typography>
                  </Box>
                  <ListItemText
                    primary={<Typography variant="body2" sx={{ fontWeight: 800 }}>{e.name}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">EXAM</Typography>}
                  />
                </ListItem>
                {idx < upcomingEvents.length - 1 && <Divider />}
              </Box>
            ))}
            {upcomingEvents.length === 0 && <ListItem><ListItemText secondary="No upcoming events" /></ListItem>}
          </List>

          {/* Fees alert */}
          {unpaidLevies.count > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }} action={<Button size="small" color="inherit" onClick={() => onSwitchTab(3)}>View</Button>}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Unpaid Levies</Typography>
              <Typography variant="body2">You have {unpaidLevies.count} unpaid special levies totaling {formatKES(unpaidLevies.total)}.</Typography>
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared small components
// ─────────────────────────────────────────────────────────────────────────────
function StatItem({ label, value }) {
  return (
    <Card variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{value}</Typography>
    </Card>
  );
}

function PortalStatCard({ label, value, color }) {
  return (
    <Card variant="outlined" sx={{ p: 1.5, textAlign: "center", borderTop: "4px solid", borderTopColor: color }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>{value}</Typography>
    </Card>
  );
}

function PayInstructionsDialog({ open, onClose, student }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>How to Pay School Fees via M-Pesa</DialogTitle>
      <DialogContent>
        <List sx={{ pt: 0 }}>
          <ListItem><ListItemText primary="1. Go to M-PESA menu and select Lipa na M-PESA" secondary="Select Paybill" /></ListItem>
          <ListItem><ListItemText primary="2. Enter Business Number: 522533" secondary="Primrose Academy Treasury" /></ListItem>
          <ListItem><ListItemText primary="3. Enter Account Number" secondary={<strong>{student.admissionNumber}</strong>} /></ListItem>
          <ListItem><ListItemText primary="4. Enter the Amount and your M-PESA PIN" /></ListItem>
        </List>
        <Alert severity="info" sx={{ mt: 1 }}>Once paid, you will receive a confirmation SMS. The balance will update on this portal within 24 hours.</Alert>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>Understood</Button>
      </DialogActions>
    </Dialog>
  );
}

function ReportCardDialog({ rc, open, onClose }) {
  if (!rc) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        <Box className="printable">
          <Letterhead title={`Report Card — Term ${rc.term}, ${rc.year}`} />
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
            <Typography variant="body2"><strong>Name:</strong> {rc.studentName}</Typography>
            <Typography variant="body2"><strong>Adm No:</strong> {rc.admissionNumber}</Typography>
            <Typography variant="body2"><strong>Class:</strong> {rc.className}</Typography>
            <Typography variant="body2"><strong>Position:</strong> {rc.position} / {rc.classSize}</Typography>
          </Box>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell align="right">Marks</TableCell>
                <TableCell>Grade</TableCell>
                {rc.curriculum === "CBC" && <TableCell>CBC</TableCell>}
                <TableCell>Remark</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rc.subjects.map(s => (
                <TableRow key={s.subjectId}>
                  <TableCell>{s.subjectName}</TableCell>
                  <TableCell align="right">{s.marks} / {s.outOf}</TableCell>
                  <TableCell><GradeChip grade={s.grade} /></TableCell>
                  {rc.curriculum === "CBC" && <TableCell><CBCRatingChip rating={s.cbcRating} /></TableCell>}
                  <TableCell>{s.teacherComment ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
            <Typography variant="body2"><strong>Total:</strong> {rc.totalMarks}</Typography>
            <Typography variant="body2"><strong>Average:</strong> {rc.average}%</Typography>
            <Typography variant="body2"><strong>Attendance:</strong> {rc.attendance?.daysPresent}/{rc.attendance?.totalDays} days</Typography>
          </Box>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Class Teacher:</strong> {rc.classTeacherComment}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}><strong>Principal:</strong> {rc.principalComment}</Typography>
          <Typography variant="caption" color="text.secondary">Closing date: {rc.closingDate} · Next term begins: {rc.nextTermBegins}</Typography>
        </Box>
      </DialogContent>
      <DialogActions className="no-print" sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<Print />} onClick={() => window.print()}>Print</Button>
      </DialogActions>
    </Dialog>
  );
}
