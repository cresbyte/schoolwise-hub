"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box, Button, Card, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Stack, Chip, MenuItem, FormControl,
  InputLabel, Select, IconButton, Tooltip, Divider, Alert
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ScheduleIcon from "@mui/icons-material/Schedule";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LockIcon from "@mui/icons-material/Lock";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "present", label: "Present", color: "success", icon: CheckCircleIcon },
  { value: "absent", label: "Absent", color: "error", icon: CancelIcon },
  { value: "late", label: "Late", color: "warning", icon: ScheduleIcon },
  { value: "excused", label: "Excused", color: "info", icon: EventAvailableIcon },
];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function getWeekDates(monday) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isFuture(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d > today;
}

export function AttendanceTab({ user, staffProfile }) {
  const { showNotification } = useNotification();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [records, setRecords] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch teacher's assigned classes
  const { data: assignments = [] } = useAsync(
    async () => {
      try {
        const res = await api.getClassSubjects({ teacherId: user.staffId || user.id });
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    [user?.staffId, user?.id]
  );

  // Deduplicate classes
  const myClasses = useMemo(() => {
    const seen = new Map();
    (assignments || []).forEach((a) => {
      const classId = a.class_room || a.classId || a.class_room_id;
      const className = a.class_room_name || a.className || a.class_name;
      if (classId && !seen.has(classId)) {
        seen.set(classId, { id: classId, name: className });
      }
    });
    return Array.from(seen.values());
  }, [assignments]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const weekEnd = weekDates[4];

  // Fetch existing attendance
  const { data: existingRecords, loading, refetch } = useAsync(
    () => selectedClassId
      ? api.getAttendance(selectedClassId, formatDate(weekStart), formatDate(weekEnd))
      : Promise.resolve([]),
    [selectedClassId, formatDate(weekStart), formatDate(weekEnd)]
  );

  const { data: students, loading: studentsLoading } = useAsync(
    () => selectedClassId ? api.getStudentsByClass(selectedClassId) : Promise.resolve([]),
    [selectedClassId]
  );

  const studentList = Array.isArray(students) ? students : (students?.results || []);

  // Initialize records
  useEffect(() => {
    if (studentList.length === 0) return;
    const existingMap = {};
    (existingRecords || []).forEach((r) => {
      const studentId = r.student || r.studentId || r.student_id;
      existingMap[`${studentId}_${r.date}`] = r.status;
    });
    const initial = {};
    studentList.forEach((s) => {
      weekDates.forEach((d) => {
        const key = `${s.id}_${formatDate(d)}`;
        initial[key] = existingMap[key] || null;
      });
    });
    setRecords(initial);
  }, [studentList, existingRecords, weekDates]);

  const handleStatusChange = (studentId, date, status) => {
    const key = `${studentId}_${formatDate(date)}`;
    setRecords((prev) => ({ ...prev, [key]: status }));
  };

  const handleSave = async () => {
    if (!selectedClassId) return showNotification("Select a class first", "error");
    setSaving(true);
    try {
      const payload = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      studentList.forEach((s) => {
        weekDates.forEach((d) => {
          const dCopy = new Date(d);
          dCopy.setHours(0, 0, 0, 0);
          if (dCopy > today) return;
          const key = `${s.id}_${formatDate(d)}`;
          const status = records[key];
          if (status) {
            payload.push({ student: s.id, date: formatDate(d), status, remarks: "" });
          }
        });
      });
      if (payload.length === 0) {
        showNotification("No attendance marked to save", "info");
        setSaving(false);
        return;
      }
      const result = await api.saveAttendanceBulk(payload);
      showNotification(`Attendance saved (${result.saved || payload.length} records)`, "success");
      refetch();
    } catch (e) {
      showNotification(e.message || "Failed to save attendance", "error");
    } finally {
      setSaving(false);
    }
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(weekStart);
    newWeek.setDate(newWeek.getDate() + direction * 7);
    const todayMonday = getMonday(new Date());
    if (newWeek > todayMonday) {
      showNotification("Cannot view future weeks", "info");
      return;
    }
    setWeekStart(newWeek);
  };

  const markedCount = Object.entries(records).filter(([key, status]) => {
    if (!status) return false;
    const dateStr = key.split("_").slice(1).join("_");
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d <= today;
  }).length;

  const selectedClass = myClasses.find((c) => c.id === selectedClassId);

  if (myClasses.length === 0) {
    return (
      <Alert severity="info">
        You are not assigned to any classes yet. Please contact the headteacher.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Class</InputLabel>
            <Select value={selectedClassId} label="Class" onChange={(e) => setSelectedClassId(e.target.value)}>
              {myClasses.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => navigateWeek(-1)} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="body1" fontWeight={600} sx={{ minWidth: 200, textAlign: "center" }}>
              {weekStart.toLocaleDateString("en-KE", { day: "numeric", month: "short" })} -{" "}
              {weekEnd.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
            </Typography>
            <IconButton onClick={() => navigateWeek(1)} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Card>

      {!selectedClassId ? (
        <Card sx={{ p: 6, textAlign: "center" }}>
          <Typography color="text.secondary">Select a class above to begin marking attendance</Typography>
        </Card>
      ) : (
        <Card>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell sx={{ fontWeight: 700, position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 2, minWidth: 150 }}>
                    Student
                  </TableCell>
                  {weekDates.map((d, i) => {
                    const future = isFuture(d);
                    return (
                      <TableCell
                        key={i}
                        align="center"
                        sx={{
                          fontWeight: 700,
                          minWidth: 100,
                          bgcolor: future ? "action.disabledBackground" : "background.paper",
                          opacity: future ? 0.5 : 1,
                        }}
                      >
                        <Typography variant="caption" display="block">
                          {d.toLocaleDateString("en-KE", { weekday: "short" })}
                        </Typography>
                        <Typography variant="body2">
                          {d.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                        </Typography>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {studentList.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {s.firstName || s.first_name} {s.lastName || s.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.admissionNumber || s.admission_number}
                      </Typography>
                    </TableCell>
                    {weekDates.map((d, i) => {
                      const key = `${s.id}_${formatDate(d)}`;
                      const currentStatus = records[key];
                      const future = isFuture(d);
                      return (
                        <TableCell key={i} align="center" sx={{ opacity: future ? 0.5 : 1 }}>
                          {future ? (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          ) : (
                            <Stack direction="row" spacing={0.3} justifyContent="center">
                              {STATUS_OPTIONS.map((opt) => (
                                <Tooltip key={opt.value} title={opt.label}>
                                  <IconButton
                                    size="small"
                                    color={currentStatus === opt.value ? opt.color : "default"}
                                    onClick={() => handleStatusChange(s.id, d, opt.value)}
                                    sx={{
                                      border: 1,
                                      borderColor: currentStatus === opt.value ? `${opt.color}.main` : "divider",
                                      bgcolor: currentStatus === opt.value ? `${opt.color}.lighter` : "transparent",
                                      padding: "4px",
                                    }}
                                  >
                                    <opt.icon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              ))}
                            </Stack>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: 1, borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary">
              {selectedClass?.name} · {markedCount} records marked
            </Typography>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || markedCount === 0}>
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </Box>
        </Card>
      )}
    </Box>
  );
}
