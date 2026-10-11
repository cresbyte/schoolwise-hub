"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PrintIcon from "@mui/icons-material/Print";

import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { staffApi } from "@/lib/staffApi";
import { academicsApi, DAYS } from "@/lib/academicsApi";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function StaffTimetablePage() {
  const { user } = useAuth();

  // Pick today's day tab by default (Monday = 0, Friday = 4)
  const todayIndex = new Date().getDay(); // 1 = Monday, 5 = Friday
  const defaultDayIndex = todayIndex >= 1 && todayIndex <= 5 ? todayIndex - 1 : 0;
  const [selectedDay, setSelectedDay] = useState(defaultDayIndex);
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "weekly"

  const { data, loading, error, refetch } = useAsync(async () => {
    if (!user) return { slots: [], bellSchedules: [] };

    const [slots, bellSchedules] = await Promise.all([
      staffApi.getMyTimetable(user.id),
      academicsApi.getBellSchedules().catch(() => []),
    ]);

    return {
      slots: Array.isArray(slots) ? slots : [],
      bellSchedules: Array.isArray(bellSchedules) ? bellSchedules : [],
    };
  }, [user?.id]);

  const slots = data?.slots || [];
  const bellSchedules = data?.bellSchedules || [];

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const map = {};
    WEEKDAYS.forEach((d, idx) => {
      map[idx] = [];
    });

    slots.forEach((slot) => {
      let dIdx = -1;
      if (typeof slot.day === "number") {
        dIdx = slot.day;
      } else if (typeof slot.day_of_week === "number") {
        dIdx = slot.day_of_week;
      } else {
        const dName = slot.day || slot.day_of_week || "";
        dIdx = WEEKDAYS.findIndex((wd) => wd.toLowerCase() === String(dName).toLowerCase());
      }

      if (dIdx >= 0 && dIdx < WEEKDAYS.length) {
        map[dIdx].push(slot);
      }
    });

    // Sort slots by period or start time
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        if (a.period !== undefined && b.period !== undefined) {
          return Number(a.period) - Number(b.period);
        }
        return (a.startTime || "").localeCompare(b.startTime || "");
      });
    });

    return map;
  }, [slots]);

  const currentDaySlots = slotsByDay[selectedDay] || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            My Teaching Timetable
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Weekly schedule, lesson timings, and classroom allocations
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={viewMode === "daily" ? "contained" : "outlined"}
            onClick={() => setViewMode("daily")}
          >
            Day View
          </Button>
          <Button
            size="small"
            variant={viewMode === "weekly" ? "contained" : "outlined"}
            onClick={() => setViewMode("weekly")}
          >
            Full Week Grid
          </Button>
          <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print
          </Button>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      {viewMode === "daily" ? (
        <Card elevation={1} sx={{ borderRadius: 2 }}>
          <Tabs
            value={selectedDay}
            onChange={(_, val) => setSelectedDay(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
          >
            {WEEKDAYS.map((d, index) => {
              const count = (slotsByDay[index] || []).length;
              return (
                <Tab
                  key={d}
                  label={`${d} (${count})`}
                  sx={{ fontWeight: 600, textTransform: "none" }}
                />
              );
            })}
          </Tabs>

          {currentDaySlots.length === 0 ? (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No teaching periods scheduled for {WEEKDAYS[selectedDay]}.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: 600, width: 90 }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 160 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Class / Stream</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Venue / Room</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, width: 140 }}>
                      Quick Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentDaySlots.map((row, idx) => {
                    const isBreakOrFree =
                      (row.subjectName || row.subject || "").toLowerCase().includes("free") ||
                      (row.subjectName || row.subject || "").toLowerCase().includes("break");

                    return (
                      <TableRow
                        key={idx}
                        hover
                        sx={{ bgcolor: isBreakOrFree ? "action.hover" : "inherit" }}
                      >
                        <TableCell sx={{ fontWeight: 700 }}>#{row.period ?? idx + 1}</TableCell>
                        <TableCell>
                          {row.time ||
                            `${row.startTime || row.start_time || ""} - ${
                              row.endTime || row.end_time || ""
                            }`}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.subjectName || row.subject || "Subject"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {row.className || row.classRoomName || row.classRoom ? (
                            <Chip
                              label={row.className || row.classRoomName || row.classRoom}
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{row.room || row.venue || "Classroom"}</TableCell>
                        <TableCell align="right">
                          {row.classRoomId || row.classId ? (
                            <Button
                              size="small"
                              variant="outlined"
                              component={Link}
                              href={`/staff-portal/attendance?class_room=${row.classRoomId || row.classId}`}
                              startIcon={<EventAvailableIcon />}
                              sx={{ textTransform: "none", fontSize: "0.75rem" }}
                            >
                              Attendance
                            </Button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      ) : (
        /* Full Week Grid View */
        <Card elevation={1} sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 700, width: 120 }}>Day</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Scheduled Teaching Lessons</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {WEEKDAYS.map((d, index) => {
                  const dayList = slotsByDay[index] || [];

                  return (
                    <TableRow key={d} hover>
                      <TableCell sx={{ fontWeight: 700, verticalAlign: "top", pt: 2 }}>
                        {d}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {dayList.length} lesson{dayList.length === 1 ? "" : "s"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        {dayList.length === 0 ? (
                          <Typography variant="caption" color="text.disabled">
                            No lessons scheduled
                          </Typography>
                        ) : (
                          <Stack direction="row" spacing={1} flexwrap="wrap" useFlexGap>
                            {dayList.map((slot, i) => (
                              <Paper
                                key={i}
                                variant="outlined"
                                sx={{
                                  p: 1.25,
                                  borderRadius: 1.5,
                                  minWidth: 150,
                                  bgcolor: "background.paper",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="primary.main"
                                  sx={{ fontWeight: 700 }}
                                >
                                  P{slot.period ?? i + 1} •{" "}
                                  {slot.time || `${slot.startTime || ""} - ${slot.endTime || ""}`}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                                  {slot.subjectName || slot.subject || "Lesson"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {slot.className || slot.classRoomName || slot.classRoom || "All"}
                                </Typography>
                              </Paper>
                            ))}
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
