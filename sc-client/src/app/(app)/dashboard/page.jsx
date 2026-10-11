"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert, Box, Button, Card, Chip, Divider, LinearProgress, Stack,
  ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import PeopleIcon from "@mui/icons-material/People";
import BadgeIcon from "@mui/icons-material/Badge";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningIcon from "@mui/icons-material/Warning";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AssignmentIcon from "@mui/icons-material/Assignment";

import { PageGuard } from "@/components/common/PageGuard";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { formatDate } from "@/lib/utils";
import { request } from "@/lib/http";
import { studentApi } from "@/lib/studentApi";
import { feesApi, formatKES } from "@/lib/feesApi";
import { accountantApi } from "@/lib/accountantApi";
import { schoolApi, EVENT_CATEGORY } from "@/lib/schoolApi";
import { examsApi, EXAM_STATUS } from "@/lib/examsApi";
import { attendanceApi, todayISO } from "@/lib/attendanceApi";
import { admissionsApi, APPLICATION_STATUS } from "@/lib/admissionsApi";
import { CBC_GRADES } from "@/lib/academicsApi";

// Change these in one place if a route differs in your app.
const ROUTES = {
  payments: "/fees/payments",
  outstanding: "/fees/outstanding",
  calendar: "/school/calendar",
  exams: "/exams",
  attendance: "/attendance",
};

const PIPELINE = ["submitted", "under_review", "interview_scheduled", "offered"];

const list = (x) => (Array.isArray(x) ? x : []);
const ymd = (d) => d.toLocaleDateString("en-CA");
const shortDate = (s) =>
  new Date(`${s}T00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
const compact = (v) => new Intl.NumberFormat("en", { notation: "compact" }).format(v);

function buildDailyCollections(dailyData, rangeDays) {
  const map = new Map();
  (dailyData || []).forEach((d) => {
    const amt = Math.max(0, Number(d.amount || 0));
    map.set(d.date, amt);
  });

  const list = [];
  const now = new Date();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toLocaleDateString("en-CA");
    list.push({
      date: dateStr,
      amount: map.get(dateStr) || 0,
    });
  }
  return list;
}

export default function DashboardPage() {
  const { hasAnyRole } = useAuth();
  const isSenior = hasAnyRole(["admin", "headteacher", "deputy"]);

  return (
    <PageGuard permission="reports.view">
      {isSenior ? <AdminDashboard /> : <TeacherDashboard />}
    </PageGuard>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const theme = useTheme();
  const [range, setRange] = useState(30);
  const [chartType, setChartType] = useState("bar");

  const { data, loading, error } = useAsync(async () => {
    const period = await schoolApi.getCurrentPeriod();
    const yearId = period?.academic_year?.id;
    const termId = period?.term?.id;
    const today = todayISO();
    const from = ymd(new Date(Date.now() - 30 * 86400000));

    const [
      students, staff, summary, daily, byGrade, payments,
      events, pendingEvents, exams, applications, attendance,
    ] = await Promise.all([
      studentApi.getStudents(),
      request("/staff/").catch(() => []),
      yearId ? feesApi.getCollectionSummary({ year: yearId, term: termId }) : {},
      accountantApi.collectionsByDay(from, today),
      yearId ? accountantApi.outstandingByGrade(yearId) : [],
      feesApi.listPayments({ from }),
      schoolApi.getCalendarEvents({ from: today, approval_status: "approved" }),
      schoolApi.getCalendarEvents({ approval_status: "pending" }),
      examsApi.list(),
      admissionsApi.getApplications(),
      attendanceApi.getDaySummary(today).catch(() => null),
    ]);

    return {
      term: period?.term?.label || "",
      students: list(students),
      staff: list(staff),
      summary: summary || {},
      daily: list(daily),
      byGrade: list(byGrade),
      payments: list(payments),
      events: list(events),
      pendingEvents: list(pendingEvents),
      exams: list(exams),
      applications: list(applications),
      attendance,
    };
  }, []);

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{String(error)}</Alert>;

  // ---- derived numbers ----------------------------------------------------
  const students = data.students.filter((s) => s.status === "active");
  const girls = students.filter((s) => s.gender === "Female").length;
  const boys = students.filter((s) => s.gender === "Male").length;

  const onLeave = data.staff.filter((s) => s.status === "on_leave").length;

  const collected = Number(data.summary.totalCollected || 0);
  const rate = Number(data.summary.collectionRate || 0);
  const outstanding = Number(data.summary.outstanding || 0);
  const owingStudents = data.byGrade.reduce((n, g) => n + Number(g.studentCount || 0), 0);

  // Attendance keys are read defensively; the tile shows a dash if they differ.
  const att = data.attendance;
  const attTotal = att
    ? ["present", "absent", "late", "excused"].reduce((s, k) => s + Number(att[k] || 0), 0)
    : 0;
  const attRate = attTotal
    ? Math.round(((Number(att.present || 0) + Number(att.late || 0)) / attTotal) * 100)
    : null;

  const openExams = data.exams.filter((e) => e.status === "open");

  // Students per grade, in CBC order
  const perGrade = {};
  students.forEach((s) => {
    const g = s.gradeLevel ?? s.grade_level ?? "Unassigned";
    perGrade[g] = (perGrade[g] || 0) + 1;
  });
  const gradeNames = [
    ...CBC_GRADES.filter((g) => perGrade[g]),
    ...Object.keys(perGrade).filter((g) => !CBC_GRADES.includes(g)),
  ];

  const days = buildDailyCollections(data.daily, range);
  const grades = data.byGrade.map((r) => ({ grade: r.gradeLevel, amount: Number(r.balance) }));
  const pipeline = PIPELINE.map((st) => ({
    status: st,
    count: data.applications.filter((a) => a.status === st).length,
  })).filter((p) => p.count > 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={data.term ? `School overview - ${data.term}` : "School overview"}
      />

      <Stack spacing={3}>
        {/* KPI cards */}
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" },
          }}
        >
          <StatCard
            icon={<PeopleIcon />}
            label="Active students"
            value={students.length}
            footer={<Chip size="small" label={`${girls} girls · ${boys} boys`} sx={{ fontSize: 11 }} />}
          />
          <StatCard
            icon={<BadgeIcon />}
            color="#6A1B9A"
            label="Staff"
            value={data.staff.length}
            footer={
              <Chip
                size="small"
                color={onLeave ? "warning" : "default"}
                label={onLeave ? `${onLeave} on leave` : "None on leave"}
                sx={{ fontSize: 11 }}
              />
            }
          />
          <StatCard
            icon={<PaymentsIcon />}
            color="#2E7D32"
            label="Fees collected this term"
            value={formatKES(collected)}
            footer={
              <Chip size="small" color="success" label={`${Math.round(rate * 100)}% of billed`} sx={{ fontSize: 11 }} />
            }
          />
          <StatCard
            icon={<WarningIcon />}
            color="#C62828"
            label="Outstanding fees"
            value={formatKES(outstanding)}
            footer={<Chip size="small" color="error" label={`${owingStudents} students owing`} sx={{ fontSize: 11 }} />}
          />
          <StatCard
            icon={<EventAvailableIcon />}
            color="#0288D1"
            label="Attendance today"
            value={attRate === null ? "-" : `${attRate}%`}
            footer={
              <Button size="small" onClick={() => router.push(ROUTES.attendance)} sx={{ fontSize: 11, p: 0, minWidth: 0 }}>
                View attendance
              </Button>
            }
          />
          <StatCard
            icon={<AssignmentIcon />}
            color="#F57F17"
            label="Exams open for marking"
            value={openExams.length}
            footer={
              <Button size="small" onClick={() => router.push(ROUTES.exams)} sx={{ fontSize: 11, p: 0, minWidth: 0 }}>
                Manage exams
              </Button>
            }
          />
        </Box>

        {data.pendingEvents.length > 0 && (
          <Alert
            severity="info"
            action={
              <Button color="inherit" size="small" onClick={() => router.push(ROUTES.calendar)}>
                Review
              </Button>
            }
          >
            {data.pendingEvents.length} calendar event{data.pendingEvents.length === 1 ? "" : "s"} waiting for your approval.
          </Alert>
        )}

        {/* Collections + outstanding */}
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Fees collected per day
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={chartType}
                  onChange={(_, v) => v && setChartType(v)}
                >
                  <ToggleButton value="bar" sx={{ px: 1.5, py: 0.25, fontSize: "0.75rem" }}>
                    Bar
                  </ToggleButton>
                  <ToggleButton value="line" sx={{ px: 1.5, py: 0.25, fontSize: "0.75rem" }}>
                    Line
                  </ToggleButton>
                </ToggleButtonGroup>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={range}
                  onChange={(_, v) => v && setRange(v)}
                >
                  <ToggleButton value={7} sx={{ px: 1.5, py: 0.25, fontSize: "0.75rem" }}>
                    7 days
                  </ToggleButton>
                  <ToggleButton value={30} sx={{ px: 1.5, py: 0.25, fontSize: "0.75rem" }}>
                    30 days
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>
            {days.every((d) => d.amount === 0) ? (
              <EmptyText>No collections in this period.</EmptyText>
            ) : chartType === "bar" ? (
              <BarChart
                height={280}
                margin={{ left: 56, right: 16, top: 16, bottom: 28 }}
                xAxis={[
                  {
                    scaleType: "band",
                    data: days.map((d) => shortDate(d.date)),
                  },
                ]}
                yAxis={[{ valueFormatter: compact, min: 0 }]}
                series={[
                  {
                    data: days.map((d) => d.amount),
                    color: theme.palette.primary.main,
                    valueFormatter: (v) => formatKES(v),
                  },
                ]}
              />
            ) : (
              <LineChart
                height={280}
                margin={{ left: 56, right: 16, top: 16, bottom: 28 }}
                xAxis={[{ scaleType: "point", data: days.map((d) => shortDate(d.date)) }]}
                yAxis={[{ valueFormatter: compact, min: 0 }]}
                series={[
                  {
                    data: days.map((d) => d.amount),
                    curve: "linear",
                    showMark: range === 7,
                    color: theme.palette.primary.main,
                    valueFormatter: (v) => formatKES(v),
                  },
                ]}
              />
            )}
          </Card>

          <Card sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Outstanding by grade
              </Typography>
              <Button size="small" onClick={() => router.push(ROUTES.outstanding)}>
                Details
              </Button>
            </Stack>
            {grades.length === 0 ? (
              <EmptyText>No outstanding balances.</EmptyText>
            ) : (
              <BarChart
                layout="horizontal"
                height={Math.max(220, grades.length * 36 + 60)}
                margin={{ left: 80, right: 16, top: 16, bottom: 28 }}
                yAxis={[{ scaleType: "band", data: grades.map((g) => g.grade) }]}
                xAxis={[{ valueFormatter: compact }]}
                series={[
                  {
                    data: grades.map((g) => g.amount),
                    color: theme.palette.error.main,
                    valueFormatter: (v) => formatKES(v),
                  },
                ]}
              />
            )}
          </Card>
        </Box>

        {/* Enrollment + events */}
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Students per grade
            </Typography>
            {gradeNames.length === 0 ? (
              <EmptyText>No students enrolled yet.</EmptyText>
            ) : (
              <BarChart
                height={280}
                margin={{ left: 40, right: 16, top: 16, bottom: 28 }}
                xAxis={[{ scaleType: "band", data: gradeNames }]}
                series={[
                  {
                    data: gradeNames.map((g) => perGrade[g]),
                    color: theme.palette.primary.main,
                    valueFormatter: (v) => `${v} students`,
                  },
                ]}
              />
            )}
          </Card>

          <Card>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, pl: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Upcoming events
              </Typography>
              <Button size="small" onClick={() => router.push(ROUTES.calendar)}>
                Calendar
              </Button>
            </Stack>
            <Divider />
            {data.events.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <EmptyText>Nothing scheduled.</EmptyText>
              </Box>
            ) : (
              <Stack divider={<Divider />}>
                {data.events.slice(0, 5).map((e) => {
                  const cat = EVENT_CATEGORY[e.category] || EVENT_CATEGORY.other;
                  return (
                    <Stack key={e.id} direction="row" alignItems="center" spacing={2} sx={{ px: 3, py: 1.5 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                          {e.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(e.start_date)}
                          {e.end_date !== e.start_date ? ` - ${formatDate(e.end_date)}` : ""}
                        </Typography>
                      </Box>
                      <Chip size="small" variant="outlined" color={cat.color} label={cat.label} />
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Card>
        </Box>

        {/* Payments + attention */}
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
          <Card>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, pl: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Recent payments
              </Typography>
              <Button size="small" onClick={() => router.push(ROUTES.payments)}>
                View all
              </Button>
            </Stack>
            <Divider />
            {data.payments.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <EmptyText>No payments in the last 30 days.</EmptyText>
              </Box>
            ) : (
              <Stack divider={<Divider />}>
                {data.payments.slice(0, 6).map((p) => (
                  <Stack key={p.id} direction="row" alignItems="center" spacing={2} sx={{ px: 3, py: 1.5 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                        {p.studentName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {shortDate(p.paid_on)} - {p.methodLabel}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={p.statusLabel}
                      color={p.status === "success" ? "success" : p.status === "pending" ? "warning" : "error"}
                    />
                    <Typography sx={{ fontWeight: 600, minWidth: 96, textAlign: "right" }}>
                      {formatKES(p.amount)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Card>

          <Stack spacing={2}>
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Exams in progress
              </Typography>
              {openExams.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No exams open for marking.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {openExams.slice(0, 4).map((e) => (
                    <Stack key={e.id} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" noWrap sx={{ mr: 1 }}>
                        {e.name}
                      </Typography>
                      <Chip size="small" color={EXAM_STATUS.open.color} label={EXAM_STATUS.open.label} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </Card>

            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Admissions pipeline
              </Typography>
              {pipeline.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No applications in progress.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {pipeline.map((p) => (
                    <Stack key={p.status} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{APPLICATION_STATUS[p.status].label}</Typography>
                      <Chip size="small" color={APPLICATION_STATUS[p.status].color} label={p.count} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </Card>
          </Stack>
        </Box>
      </Stack>
    </>
  );
}

function EmptyText({ children }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
      {children}
    </Typography>
  );
}
