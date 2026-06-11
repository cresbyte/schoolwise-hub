/**
 * Admin / headteacher dashboard with KPIs, charts and tables.
 * @module routes/dashboard
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import WarningIcon from "@mui/icons-material/Warning";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DescriptionIcon from "@mui/icons-material/Description";
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
import { StatCard } from "@/components/StatCard";
import { DataState } from "@/components/DataState";
import { useStudents, useStaff, useFees, useClasses } from "@/hooks/domain";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { formatKES, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  ),
});

const PIE_COLORS = ["#1565C0", "#F57F17", "#2E7D32", "#6A1B9A", "#0288D1", "#C62828", "#5E35B1", "#00838F"];

const COLLECTION_TREND = [
  { month: "Jan", mpesa: 420000, cash: 130000, bank: 90000, target: 700000 },
  { month: "Feb", mpesa: 480000, cash: 110000, bank: 120000, target: 700000 },
  { month: "Mar", mpesa: 510000, cash: 95000, bank: 140000, target: 700000 },
  { month: "Apr", mpesa: 460000, cash: 120000, bank: 110000, target: 700000 },
  { month: "May", mpesa: 540000, cash: 105000, bank: 160000, target: 700000 },
  { month: "Jun", mpesa: 380000, cash: 90000, bank: 130000, target: 700000 },
];

/** Dashboard page body. */
function Dashboard() {
  const navigate = useNavigate();
  const students = useStudents();
  const staff = useStaff();
  const fees = useFees();
  const classes = useClasses();
  const payments = useAsync(() => api.getPayments(), []);
  const exams = useAsync(() => api.getExams({ status: "upcoming" }), []);

  const studentList = students.data ?? [];
  const boarding = studentList.filter((s) => s.boardingStatus === "boarding").length;
  const onLeave = (staff.data ?? []).filter((s) => s.status === "on_leave").length;
  const enrollment = (classes.data ?? []).map((c) => ({ name: c.name, value: c.studentCount }));
  const nextExam = exams.data?.[0];
  const daysToExam = nextExam ? Math.max(0, Math.ceil((new Date(nextExam.startDate).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Greenfield Private Academy · Term 2, 2024" />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(5, 1fr)" }, mb: 3 }}>
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
                <Bar dataKey="bank" stackId="a" fill="#6A1B9A" name="Bank" radius={[4, 4, 0, 0]} />
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
            <DataState loading={payments.loading} error={payments.error} data={payments.data} onRetry={payments.refetch} isEmpty={(d) => d.length === 0}>
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
                    {data.slice(0, 5).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.studentName}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatKES(p.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={PAYMENT_METHOD_LABELS[p.paymentMethod]}
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
              {(data) => (
                <Stack spacing={1.5}>
                  {data.byClass.map((c: any) => (
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

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Alert severity="warning">8 students have a fee balance above KES 10,000.00.</Alert>
        {nextExam && <Alert severity="info">{nextExam.name} starts in {daysToExam} days.</Alert>}
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button variant="contained" startIcon={<PaymentsIcon />} onClick={() => navigate({ to: "/fees/collection" })}>
              Record Fee Payment
            </Button>
            <Button variant="outlined" startIcon={<EventAvailableIcon />} onClick={() => navigate({ to: "/attendance" })}>
              Take Attendance
            </Button>
            <Button variant="outlined" startIcon={<EditNoteIcon />} onClick={() => navigate({ to: "/exams" })}>
              Enter Exam Marks
            </Button>
            <Button variant="outlined" startIcon={<DescriptionIcon />} onClick={() => navigate({ to: "/report-cards" })}>
              Generate Report Cards
            </Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}