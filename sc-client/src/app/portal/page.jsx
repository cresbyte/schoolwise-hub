"use client";

import { Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Badge, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, List, ListItem, ListItemText, MenuItem, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { AccessTime, Chat, CheckCircle, EventAvailable, ExpandMore, Info, Payments, Print, Send, WarningAmber } from "@mui/icons-material";


import { CBCRatingChip } from "@/components/CBCRatingChip";
import { DataState } from "@/components/DataState";
import { GradeChip } from "@/components/GradeChip";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { Letterhead } from "@/components/Letterhead";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useAsync } from "@/hooks/useAsync";
import { useExams, useSchool, useStudentAttendance, useStudentReportCard } from "@/hooks/domain";
import { api } from "@/lib/api";
import { school as SCHOOL_FALLBACK } from "@/lib/mockData";
import { formatDate, formatKES, getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
        <Button
          variant="contained"
          onClick={() => router.push("/dashboard")}
        >
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  const { data: students = [], loading: loadingStudents, error: studentsError } = useAsync(() => api.getStudents(), [user?.id]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const selectedStudent = useMemo(() => (students || []).find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  const unreadMessages = useAsync(async () => {
    if (!selectedStudentId) return [];
    const msgs = await api.getParentMessages(selectedStudentId);
    return msgs.filter(m => m.status !== "read");
  }, [selectedStudentId]);

  if (loadingStudents) return <DataState loading={true} data={null} error={null} children={<Box />} />;
  if (studentsError) return <DataState loading={false} data={null} error={studentsError} children={<Box />} />;
  if (!selectedStudent) return <Alert severity="info">No children linked to your account.</Alert>;

  const studentList = students || [];

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>My Children</Typography>
            {studentList.length > 1 && (
              <Box sx={{ display: "flex", gap: 1 }}>
                {studentList.map(s => (
                  <Chip
                    key={s.id}
                    label={s.firstName}
                    onClick={() => setSelectedStudentId(s.id)}
                    color={selectedStudentId === s.id ? "primary" : "default"}
                    sx={{ fontWeight: 600 }}
                    avatar={
                      <Avatar
                        src={s.avatarUrl}
                        sx={{ width: 24, height: 24 }}
                      >
                        {getInitials(s.firstName)}
                      </Avatar>
                    }
                  />
                ))}
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Avatar
              src={selectedStudent.avatarUrl}
              sx={{ width: 64, height: 64, bgcolor: "primary.main" }}
            >
              {getInitials(`${selectedStudent.firstName} ${selectedStudent.lastName}`)}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{selectedStudent.firstName} {selectedStudent.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedStudent.className} · {selectedStudent.admissionNumber}</Typography>
              <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                <Chip size="small" label={selectedStudent.curriculum} variant="outlined" />
                <Chip size="small" label={selectedStudent.boardingStatus === 'day' ? 'Day Scholar' : 'Boarder'} variant="outlined" />
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

      <Card>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
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
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
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

function ResultsTab({ student }) {
  const exams = useExams({ status: "published" });
  const examOptions = exams.data ?? [];
  const [examId, setExamId] = useState("");

  useEffect(() => {
    if (!examId && examOptions.length > 0) {
      setExamId(String(examOptions[0].id));
    }
  }, [examOptions, examId]);

  const rc = useStudentReportCard(student.id, examId);
  const [reportCardOpen, setReportCardOpen] = useState(false);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <TextField select size="small" label="Exam Session" value={examId} onChange={(e) => setExamId(e.target.value)} sx={{ width: 240 }} disabled={examOptions.length === 0}>
          {examOptions.map((e) => <MenuItem key={e.id} value={String(e.id)}>{e.name}</MenuItem>)}
        </TextField>
        <Button variant="outlined" startIcon={<Print />} onClick={() => setReportCardOpen(true)} disabled={!rc.data}>
          Full Report Card
        </Button>
      </Box>

      <DataState loading={rc.loading || exams.loading} error={rc.error || exams.error} data={rc.data} isEmpty={() => examOptions.length === 0} emptyMessage="No published exam results yet.">
        {(r) => (
          <>
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead><TableRow><TableCell>Subject</TableCell><TableCell align="right">Marks</TableCell><TableCell>Grade</TableCell>{student.curriculum === "CBC" && <TableCell>Rating</TableCell>}</TableRow></TableHead>
              <TableBody>
                {r.subjects.map((sub) => (
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
              <Grid size={{ xs: 6, md: 3 }}><StatItem label="Average" value={`${r.average}%`} /></Grid>
              <Grid size={{ xs: 6, md: 3 }}><StatItem label="Position" value={`${r.position} / ${r.classSize}`} /></Grid>
              <Grid size={{ xs: 6, md: 3 }}><StatItem label="Mean Grade" value={r.averageGrade || "B"} /></Grid>
              <Grid size={{ xs: 6, md: 3 }}><StatItem label="Total Marks" value={r.totalMarks} /></Grid>
            </Grid>
            <Alert severity="info" slot="icon" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Class Teacher's Comment:</Typography>
              <Typography variant="body2">{r.classTeacherComment}</Typography>
            </Alert>
            <Alert severity="info" variant="outlined" icon={<CheckCircle />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Principal's Remarks:</Typography>
              <Typography variant="body2">{r.principalComment}</Typography>
            </Alert>

            <ReportCardDialog rc={r} open={reportCardOpen} onClose={() => setReportCardOpen(false)} />
          </>
        )}
      </DataState>
    </Box>
  );
}

function AttendanceTab({ studentId }) {
  const year = new Date().getFullYear();
  const dateFrom = `${year}-01-01`;
  const dateTo = new Date().toISOString().slice(0, 10);
  const att = useStudentAttendance(studentId, dateFrom, dateTo);

  return (
    <DataState loading={att.loading} error={att.error} data={att.data} isEmpty={(d) => d.length === 0} emptyMessage="No attendance records available.">
      {(records) => {
        const stats = {
          present: records.filter((r) => r.status === "present").length,
          absent: records.filter((r) => r.status === "absent").length,
          late: records.filter((r) => r.status === "late").length,
          total: records.length,
        };
        const attendanceRate = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;

        const monthlyData = (records || []).reduce((acc, r) => {
          const month = new Date(r.date).toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!acc[month]) acc[month] = [];
          acc[month].push(r);
          return acc;
        }, {});

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
                      {logs.filter((l) => l.status === 'present').length}/{logs.length} days present
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Table size="small">
                    <TableBody>
                      {logs.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: l.status === 'present' ? 'success.main' : l.status === 'absent' ? 'error.main' : 'warning.main' }} />
                              <Typography variant="body2">{formatDate(l.date)}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)', textTransform: 'capitalize' }}>{l.status}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'text.secondary' }}>{l.reason || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        );
      }}
    </DataState>
  );
}

function FeesTab({ student }) {
  const inv = useAsync(() => api.getStudentInvoice(student.id), [student.id]);
  const pays = useAsync(() => api.getPayments({ studentId: student.id }), [student.id]);
  const levies = useAsync(() => api.getStudentLevies(student.id), [student.id]);
  const [payInstructionsOpen, setPayInstructionsOpen] = useState(false);

  return (
    <Box>
      <DataState loading={inv.loading} error={inv.error} data={inv.data}>
        {(i) => (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,1fr)" }, gap: 2, mb: 3 }}>
              <Card variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">Charged</Typography><Typography variant="h6" sx={{ fontWeight: 800 }}>{formatKES(i.totalCharged)}</Typography></Card>
              <Card variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">Paid</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: "success.main" }}>{formatKES(i.totalPaid)}</Typography></Card>
              <Card variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">Balance</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: i.balance > 0 ? "error.dark" : "success.main" }}>{formatKES(i.balance)}</Typography></Card>
              <Card variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">Due Date</Typography><Typography variant="h6" sx={{ fontWeight: 800 }}>{formatDate(i.dueDate)}</Typography></Card>
            </Box>

            <Accordion variant="outlined" sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>View Detailed Fee Breakdown</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Table size="small">
                  <TableBody>
                    {i.items.map((it) => (
                      <TableRow key={it.name}>
                        <TableCell>{it.name}</TableCell>
                        <TableCell align="right">{formatKES(it.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Total Term Charge</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKES(i.totalCharged)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>

            <Card variant="outlined" sx={{ bgcolor: "primary.main", color: "white", p: 2, mb: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Pay via M-Pesa Paybill</Typography>
                  <Typography variant="body2">Business No: <strong>522533</strong> | Account: <strong>{student.admissionNumber}</strong></Typography>
                </Box>
                <Button variant="contained" color="secondary" onClick={() => setPayInstructionsOpen(true)}>Pay Now</Button>
              </Box>
            </Card>

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Special Levies & Ad-hoc Charges</Typography>
            <DataState loading={levies.loading} data={levies.data} error={null} isEmpty={(d) => d.length === 0} emptyMessage="No special charges at this time.">
              {(lList) => (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {lList.map((sl) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={sl.levy.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: "16px !important" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Chip size="small" label={sl.levy.category.toUpperCase()} icon={<Info fontSize="small" />} color="primary" variant="outlined" />
                            {sl.paid ? <Chip size="small" label="PAID ✓" color="success" /> : (
                              new Date() > new Date(sl.levy.dueDate) ? <Chip size="small" label="OVERDUE" color="error" /> : <Chip size="small" label="UNPAID" color="warning" />
                            )}
                          </Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{sl.levy.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, height: 40, overflow: "hidden" }}>{sl.levy.description}</Typography>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Due Date</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(sl.levy.dueDate)}</Typography>
                            </Box>
                            <Typography variant="h6" color={sl.paid ? "success.main" : "error.main"} sx={{ fontWeight: 800 }}>{formatKES(sl.levy.amount)}</Typography>
                          </Box>
                          {sl.paid && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>Receipt: {sl.receiptNumber} · Paid on {formatDate(sl.paidAt)}</Typography>}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </DataState>

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Payment History</Typography>
            <DataState loading={pays.loading} data={pays.data} error={null}>
              {(payments) => (
                <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Reference</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(payments || []).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatDate(p.paymentDate)}</TableCell>
                          <TableCell sx={{ textTransform: "capitalize" }}>{p.paymentMethod.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.receiptNumber}</Typography>
                            {p.mpesaCode && <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{p.mpesaCode}</Typography>}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKES(p.amount)}</TableCell>
                          <TableCell align="right"><IconButton size="small"><Print fontSize="small" /></IconButton></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataState>
          </>
        )}
      </DataState>

      <PayInstructionsDialog open={payInstructionsOpen} onClose={() => setPayInstructionsOpen(false)} student={student} />
    </Box>
  );
}

function MessagesTab({ student, user }) {
  const { showNotification } = useNotification();
  const { data: messagesRes = [], loading, refetch } = useAsync(() => api.getParentMessages(student.id), [student.id]);
  const [replyTo, setReplyTo] = useState(null);
  const [replyBody, setReplyBody] = useState("");

  const messages = messagesRes || [];

  const handleReply = async () => {
    if (!replyBody.trim() || !replyTo) return;
    await api.sendParentReply({
      messageId: replyTo.id,
      studentName: `${student.firstName} ${student.lastName}`,
      parentName: user?.name ?? "Parent",
      body: replyBody
    });
    showNotification("Reply sent to school office", "success");
    setReplyTo(null);
    setReplyBody("");
    refetch();
  };

  return (
    <Box>
      <DataState loading={loading} error={null} data={messages} isEmpty={(d) => d.length === 0} emptyMessage="No messages from school">
        {(list) => (
          <Stack spacing={2}>
            {list.map((m) => (
              <Card key={m.id} variant="outlined" sx={{ borderLeft: m.status !== 'read' ? '4px solid' : '1px solid', borderColor: m.status !== 'read' ? 'primary.main' : 'divider' }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      {m.status !== 'read' && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />}
                      <Typography variant="subtitle2" color="primary">{m.channel.replace('_', ' ').toUpperCase()}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{formatDate(m.sentAt)}</Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{m.subject}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>{m.body}</Typography>
                  <Button variant="outlined" size="small" startIcon={<Chat />} onClick={() => { setReplyTo(m); if (m.status !== 'read') api.markMessageRead(m.id).then(() => refetch()); }}>
                    Reply to Office
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </DataState>

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

function TimetableTab({ student }) {
  const { data: slots = [], loading } = useAsync(() => api.getTimetable(student.classId), [student.classId]);
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(today) ? today : "Monday";
  });

  if (loading) return <DataState loading={true} data={null} children={<Box />} />;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slotList = slots || [];

  const slotsByDay = days.reduce((acc, d) => {
    acc[d] = slotList.filter(s => s.day === d).sort((a, b) => a.periodNumber - b.periodNumber);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ mb: 2, display: { xs: "flex", md: "none" }, gap: 1, overflowX: "auto", pb: 1 }}>
        {days.map(d => (
          <Chip key={d} label={d.substring(0, 3)} onClick={() => setActiveDay(d)} color={activeDay === d ? "primary" : "default"} />
        ))}
      </Box>

      {/* Mobile View */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, border: 1, borderColor: "divider", borderRadius: 2, overflow: 'hidden' }}>
        {slotsByDay[activeDay]?.length > 0 ? (
          slotsByDay[activeDay].map((s) => (
            <Box key={s.id} sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.1)', bgcolor: s.isBreak ? 'action.hover' : 'inherit', '&:last-child': { borderBottom: 0 } }}>
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
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No lessons today</Typography>
          </Box>
        )}
      </Box>

      {/* Desktop View */}
      <TableContainer sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: "divider", borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell>Time</TableCell>
              {days.map(d => (
                <TableCell key={d} align="center" sx={{ fontWeight: 700, bgcolor: d === activeDay ? 'primary.main' : 'inherit', color: d === activeDay ? 'white' : 'inherit' }}>
                  {d}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 9 }).map((_, periodIdx) => {
              const periodNum = periodIdx + 1;
              const anySlotAtThisTime = slotList.find(s => s.periodNumber === periodNum);
              if (!anySlotAtThisTime) return null;

              return (
                <TableRow key={periodNum}>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>
                    <Typography variant="body2">{anySlotAtThisTime.startTime} - {anySlotAtThisTime.endTime}</Typography>
                    <Typography variant="caption" color="text.secondary">Period {periodNum}</Typography>
                  </TableCell>
                  {days.map(d => {
                    const slot = slotList.find(s => s.day === d && s.periodNumber === periodNum);
                    if (!slot) return <TableCell key={d} />;
                    if (slot.isBreak) return <TableCell key={d} sx={{ bgcolor: "action.hover", textAlign: "center", fontWeight: 700 }}>{slot.breakName}</TableCell>;
                    return (
                      <TableCell key={d} align="center" sx={{ bgcolor: d === activeDay ? 'primary.main' + '08' : 'inherit' }}>
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
    <Card variant="outlined" sx={{ p: 1.5, textAlign: "center", borderTop: `4px solid`, borderTopColor: color }}>
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
              {rc.subjects.map((s) => (
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
            <Typography variant="body2"><strong>Attendance:</strong> {rc.attendance.daysPresent}/{rc.attendance.totalDays} days</Typography>
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

function ThisTermTab({ student, onSwitchTab }) {
  const schoolQuery = useSchool();
  const examsQuery = useExams({ status: "published" });
  const levies = useAsync(() => api.getStudentLevies(student.id), [student.id]);

  const school = schoolQuery.data || SCHOOL_FALLBACK;
  const currentTerm = school.current_term ?? school.currentTerm ?? SCHOOL_FALLBACK.currentTerm;
  const currentYear = school.current_year ?? school.currentYear ?? SCHOOL_FALLBACK.currentYear;
  const termStartDate = school.termStartDate || SCHOOL_FALLBACK.termStartDate;
  const termEndDate = school.termEndDate || SCHOOL_FALLBACK.termEndDate;
  const examEvents = examsQuery.data ?? [];

  const daysRemaining = useMemo(() => {
    const end = new Date(termEndDate);
    const today = new Date();
    const diff = end.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [termEndDate]);

  const termProgress = useMemo(() => {
    const start = new Date(termStartDate).getTime();
    const end = new Date(termEndDate).getTime();
    const today = new Date().getTime();
    const progress = ((today - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [termStartDate, termEndDate]);

  const unpaidLevies = useMemo(() => {
    const list = (levies.data ?? []).filter(l => !l.paid && !l.waived);
    return {
      count: list.length,
      total: list.reduce((sum, l) => sum + l.levy.amount, 0)
    };
  }, [levies.data]);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return examEvents.filter(e => (e.endDate || e.startDate) >= today);
  }, [examEvents]);

  return (
    <Box>
      <DataState loading={examsQuery.loading} data={examEvents} error={examsQuery.error}>
        {() => (
          <>
            {/* Term Overview */}
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
                    <Box sx={{ height: "100%", width: `${termProgress}%`, bgcolor: "common.white", borderRadius: 4,  }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 7 }}>
                {/* Exam Schedule */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Exam Schedule</Typography>
                <Stack spacing={2} sx={{ mb: 4 }}>
                  {examEvents.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No published exams for this term yet.</Typography>
                  )}
                  {examEvents.map(examEvent => {
                    const today = new Date().toISOString().split('T')[0];
                    const startDate = examEvent.startDate;
                    const endDate = examEvent.endDate || examEvent.startDate;
                    const isUpcoming = startDate > today;
                    const isOngoing = today >= startDate && today <= endDate;

                    return (
                      <Card key={examEvent.id} variant="outlined">
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{examEvent.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {startDate !== endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : formatDate(startDate)}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: "right" }}>
                              {isUpcoming ? (
                                <Chip label="Upcoming" size="small" color="info" sx={{ fontWeight: 700 }} />
                              ) : isOngoing ? (
                                <Chip label="Ongoing" size="small" color="warning" sx={{ fontWeight: 700 }} />
                              ) : (
                                <Stack spacing={1}>
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

                {/* Quick Actions */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Quick Actions</Typography>
                <Grid container spacing={2}>
                  {[
                    { label: "View Report Card", icon: <Print />, tab: 1 },
                    { label: "Attendance History", icon: <EventAvailable />, tab: 2 },
                    { label: "Pay Fees", icon: <Payments />, tab: 3 },
                    { label: "Term Timetable", icon: <AccessTime />, tab: 5 },
                  ].map(action => (
                    <Grid size={{ xs: 6 }} key={action.label}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={action.icon}
                        onClick={() => onSwitchTab(action.tab)}
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                      >
                        {action.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                {/* Calendar Strip */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Coming Up</Typography>
                <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 2, mb: 1 }}>
                  {upcomingEvents.map(e => (
                    <Chip
                      key={e.id}
                      label={e.name}
                      size="small"
                      variant="outlined"
                      sx={{ flexShrink: 0, fontWeight: 600 }}
                    />
                  ))}
                </Box>

                <List sx={{ bgcolor: "background.paper", borderRadius: 2, border: 1, borderColor: "divider" }}>
                  {upcomingEvents.map((e, idx) => (
                    <Box key={e.id}>
                      <ListItem sx={{ py: 1.5 }}>
                        <Box sx={{ minWidth: 60, textAlign: "center" }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", display: "block", lineHeight: 1 }}>
                            {new Date(e.startDate).toLocaleString('default', { month: 'short' }).toUpperCase()}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                            {new Date(e.startDate).getDate()}
                          </Typography>
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

                {/* Fees Alert */}
                {unpaidLevies.count > 0 && (
                  <Alert
                    severity="warning"
                    sx={{ mt: 3, borderRadius: 2 }}
                    action={<Button size="small" color="inherit" onClick={() => onSwitchTab(3)}>View</Button>}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Unpaid Levies</Typography>
                    <Typography variant="body2">You have {unpaidLevies.count} unpaid special levies totaling {formatKES(unpaidLevies.total)}.</Typography>
                  </Alert>
                )}
              </Grid>
            </Grid>
          </>
        )}
      </DataState>
    </Box>
  );
}
