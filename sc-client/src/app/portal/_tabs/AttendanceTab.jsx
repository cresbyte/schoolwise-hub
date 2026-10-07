"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { DataState } from "@/components/DataState";

const STATUS = {
  present: { label: "Present", short: "P", color: "success" },
  absent: { label: "Absent", short: "A", color: "error" },
  late: { label: "Late", short: "L", color: "warning" },
  excused: { label: "Excused", short: "E", color: "info" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Local YYYY-MM-DD (toISOString would shift the date because of the timezone)
function toKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

// Returns weeks as arrays of 5 dates (Mon-Fri); days outside the month are null
function getWeeks(month) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const lastDay = new Date(year, m + 1, 0).getDate();
  const weeks = [];
  let week = [null, null, null, null, null];

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, m, day);
    const dow = date.getDay(); // 0 = Sun, 6 = Sat
    if (dow === 0 || dow === 6) continue;
    week[dow - 1] = date;
    if (dow === 5) {
      weeks.push(week);
      week = [null, null, null, null, null];
    }
  }
  if (week.some(Boolean)) weeks.push(week);
  return weeks;
}

function StatusMark({ status }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <Box
      title={s.label}
      sx={{
        width: 28,
        height: 28,
        mx: "auto",
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        border: 1,
        borderColor: `${s.color}.main`,
        color: `${s.color}.dark`,
      }}
    >
      {s.short}
    </Box>
  );
}

export function AttendanceTab({ student }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const now = new Date();
  const isCurrentMonth =
    month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();

  const dateFrom = toKey(month);
  const dateTo = toKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const monthLabel = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const { data, loading, error, refetch } = useAsync(
    () => api.getStudentAttendance(student.id, dateFrom, dateTo),
    [student.id, dateFrom, dateTo],
  );

  const records = data || [];

  // Look up a record by day: { "2026-10-07": record }
  const byDate = {};
  records.forEach((r) => {
    byDate[String(r.date).slice(0, 10)] = r;
  });

  const count = (status) => records.filter((r) => r.status === status).length;
  const present = count("present");
  const late = count("late");
  const percentage = records.length ? Math.round(((present + late) / records.length) * 100) : 0;

  const exceptions = records
    .filter((r) => r.status !== "present")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const goToMonth = (offset) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));

  return (
    <Box>
      {/* Month navigation */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Button size="small" onClick={() => goToMonth(-1)}>
          Previous
        </Button>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {monthLabel}
        </Typography>
        <Button size="small" onClick={() => goToMonth(1)} disabled={isCurrentMonth}>
          Next
        </Button>
      </Stack>

      <DataState
        loading={loading}
        error={error}
        data={records}
        onRetry={refetch}
        isEmpty={(d) => d.length === 0}
        emptyMessage={`No attendance recorded for ${monthLabel}`}
      >
        {() => (
          <>
            {/* Summary */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", textAlign: "center" }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {percentage}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Attendance
                  </Typography>
                </Box>
                {Object.entries(STATUS).map(([key, s]) => (
                  <Box key={key}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: `${s.color}.dark` }}>
                      {count(key)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Weekly register */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 1.5 }}>
              <Table size="small" sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    {WEEKDAYS.map((d) => (
                      <TableCell key={d} align="center" sx={{ fontWeight: 700 }}>
                        {d}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getWeeks(month).map((week, i) => (
                    <TableRow key={i}>
                      {week.map((date, j) => (
                        <TableCell key={j} align="center" sx={{ py: 1, px: 0.5 }}>
                          {date && (
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mb: 0.5 }}
                              >
                                {date.getDate()}
                              </Typography>
                              <StatusMark status={byDate[toKey(date)]?.status} />
                            </>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Legend */}
            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", mb: 3 }}>
              {Object.entries(STATUS).map(([key, s]) => (
                <Typography key={key} variant="caption" color="text.secondary">
                  {s.short} = {s.label}
                </Typography>
              ))}
            </Stack>

            {/* Absences and late arrivals */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Absences and late arrivals
            </Typography>
            {exceptions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                None this month.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exceptions.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatDate(r.date)}</TableCell>
                        <TableCell
                          sx={{
                            color: `${STATUS[r.status]?.color || "text"}.dark`,
                            fontWeight: 600,
                          }}
                        >
                          {STATUS[r.status]?.label || r.status}
                        </TableCell>
                        <TableCell>{r.reason || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DataState>
    </Box>
  );
}
