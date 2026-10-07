"use client";

import { useMemo } from "react";
import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { formatDate, formatKES } from "@/lib/utils";
import { api } from "@/lib/api";

import AssignmentIcon from "@mui/icons-material/Assignment";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DescriptionIcon from "@mui/icons-material/Description";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import PaymentsIcon from "@mui/icons-material/Payments";
import PeopleIcon from "@mui/icons-material/People";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Grid,
} from "@mui/material";
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

export default function DashboardPage() {
  const { hasAnyRole, user, isClassTeacher } = useAuth();
  const isSenior = hasAnyRole(["admin", "headteacher", "accountant"]);

  return (
    <DashboardLayout>
      <PageGuard permission="reports.view">
        {isSenior ? (
          <DashboardContent />
        ) : (
          <TeacherDashboard user={user} isClassTeacher={isClassTeacher} />
        )}
      </PageGuard>
    </DashboardLayout>
  );
}

const PIE_COLORS = [
  "#1565C0",
  "#F57F17",
  "#2E7D32",
  "#6A1B9A",
  "#0288D1",
  "#C62828",
  "#5E35B1",
  "#00838F",
];

/** Senior Admin Dashboard Content */
function DashboardContent() {
  const router = useRouter();

  // Fetch real data
  const { data: students, loading: loadingStudents } = useAsync(() => api.getStudents(), []);
  const { data: staff, loading: loadingStaff } = useAsync(() => api.getStaff(), []);
  const { data: feeSummary, loading: loadingFees } = useAsync(
    () => api.getFeeCollectionSummary(),
    [],
  );
  const { data: outstandingInvoices, loading: loadingOutstanding } = useAsync(
    () => api.getInvoices({ status__in: "unpaid,partial" }),
    [],
  );
  const { data: exams, loading: loadingExams } = useAsync(
    () => api.exams.list({ status: "upcoming" }),
    [],
  );
  const { data: payments, loading: loadingPayments } = useAsync(() => api.getPayments({}), []);
  const { data: classes, loading: loadingClasses } = useAsync(() => api.getClasses(), []);

  const studentList = students || [];
  const boardingCount = studentList.filter(
    (s) => s.boardingStatus === "boarding" || s.boarding_status === "boarding",
  ).length;

  const staffList = staff || [];
  const onLeaveCount = staffList.filter((s) => s.status === "on_leave").length;

  const outstandingList = outstandingInvoices || [];
  const totalOutstanding = outstandingList.reduce((sum, inv) => sum + Number(inv.balance || 0), 0);
  const studentsWithBalance = new Set(outstandingList.map((inv) => inv.student)).size;

  // Group outstanding fees by class dynamically
  const outstandingByClass = useMemo(() => {
    const map = {};
    outstandingList.forEach((inv) => {
      const className = inv.student_class || "Unknown Class";
      if (!map[className]) {
        map[className] = { className, outstanding: 0, total: 0 };
      }
      map[className].outstanding += Number(inv.balance || 0);
      map[className].total += Number(inv.total_amount || 0);
    });
    return Object.values(map)
      .map((c) => ({
        ...c,
        rate: c.total > 0 ? Math.round(((c.total - c.outstanding) / c.total) * 100) : 100,
      }))
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 5); // Top 5 classes with highest outstanding
  }, [outstandingList]);

  const nextExam = exams?.[0];
  const daysToExam = nextExam
    ? Math.max(
        0,
        Math.ceil(
          (new Date(nextExam.startDate || nextExam.start_date).getTime() - Date.now()) / 86400000,
        ),
      )
    : 0;

  const enrollmentData = useMemo(() => {
    if (!classes) return [];
    return classes
      .map((c) => ({
        name: c.name,
        value: c.studentCount || c.capacity || 0,
      }))
      .filter((c) => c.value > 0);
  }, [classes]);

  const totalCollected = feeSummary?.totalCollected || 0;
  const collectionRate = feeSummary?.collectionRate || 0;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="School Administration Overview" />

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            icon={<PeopleIcon />}
            label="Total Students"
            value={loadingStudents ? "…" : studentList.length}
            footer={
              <Chip
                size="small"
                label={`${studentList.length - boardingCount} day · ${boardingCount} boarding`}
                sx={{ fontSize: 11 }}
              />
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            icon={<BadgeIcon />}
            color="#6A1B9A"
            label="Total Staff"
            value={loadingStaff ? "…" : staffList.length}
            footer={
              <Chip
                size="small"
                color="warning"
                label={`${onLeaveCount} on leave`}
                sx={{ fontSize: 11 }}
              />
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            icon={<PaymentsIcon />}
            color="#2E7D32"
            label="Fee Collection"
            value={loadingFees ? "…" : formatKES(totalCollected)}
            footer={
              <Chip
                size="small"
                color="success"
                label={`${collectionRate}% of expected`}
                sx={{ fontSize: 11 }}
              />
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            icon={<WarningIcon />}
            color="#C62828"
            label="Outstanding Fees"
            value={loadingOutstanding ? "…" : formatKES(totalOutstanding)}
            footer={
              <Chip
                size="small"
                color="error"
                label={`${studentsWithBalance} students`}
                sx={{ fontSize: 11 }}
              />
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            icon={<AssignmentIcon />}
            color="#F57F17"
            label="Upcoming Exams"
            value={loadingExams ? "…" : (exams || []).length}
            footer={
              nextExam ? (
                <Chip
                  size="small"
                  label={`${nextExam.name} · ${daysToExam}d`}
                  sx={{ fontSize: 11 }}
                />
              ) : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            icon={<CalendarMonthIcon />}
            color="#0288D1"
            label="Active Classes"
            value={loadingClasses ? "…" : (classes || []).length}
            footer={
              <Button
                size="small"
                onClick={() => router.push("/academics/classes")}
                sx={{ fontSize: 10, p: 0, minWidth: 0 }}
              >
                View All Classes
              </Button>
            }
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Payments by Method
              </Typography>
              <DataState
                loading={loadingPayments}
                data={payments || []}
                isEmpty={(d) => d.length === 0}
                emptyMessage="No payments recorded yet"
              >
                {(data) => {
                  // Aggregate last 30 days of payments by method
                  const methodTotals = { mpesa: 0, cash: 0, bank_deposit: 0, cheque: 0 };
                  data.forEach((p) => {
                    if (methodTotals[p.method] !== undefined)
                      methodTotals[p.method] += Number(p.amount);
                  });
                  const chartData = [
                    { name: "M-Pesa", value: methodTotals.mpesa, fill: "#1565C0" },
                    { name: "Cash", value: methodTotals.cash, fill: "#2E7D32" },
                    {
                      name: "Bank",
                      value: methodTotals.bank_deposit + methodTotals.cheque,
                      fill: "#6A1B9A",
                    },
                  ];

                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis
                          type="number"
                          fontSize={12}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <YAxis type="category" dataKey="name" fontSize={12} width={60} />
                        <Tooltip formatter={(v) => formatKES(v)} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                }}
              </DataState>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Class Enrollment
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={enrollmentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label
                  >
                    {enrollmentData.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} students`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
                {enrollmentData.length === 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <Typography color="text.secondary">No enrollment data available</Typography>
                  </Box>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tables & Lists */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Recent Payments
              </Typography>
              <DataState
                loading={loadingPayments}
                data={payments || []}
                isEmpty={(d) => d.length === 0}
                emptyMessage="No recent payments"
              >
                {(data) => (
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
                      {data.slice(0, 5).map((p) => {
                        const methodLabel =
                          p.method === "mpesa"
                            ? "M-Pesa"
                            : p.method === "bank_deposit"
                              ? "Bank"
                              : p.method === "cash"
                                ? "Cash"
                                : "Cheque";
                        const methodColor =
                          p.method === "cash"
                            ? "#2E7D32"
                            : p.method === "mpesa"
                              ? "#1565C0"
                              : "#6A1B9A";
                        return (
                          <TableRow key={p.id}>
                            <TableCell>{p.student_name || "Unknown"}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{formatKES(p.amount)}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={methodLabel}
                                sx={{
                                  fontSize: 11,
                                  color: methodColor,
                                  bgcolor: `${methodColor}19`,
                                }}
                              />
                            </TableCell>
                            <TableCell>{formatDate(p.date)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </DataState>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Outstanding Fees by Class (Top 5)
              </Typography>
              <DataState
                loading={loadingOutstanding}
                data={outstandingByClass}
                isEmpty={(d) => d.length === 0}
                emptyMessage="No outstanding fees!"
              >
                {(data) => (
                  <Stack spacing={1.5}>
                    {data.map((c, idx) => (
                      <Box key={idx}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {c.className}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatKES(c.outstanding)} owed · {c.rate}% paid
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
        </Grid>
      </Grid>

      {/* Alerts & Quick Actions */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {studentsWithBalance > 0 && (
          <Alert
            severity="warning"
            onClick={() => router.push("/finance/outstanding")}
            sx={{ cursor: "pointer" }}
          >
            {studentsWithBalance} students have outstanding fee balances. Click to view details.
          </Alert>
        )}
        {nextExam && (
          <Alert severity="info" onClick={() => router.push("/exams")} sx={{ cursor: "pointer" }}>
            <strong>{nextExam.name}</strong> starts in {daysToExam} days. Click to manage.
          </Alert>
        )}
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={<PaymentsIcon />}
              onClick={() => router.push("/finance/invoices")}
            >
              Manage Invoices
            </Button>
            <Button
              variant="outlined"
              startIcon={<EventAvailableIcon />}
              onClick={() => router.push("/attendance/entry")}
            >
              Take Attendance
            </Button>
            <Button
              variant="outlined"
              startIcon={<QuestionAnswerIcon />}
              onClick={() => router.push("/messages")}
            >
              Send Message
            </Button>
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={() => router.push("/exams")}
            >
              Manage Exams
            </Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}

/** Teacher Dashboard Content */
function TeacherDashboard({ user, isClassTeacher }) {
  const router = useRouter();
  const isCT = isClassTeacher();

  const { data: gradingTasks, loading } = useAsync(() => api.exams.getMyGrading(), []);
  const tasks = gradingTasks || [];

  return (
    <>
      <PageHeader title="Teacher Dashboard" subtitle={`Welcome back, ${user?.name || "Teacher"}`} />

      {isCT && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Class Teacher Shortcuts
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            }}
          >
            {[
              {
                icon: <GroupWorkIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />,
                title: "My Class",
                desc: "Roster & Details",
                path: "/students",
              },
              {
                icon: <EventAvailableIcon color="success" sx={{ fontSize: 40, mb: 1 }} />,
                title: "Attendance",
                desc: "Mark Weekly",
                path: "/attendance/entry",
              },
              {
                icon: <EditNoteIcon color="info" sx={{ fontSize: 40, mb: 1 }} />,
                title: "Exam Marks",
                desc: "Enter Scores",
                path: "/staff/grading",
              },
              {
                icon: <DescriptionIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />,
                title: "Report Cards",
                desc: "Class Comments",
                path: "/exams/comments",
              },
            ].map((item, i) => (
              <Card
                key={i}
                sx={{ bgcolor: "background.paper", cursor: "pointer", "&:hover": { boxShadow: 4 } }}
                onClick={() => router.push(item.path)}
              >
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  {item.icon}
                  <Typography variant="subtitle1" fontWeight={600}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.desc}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          My Grading Tasks
        </Typography>
        <Card>
          <CardContent>
            <DataState
              loading={loading}
              data={tasks}
              isEmpty={(d) => d.length === 0}
              emptyMessage="No grading tasks assigned to you."
            >
              {(data) => (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Exam</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.slice(0, 5).map((task) => {
                      const pct =
                        task.totalCount > 0
                          ? Math.round((task.gradedCount / task.totalCount) * 100)
                          : 0;
                      const isComplete =
                        task.gradedCount === task.totalCount && task.totalCount > 0;
                      return (
                        <TableRow key={task.examSubjectId} hover>
                          <TableCell>{task.examName}</TableCell>
                          <TableCell>{task.className}</TableCell>
                          <TableCell>{task.subjectName}</TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography
                                variant="body2"
                                fontWeight={isComplete ? "bold" : "normal"}
                                color={isComplete ? "success.main" : "text.primary"}
                              >
                                {task.gradedCount}/{task.totalCount}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                color={isComplete ? "success" : "primary"}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={isComplete || task.status === "published"}
                              onClick={() =>
                                router.push(
                                  `/exams/${task.examId}/scores?subjectId=${task.examSubjectId}`,
                                )
                              }
                            >
                              {isComplete ? "Done" : "Enter Scores"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </DataState>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
