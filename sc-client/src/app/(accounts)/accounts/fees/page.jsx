"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert, Box, Button, Card, Chip, Divider, FormControl, InputLabel,
  LinearProgress, MenuItem, Select, Stack, ToggleButton, ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptIcon from "@mui/icons-material/Receipt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useAsync } from "@/hooks/useAsync";
import { feesApi, formatKES } from "@/lib/feesApi";
import { accountantApi } from "@/lib/accountantApi";
import { schoolApi } from "@/lib/schoolApi";

// ---- small helpers ---------------------------------------------------------
const ymd = (d) => d.toLocaleDateString("en-CA"); // local YYYY-MM-DD
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

export default function AccountantDashboardPage() {
  const router = useRouter();
  const theme = useTheme();
  const [yearId, setYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [range, setRange] = useState(30);
  const [chartType, setChartType] = useState("bar");

  const { data, loading, error } = useAsync(async () => {
    const [years, terms] = await Promise.all([
      schoolApi.getAcademicYears(),
      schoolApi.getTerms(),
    ]);
    const yearList = Array.isArray(years) ? years : [];
    const termList = Array.isArray(terms) ? terms : [];

    const activeYear = yearList.find((y) => y.status === "active") || yearList[0];
    const yId = yearId || activeYear?.id || "";
    const yTerms = termList.filter((t) => String(t.academic_year) === String(yId));
    const tId = termId || yTerms[0]?.id || "";

    const [summary, payments, daily, pending, byGrade] = await Promise.all([
      yId ? feesApi.getCollectionSummary({ year: yId, term: tId }) : null,
      feesApi.listPayments({}),
      accountantApi.collectionsByDay(ymd(new Date(Date.now() - 30 * 86400000)), ymd(new Date())),
      accountantApi.mpesaPending(),
      yId ? accountantApi.outstandingByGrade(yId) : [],
    ]);

    return {
      years: yearList,
      terms: termList,
      yearId: yId,
      termId: tId,
      summary: summary || {},
      payments: Array.isArray(payments) ? payments : [],
      daily: Array.isArray(daily) ? daily : [],
      pending: Array.isArray(pending) ? pending : [],
      byGrade: Array.isArray(byGrade) ? byGrade : [],
    };
  }, [yearId, termId]);

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{String(error)}</Alert>;

  const years = data?.years ?? [];
  const terms = (data?.terms ?? []).filter(
    (t) => String(t.academic_year) === String(data?.yearId),
  );
  const summary = data?.summary ?? {};
  const payments = data?.payments ?? [];
  const daily = data?.daily ?? [];
  const pending = data?.pending ?? [];

  const invoiced = Number(summary.totalInvoiced || 0);
  const collected = Number(summary.totalCollected || 0);
  const outstanding = Number(summary.outstanding || 0);
  const rate = Number(summary.collectionRate || 0);
  const rateColor = rate >= 0.8 ? "success" : rate >= 0.5 ? "warning" : "error";

  // Chart data
  const days = buildDailyCollections(daily, range);
  const todayTotal = daily
    .filter((d) => d.date === ymd(new Date()))
    .reduce((s, d) => s + Math.max(0, Number(d.amount || 0)), 0);

  const byMethod = {};
  payments
    .filter((p) => p.status === "success" && Number(p.amount) > 0)
    .forEach((p) => {
      byMethod[p.methodLabel] = (byMethod[p.methodLabel] || 0) + Number(p.amount);
    });
  const methods = Object.entries(byMethod).map(([label, value], id) => ({ id, label, value }));

  // Backend row shape for outstanding-by-grade is read defensively
  const grades = (data?.byGrade ?? []).map((r) => ({
    grade: r.gradeLevel ?? r.grade_level ?? r.grade ?? "-",
    amount: Number(r.outstanding ?? r.balance ?? r.amount ?? 0),
  }));

  const recent = payments.slice(0, 8);

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        sx={{justifyContent:"space-between"}}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Fees overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Billing, collections and balances for the selected term.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{alignItems:"center"}}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Academic year</InputLabel>
            <Select
              value={data?.yearId || ""}
              label="Academic year"
              onChange={(e) => {
                setYearId(e.target.value);
                setTermId("");
              }}
            >
              {years.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name} {y.status === "active" ? "(active)" : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Term</InputLabel>
            <Select value={data?.termId || ""} label="Term" onChange={(e) => setTermId(e.target.value)}>
              {terms.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<PaymentsIcon />}
            onClick={() => router.push("/accounts/fees/payments")}
          >
            Record payment
          </Button>
        </Stack>
      </Stack>

      {/* KPI cards */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
        }}
      >
        <StatCard
          label="Invoiced"
          value={formatKES(invoiced)}
          icon={<ReceiptIcon />}
          color="primary"
          note="Total billed this term"
        />
        <StatCard
          label="Collected"
          value={formatKES(collected)}
          icon={<TrendingUpIcon />}
          color="success"
          note={`${formatKES(todayTotal)} received today`}
        />
        <StatCard
          label="Outstanding"
          value={formatKES(outstanding)}
          icon={<WarningAmberIcon />}
          color={outstanding > 0 ? "error" : "success"}
          note="Still owed by parents"
        />
        <StatCard
          label="Collection rate"
          value={`${Math.round(rate * 100)}%`}
          icon={<TrendingUpIcon />}
          color={rateColor}
          note={<LinearProgress variant="determinate" color={rateColor} value={Math.min(rate * 100, 100)} sx={{ height: 6, borderRadius: 3 }} />}
        />
      </Box>

      {pending.length > 0 && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => router.push("/accounts/fees/reconciliation")}>
              Reconcile
            </Button>
          }
        >
          {pending.length} M-Pesa payment{pending.length === 1 ? "" : "s"} waiting to be confirmed.
        </Alert>
      )}

      {/* Collections chart + payment methods */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Collected today
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatKES(todayTotal)}
              </Typography>
            </Box>
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Payments by method
          </Typography>
          {methods.length === 0 ? (
            <EmptyText>No confirmed payments yet.</EmptyText>
          ) : (
            <PieChart
              height={260}
              series={[
                {
                  data: methods,
                  innerRadius: 55,
                  paddingAngle: 2,
                  valueFormatter: ({ value }) => formatKES(value),
                },
              ]}
            />
          )}
        </Card>
      </Box>

      {/* Outstanding by grade + recent payments */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Outstanding by grade
            </Typography>
            <Button size="small" onClick={() => router.push("/accounts/fees/outstanding")}>
              View details
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

        <Card>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, pl: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Recent payments
            </Typography>
            <Button size="small" onClick={() => router.push("/accounts/fees/payments")}>
              View all
            </Button>
          </Stack>
          <Divider />
          {recent.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <EmptyText>No payments recorded yet.</EmptyText>
            </Box>
          ) : (
            <Stack divider={<Divider />}>
              {recent.map((p) => (
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
                  <Typography
                    sx={{
                      fontWeight: 600,
                      minWidth: 96,
                      textAlign: "right",
                      color: Number(p.amount) < 0 ? "error.main" : "text.primary",
                    }}
                  >
                    {formatKES(p.amount)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Card>
      </Box>
    </Stack>
  );
}

function StatCard({ label, value, icon, color, note }) {
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 36,
            height: 36,
            borderRadius: 2,
            color: `${color}.main`,
            bgcolor: (t) => `${t.palette[color].main}1A`,
          }}
        >
          {icon}
        </Box>
      </Stack>
      <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
        {value}
      </Typography>
      <Box sx={{ mt: 1 }}>
        {typeof note === "string" ? (
          <Typography variant="caption" color="text.secondary">
            {note}
          </Typography>
        ) : (
          note
        )}
      </Box>
    </Card>
  );
}

function EmptyText({ children }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
      {children}
    </Typography>
  );
}
