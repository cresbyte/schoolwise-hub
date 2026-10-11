"use client";

import { useState, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { academicsApi } from "@/lib/academicsApi";
import { attendanceApi, todayISO } from "@/lib/attendanceApi";

export default function AttendanceReportPage() {
  return (
    <>
      <PageGuard permission="attendance.view">
        <ReportContent />
      </PageGuard>
    </>
  );
}

function ReportContent() {
  const today = todayISO();
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const [classId, setClassId] = useState("");
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data: classesData, loading: classesLoading } = useAsync(
    () => academicsApi.getClasses({ current: 1 }),
    [],
  );
  const classes = Array.isArray(classesData) ? classesData : [];

  const { data, loading, error, refetch } = useAsync(async () => {
    if (!classId || !from || !to) return null;
    const result = await attendanceApi.getClassSummary(classId, from, to);
    return result;
  }, [classId, from, to]);

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const students = data?.students ?? [];

  const handleExport = () => {
    if (students.length === 0) return notify("Nothing to export", "error");
    const rows = [
      ["Student", "School days", "Present", "Absent", "Late", "Excused", "Attendance %"],
      ...students.map((s) => [
        s.studentName,
        s.school_days,
        s.present,
        s.absent,
        s.late,
        s.excused,
        `${(s.attendance_rate * 100).toFixed(1)}%`,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${data?.classRoom?.name || "class"}-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Attendance report"
        subtitle="Per-student attendance rate for a class and date range."
        actions={
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={students.length === 0}
          >
            Export CSV
          </Button>
        }
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <FormControl size="small" sx={{ minWidth: 220 }} disabled={classesLoading}>
            <InputLabel>Class</InputLabel>
            <Select value={classId} label="Class" onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} · {c.gradeLevel}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="From"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
        </Stack>
      </Card>

      {!classId && <Alert severity="info">Pick a class to see the report.</Alert>}

      {classId && (
        <DataState
          loading={loading}
          error={error}
          data={data}
          onRetry={refetch}
          isEmpty={() => students.length === 0}
          emptyMessage="No data for this class and date range."
        >
          {() => (
            <>
              <Card sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={3} flexwrap="wrap" useFlexGap>
                  <Stat label="Students" value={students.length} />
                  <Stat
                    label="Average rate"
                    value={`${(
                      (students.reduce((s, r) => s + r.attendance_rate, 0) / students.length) *
                      100
                    ).toFixed(1)}%`}
                  />
                  <Stat
                    label="Below 80%"
                    value={students.filter((s) => s.attendance_rate < 0.8).length}
                    color="error"
                  />
                </Stack>
              </Card>

              <Card>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell align="right">School days</TableCell>
                        <TableCell align="right">Present</TableCell>
                        <TableCell align="right">Absent</TableCell>
                        <TableCell align="right">Late</TableCell>
                        <TableCell align="right">Excused</TableCell>
                        <TableCell align="right" sx={{ minWidth: 200 }}>
                          Rate
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((s) => {
                        const pct = s.attendance_rate * 100;
                        const color = pct >= 90 ? "success" : pct >= 80 ? "warning" : "error";
                        return (
                          <TableRow key={s.studentId} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{s.studentName}</TableCell>
                            <TableCell align="right">{s.school_days}</TableCell>
                            <TableCell align="right">{s.present}</TableCell>
                            <TableCell align="right">{s.absent}</TableCell>
                            <TableCell align="right">{s.late}</TableCell>
                            <TableCell align="right">{s.excused}</TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(pct, 100)}
                                  color={color}
                                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ minWidth: 50, textAlign: "right" }}
                                >
                                  {pct.toFixed(1)}%
                                </Typography>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </>
          )}
        </DataState>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function Stat({ label, value, color }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" color={color ? `${color}.main` : "text.primary"}>
        {value}
      </Typography>
    </Box>
  );
}
