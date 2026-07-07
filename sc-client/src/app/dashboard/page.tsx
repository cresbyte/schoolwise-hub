"use client";

/**
 * Admin / headteacher dashboard with KPIs, charts and tables.
 * @module dashboard/page
 */
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import PeopleIcon from "@mui/icons-material/People";
import BadgeIcon from "@mui/icons-material/Badge";
import PaymentsIcon from "@mui/icons-material/Payments";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import WarningIcon from "@mui/icons-material/Warning";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DescriptionIcon from "@mui/icons-material/Description";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { PageGuard } from "@/components/common/PageGuard";
import { StatCard } from "@/components/StatCard";
import { DataState } from "@/components/DataState";
import { useStudents, useStaff, useFees, useClasses } from "@/hooks/domain";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { formatKES, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { Student, Staff, ClassRoom, TeacherClassSummary } from "@/lib/types";

export default function DashboardPage() {
  const { hasAnyRole } = useAuth();

  const isSenior = hasAnyRole(["admin", "headteacher", "accountant"]);

  return (
    <DashboardLayout>
      <PageGuard permission="reports.view">
        {isSenior ? <DashboardContent /> : <TeacherDashboard />}
      </PageGuard>
    </DashboardLayout>
  );
}

const PIE_COLORS = ["#1565C0", "#F57F17", "#2E7D32", "#6A1B9A", "#0288D1", "#C62828", "#5E35B1", "#00838F"];

const COLLECTION_TREND = [
  { month: "Jan", mpesa: 420000, cash: 130000, bank: 90000, target: 700000 },
  { month: "Feb", mpesa: 480000, cash: 110000, bank: 120000, target: 700000 },
  { month: "Mar", mpesa: 510000, cash: 95000, bank: 140000, target: 700000 },
  { month: "Apr", mpesa: 460000, cash: 120000, bank: 110000, target: 700000 },
  { month: "May", mpesa: 540000, cash: 105000, bank: 160000, target: 700000 },
  { month: "Jun", mpesa: 380000, cash: 90000, bank: 130000, target: 700000 },
];

/** Dashboard content. */
function DashboardContent() {
  const router = useRouter();
  const students = useStudents();
  const staff = useStaff();
  const fees = useFees();
  const classes = useClasses();
  const payments = useAsync(() => api.getPayments(), []);
  const exams = useAsync(() => api.getExams({ status: "upcoming" }), []);
  const pendingEvents = useAsync(() => api.getPendingTermEventCount(), []);

  const studentList = students.data ?? [];
  const boarding = studentList.filter((s: any) => s.boardingStatus === "boarding").length;
  const onLeave = (staff.data ?? []).filter((s: any) => s.status === "on_leave").length;
  const enrollment = (classes.data ?? []).map((c: any) => ({ name: c.name, value: c.studentCount || c.capacity }));
  const nextExam = exams.data?.[0];
  const daysToExam = nextExam ? Math.max(0, Math.ceil((new Date(nextExam.startDate).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Primrose Private Academy · Term 2, 2026" />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, mb: 3 }}>
        <StatCard
          icon={<PeopleIcon />}
          label="Total Students"
          value={students.loading ? "…" : studentList.length}
          footer={<Chip size="small" label={`${studentList.length - boarding} day · ${boarding} boarding`} sx={{ fontSize: 11 }} />}
        />
        <StatCard
          icon={<BadgeIcon />}
          color="#6A1B9A"
          label="Total Staff"
          value={staff.loading ? "…" : (staff.data ?? []).length}
          footer={<Chip size="small" color="warning" label={`${onLeave} on leave`} sx={{ fontSize: 11 }} />}
        />
        <StatCard
          icon={<PaymentsIcon />}
          color="#2E7D32"
          label="Fee Collection"
          value={fees.loading ? "…" : formatKES(fees.data?.totalCollected ?? 0)}
          footer={<Chip size="small" color="success" label={`${fees.data?.rate ?? 0}% of expected`} sx={{ fontSize: 11 }} />}
        />
        <StatCard
          icon={<WarningIcon />}
          color="#C62828"
          label="Outstanding Fees"
          value={fees.loading ? "…" : formatKES(fees.data?.outstanding ?? 0)}
          footer={<Chip size="small" color="error" label={`${fees.data?.studentsWithBalance ?? 0} students`} sx={{ fontSize: 11 }} />}
        />
        <StatCard
          icon={<AssignmentIcon />}
          color="#F57F17"
          label="Upcoming Exams"
          value={exams.loading ? "…" : (exams.data ?? []).length}
          footer={nextExam ? <Chip size="small" label={`${nextExam.name} · ${daysToExam}d`} sx={{ fontSize: 11 }} /> : undefined}
        />
        <StatCard
          icon={<CalendarMonthIcon />}
          color={pendingEvents.data && pendingEvents.data > 0 ? "#F57F17" : "#2E7D32"}
          label="Term Planner"
          value={pendingEvents.loading ? "…" : `${pendingEvents.data ?? 0} Pending`}
          footer={
            <Button size="small" onClick={() => router.push("/term-planner")} sx={{ fontSize: 10, p: 0, minWidth: 0 }}>
              {pendingEvents.data && pendingEvents.data > 0 ? "Review Now" : "View Calendar"}
            </Button>
          }
        />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" }, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Fee Collection (last 6 months)</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={COLLECTION_TREND}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Legend />
                <Bar dataKey="mpesa" stackId="a" fill="#1565C0" name="M-Pesa" />
                <Bar dataKey="cash" stackId="a" fill="#2E7D32" name="Cash" />
                <Bar dataKey="bank" stackId="a" fill="#6A1B9A" name="Bank" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Class Enrollment</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={enrollment} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                  {enrollment.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Recent Payments</Typography>
            <DataState loading={payments.loading} error={payments.error} data={payments.data} onRetry={payments.refetch} isEmpty={(d: any) => d.length === 0}>
              {(data: any) => (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.slice(0, 5).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.studentName}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatKES(p.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={PAYMENT_METHOD_LABELS[p.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}
                            sx={{
                              fontSize: 11,
                              color: p.paymentMethod === "cash" ? "#2E7D32" : p.paymentMethod === "mpesa" ? "#1565C0" : "#6A1B9A",
                              bgcolor: p.paymentMethod === "cash" ? "#2E7D3219" : p.paymentMethod === "mpesa" ? "#1565C019" : "#6A1B9A19",
                            }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataState>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Outstanding Fees by Class</Typography>
            <DataState loading={fees.loading} error={fees.error} data={fees.data} onRetry={fees.refetch}>
              {(data: any) => (
                <Stack spacing={1.5}>
                  {(data.byClass || []).map((c: any) => (
                    <Box key={c.classId}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.className}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatKES(c.outstanding)} owed · {c.rate}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={c.rate}
                        color={c.rate >= 80 ? "success" : c.rate >= 50 ? "warning" : "error"}
                        sx={{ height: 7, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </DataState>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 3 }}>
        <CommunicationWidget />
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button variant="contained" startIcon={<PaymentsIcon />} onClick={() => router.push("/fees/collection")}>
                Record Fee Payment
              </Button>
              <Button variant="outlined" startIcon={<EventAvailableIcon />} onClick={() => router.push("/attendance")}>
                Take Attendance
              </Button>
              <Button variant="outlined" startIcon={<QuestionAnswerIcon />} onClick={() => router.push("/messages")}>
                Send Message
              </Button>
              <Button variant="outlined" startIcon={<DescriptionIcon />} onClick={() => router.push("/report-cards")}>
                Generate Report Cards
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Alert severity="warning">8 students have a fee balance above KES 10,000.00.</Alert>
        {nextExam && <Alert severity="info">{nextExam.name} starts in {daysToExam} days.</Alert>}
      </Stack>
    </>
  );
}

function CommunicationWidget() {
  const router = useRouter();
  const { data: repliesRes = [] } = useAsync(() => api.getParentReplies(), []);
  const replies = repliesRes || [];
  const unreadCount = replies.filter((r: any) => !r.readByStaff).length;

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">Communication Overview</Typography>
          {unreadCount > 0 && <Chip label={`${unreadCount} New Replies`} color="error" size="small" />}
        </Box>
        <Stack spacing={1.5}>
          {(replies || []).slice(0, 3).map((r: any) => (
            <Box key={r.id} sx={{ p: 1.5, bgcolor: !r.readByStaff ? "action.hover" : "transparent", borderRadius: 1, border: 1, borderColor: "divider" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{r.parentName}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(r.sentAt)}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.body}
              </Typography>
            </Box>
          ))}
          {replies.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>No recent replies</Typography>}
          <Button fullWidth variant="outlined" sx={{ mt: 1 }} onClick={() => router.push("/messages")}>Go to Communication Center</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

function TeacherDashboard() {
  const { user, isClassTeacher } = useAuth();
  const router = useRouter();
  const isCT = isClassTeacher();

  const subjects = (user as any)?.subjectsTaught || [];

  return (
    <>
      <PageHeader
        title="Teacher Dashboard"
        subtitle={`Term 2, 2026 · ${user?.name}`}
      />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>My Subjects & Timetable</Typography>
        <Card>
          <CardContent>
            {subjects.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Periods / Week</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjects.map((sub: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontWeight: 600 }}>{sub.subject__name}</TableCell>
                      <TableCell>{sub.class_room__name}</TableCell>
                      <TableCell>{sub.periods_per_week}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="text.secondary">No subjects explicitly assigned to you.</Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {isCT && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Class Teacher Shortcuts</Typography>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" } }}>
            <Card sx={{ bgcolor: "background.paper", cursor: "pointer", "&:hover": { boxShadow: 4 } }} onClick={() => router.push("/my-class")}>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <GroupWorkIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>My Class</Typography>
                <Typography variant="caption" color="text.secondary">Roster & Details</Typography>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: "background.paper", cursor: "pointer", "&:hover": { boxShadow: 4 } }} onClick={() => router.push("/attendance")}>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <EventAvailableIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>Attendance</Typography>
                <Typography variant="caption" color="text.secondary">Term Tracking</Typography>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: "background.paper", cursor: "pointer", "&:hover": { boxShadow: 4 } }} onClick={() => router.push("/exams")}>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <EditNoteIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>Exam Marks</Typography>
                <Typography variant="caption" color="text.secondary">Formative & Summative</Typography>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: "background.paper", cursor: "pointer", "&:hover": { boxShadow: 4 } }} onClick={() => router.push("/report-cards")}>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <DescriptionIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>Report Cards</Typography>
                <Typography variant="caption" color="text.secondary">Class Comments</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 3 }}>
        <CommunicationWidget />
      </Box>
    </>
  );
}
