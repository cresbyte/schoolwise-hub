"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useAsync } from "@/hooks/useAsync";
import { feesApi, formatKES, PAYMENT_METHODS } from "@/lib/feesApi";
import { accountantApi } from "@/lib/accountantApi";
import { schoolApi } from "@/lib/schoolApi";

export default function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [yearId, setYearId] = useState("");
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));

  const { data, loading, error } = useAsync(async () => {
    const [years, outstanding, byGrade] = await Promise.all([
      schoolApi.getAcademicYears(),
      feesApi.getOutstanding(yearId ? { year: yearId } : {}),
      yearId ? accountantApi.outstandingByGrade(yearId) : [],
    ]);
    const yearList = Array.isArray(years) ? years : [];
    if (!yearId && yearList.length > 0) {
      const active = yearList.find((y) => y.status === "active");
      setYearId(active?.id || yearList[0].id);
    }
    return {
      years: yearList,
      outstanding: Array.isArray(outstanding) ? outstanding : [],
      byGrade: Array.isArray(byGrade) ? byGrade : [],
    };
  }, [yearId]);

  const years = data?.years ?? [];
  const outstanding = data?.outstanding ?? [];
  const byGrade = data?.byGrade ?? [];

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{String(error)}</Alert>;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
          Reports
        </Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Academic year</InputLabel>
          <Select value={yearId} label="Academic year" onChange={(e) => setYearId(e.target.value)}>
            {years.map((y) => (
              <MenuItem key={y.id} value={y.id}>
                {y.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
          <Tab label="Aging" />
          <Tab label="Collections" />
          <Tab label="Outstanding by grade" />
        </Tabs>
        <Divider />

        <Box sx={{ p: 3 }}>
          {tab === 0 && <AgingReport rows={outstanding} asOf={asOf} onAsOfChange={setAsOf} />}
          {tab === 1 && <CollectionsReport yearId={yearId} />}
          {tab === 2 && <ByGradeReport rows={byGrade} />}
        </Box>
      </Card>
    </Stack>
  );
}

// --------------------------------------------------------------------------
// Aging report
// --------------------------------------------------------------------------
function AgingReport({ rows, asOf, onAsOfChange }) {
  const buckets = { current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0 };
  rows.forEach((r) => {
    const d = Number(r.daysOverdue || 0);
    if (d <= 0) buckets.current += Number(r.balance);
    else if (d <= 30) buckets.d30 += Number(r.balance);
    else if (d <= 60) buckets.d60 += Number(r.balance);
    else if (d <= 90) buckets.d90 += Number(r.balance);
    else buckets.d90plus += Number(r.balance);
  });

  const exportCsv = () => {
    const csv = [
      ["Student", "Admission #", "Class", "Balance", "Days overdue"],
      ...rows.map((r) => [r.studentName, r.admissionNumber, r.className, r.balance, r.daysOverdue]),
    ]
      .map((r) => r.map((c) => `"${c ?? ""}"`).join(","))
      .join("\n");
    download(csv, `aging-${asOf}.csv`);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="As of"
          type="date"
          size="small"
          value={asOf}
          onChange={(e) => onAsOfChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<DownloadIcon />} onClick={exportCsv}>
          Export CSV
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
        }}
      >
        <AgingBucket label="Current" amount={buckets.current} color="success" />
        <AgingBucket label="1–30 days" amount={buckets.d30} color="info" />
        <AgingBucket label="31–60 days" amount={buckets.d60} color="warning" />
        <AgingBucket label="61–90 days" amount={buckets.d90} color="warning" />
        <AgingBucket label="90+ days" amount={buckets.d90plus} color="error" />
      </Box>

      <TableContainer sx={{ maxHeight: 500 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Admission #</TableCell>
              <TableCell>Class</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell>Days overdue</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.studentId} hover>
                <TableCell sx={{ fontWeight: 500 }}>{r.studentName}</TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                  {r.admissionNumber}
                </TableCell>
                <TableCell>{r.className || "—"}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "error.main" }}>
                  {formatKES(r.balance)}
                </TableCell>
                <TableCell>{r.daysOverdue || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function AgingBucket({ label, amount, color }) {
  return (
    <Card sx={{ p: 2, borderLeft: 4, borderColor: `${color}.main` }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {formatKES(amount)}
      </Typography>
    </Card>
  );
}

// --------------------------------------------------------------------------
// Collections report
// --------------------------------------------------------------------------
function CollectionsReport({ yearId }) {
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("");

  const { data, loading } = useAsync(
    () => feesApi.listPayments({ from, to, method: method || undefined }),
    [from, to, method],
  );

  const payments = Array.isArray(data) ? data : [];

  // Group by method
  const byMethod = {};
  payments.forEach((p) => {
    byMethod[p.methodLabel] = (byMethod[p.methodLabel] || 0) + Number(p.amount);
  });

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  const exportCsv = () => {
    const csv = [
      ["Date", "Student", "Method", "Reference", "Amount"],
      ...payments.map((p) => [
        p.paid_on,
        p.studentName,
        p.methodLabel,
        p.mpesa_receipt_number || p.reference || "",
        p.amount,
      ]),
    ]
      .map((r) => r.map((c) => `"${c ?? ""}"`).join(","))
      .join("\n");
    download(csv, `collections-${from}-to-${to}.csv`);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} flexwrap="wrap" useFlexGap>
        <TextField
          label="From"
          type="date"
          size="small"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Method</InputLabel>
          <Select value={method} label="Method" onChange={(e) => setMethod(e.target.value)}>
            <MenuItem value="">All methods</MenuItem>
            {PAYMENT_METHODS.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<DownloadIcon />} onClick={exportCsv} disabled={payments.length === 0}>
          Export CSV
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        }}
      >
        <Card sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Total collected
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {formatKES(total)}
          </Typography>
        </Card>
        <Card sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Transactions
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {payments.length}
          </Typography>
        </Card>
        <Card sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Average
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {payments.length ? formatKES(total / payments.length) : "—"}
          </Typography>
        </Card>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2">By method</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Method</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(byMethod).map(([m, amount]) => (
                <TableRow key={m}>
                  <TableCell>{m}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatKES(amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.paid_on}</TableCell>
                  <TableCell>{p.studentName}</TableCell>
                  <TableCell>{p.methodLabel}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                    {p.mpesa_receipt_number || p.reference || "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, color: "success.main" }}>
                    {formatKES(p.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}

// --------------------------------------------------------------------------
// Outstanding by grade
// --------------------------------------------------------------------------
function ByGradeReport({ rows }) {
  const total = rows.reduce((s, r) => s + Number(r.balance || 0), 0);

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Total outstanding across all grades
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {formatKES(total)}
        </Typography>
      </Card>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Grade</TableCell>
              <TableCell align="right">Students owing</TableCell>
              <TableCell align="right">Total outstanding</TableCell>
              <TableCell align="right">Average balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.gradeLevel}>
                <TableCell sx={{ fontWeight: 500 }}>{r.gradeLevel}</TableCell>
                <TableCell align="right">{r.studentCount}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "error.main" }}>
                  {formatKES(r.balance)}
                </TableCell>
                <TableCell align="right">
                  {formatKES(r.studentCount ? Number(r.balance) / r.studentCount : 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function download(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
