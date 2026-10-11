"use client";

import { Box, Stack, Tooltip, Typography } from "@mui/material";

/**
 * 30-day color grid.
 * Props: records = [{ date: "2026-10-08", status: "present" }, ...]
 *        days = 30
 */
export function AttendanceGrid({ records = [], days = 30 }) {
  const byDate = new Map(records.map((r) => [r.date, r.status]));

  const cells = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const status = byDate.get(iso);
    cells.push({ iso, status, weekday: d.getDay() });
  }

  const colorFor = (status) => {
    if (status === "present") return "#4caf50";
    if (status === "late") return "#ff9800";
    if (status === "excused") return "#03a9f4";
    if (status === "absent") return "#f44336";
    return "#eeeeee";
  };

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        Last {days} days
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(15, 1fr)",
          gap: 0.5,
        }}
      >
        {cells.map((c) => (
          <Tooltip key={c.iso} title={`${c.iso} · ${c.status || "no record"}`}>
            <Box
              sx={{
                aspectRatio: "1",
                bgcolor: c.weekday === 0 || c.weekday === 6 ? "#f5f5f5" : colorFor(c.status),
                borderRadius: 0.5,
                border: "1px solid #e0e0e0",
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        <Legend color="#4caf50" label="Present" />
        <Legend color="#ff9800" label="Late" />
        <Legend color="#03a9f4" label="Excused" />
        <Legend color="#f44336" label="Absent" />
        <Legend color="#eeeeee" label="No record" />
      </Stack>
    </Stack>
  );
}

function Legend({ color, label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Box sx={{ width: 12, height: 12, bgcolor: color, borderRadius: 0.5 }} />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}
