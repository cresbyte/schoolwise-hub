"use client";

import { DataState } from "@/components/DataState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import LockIcon from "@mui/icons-material/Lock";
import SaveIcon from "@mui/icons-material/Save";
import ScheduleIcon from "@mui/icons-material/Schedule";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";

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

function isToday(date) {
  const today = new Date();
  const d = new Date(date);
  return today.toDateString() === d.toDateString();
}

export default function AttendanceEntryPage() {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [selectedClassId, setSelectedClassId] = useState("");
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [records, setRecords] = useState({}); // "studentId_date" -> status (null = not marked)
  const [saving, setSaving] = useState(false);

  const { data: classes } = useAsync(() => api.getClasses(), []);
  const classList = classes || [];

  // Filter classes based on role
  const myClasses = useMemo(() => {
    if (!user) return [];
    if (["admin", "headteacher", "deputy"].includes(user.role)) {
      return classList;
    }
    return classList.filter((c) => {
      const teacherId = c.classTeacherId || c.class_teacher_id || c.class_teacher;
      return String(teacherId) === String(user.id);
    });
  }, [classList, user]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const weekEnd = weekDates[4];

  // Fetch existing attendance
  const {
    data: existingRecords,
    loading,
    refetch,
  } = useAsync(
    () =>
      selectedClassId
        ? api.getAttendance(selectedClassId, formatDate(weekStart), formatDate(weekEnd))
        : Promise.resolve([]),
    [selectedClassId, formatDate(weekStart), formatDate(weekEnd)],
  );

  const { data: students, loading: studentsLoading } = useAsync(
    () => (selectedClassId ? api.getStudentsByClass(selectedClassId) : Promise.resolve([])),
    [selectedClassId],
  );

  const studentList = Array.isArray(students) ? students : students?.results || [];

  // Initialize records — ONLY from existing data, NO default "present"
  useEffect(() => {
    if (studentList.length === 0) return;

    const existingMap = {};
    (existingRecords || []).forEach((r) => {
      const studentId = r.student || r.studentId || r.student_id;
      const date = r.date;
      existingMap[`${studentId}_${date}`] = r.status;
    });

    const initial = {};
    studentList.forEach((s) => {
      weekDates.forEach((d) => {
        const key = `${s.id}_${formatDate(d)}`;
        // Only pre-fill if there's an existing record; otherwise leave null (empty)
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
          // Skip future dates entirely
          const dCopy = new Date(d);
          dCopy.setHours(0, 0, 0, 0);
          if (dCopy > today) return;

          const key = `${s.id}_${formatDate(d)}`;
          const status = records[key];
          // Only send records that have been explicitly marked
          if (status) {
            payload.push({
              student: s.id,
              date: formatDate(d),
              status: status,
              remarks: "",
            });
          }
        });
      });

      if (payload.length === 0) {
        showNotification("No attendance marked to save", "info");
        setSaving(false);
        return;
      }

      const result = await api.saveAttendanceBulk(payload);
      const savedCount = result.saved || payload.length;
      const errorCount = result.errors?.length || 0;

      if (errorCount > 0) {
        showNotification(`Saved ${savedCount}, ${errorCount} errors`, "warning");
      } else {
        showNotification(`Attendance saved (${savedCount} records)`, "success");
      }
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
    // Don't allow navigating to future weeks
    const todayMonday = getMonday(new Date());
    if (newWeek > todayMonday) {
      showNotification("Cannot view future weeks", "info");
      return;
    }
    setWeekStart(newWeek);
  };

  // Stats — only count explicitly marked records
  const weekStats = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    Object.entries(records).forEach(([key, status]) => {
      // Only count past/today dates
      const dateStr = key.split("_").slice(1).join("_");
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d > today) return;

      if (status && counts[status] !== undefined) {
        counts[status]++;
      } else if (!status) {
        counts.unmarked++;
      }
    });
    return counts;
  }, [records]);

  const getStudentName = (s) => {
    const firstName = s.firstName || s.first_name || "";
    const lastName = s.lastName || s.last_name || "";
    return `${firstName} ${lastName}`.trim() || s.studentName || "Unknown";
  };

  const getAdmissionNumber = (s) => {
    return s.admissionNumber || s.admission_number || s.admNo || "N/A";
  };

  const selectedClass = classList.find((c) => c.id === selectedClassId);

  // Count how many editable cells have been marked
  const markedCount = Object.entries(records).filter(([key, status]) => {
    if (!status) return false;
    const dateStr = key.split("_").slice(1).join("_");
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d <= today;
  }).length;

  return (
    <DashboardLayout>
      <PageHeader title="Attendance Entry" subtitle="Mark daily attendance for your classes" />

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignitems="center"
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClassId}
              label="Class"
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {myClasses.length === 0 ? (
                <MenuItem disabled>You are not assigned as a class teacher</MenuItem>
              ) : (
                myClasses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

          {/* Week Navigation */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => navigateWeek(-1)} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Typography
              variant="body1"
              fontWeight={600}
              sx={{ minWidth: 200, textAlign: "center" }}
            >
              {weekStart.toLocaleDateString("en-KE", { day: "numeric", month: "short" })} -{" "}
              {weekEnd.toLocaleDateString("en-KE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Typography>
            <IconButton onClick={() => navigateWeek(1)} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Card>

      {!selectedClassId ? (
        <Card sx={{ p: 6, textAlign: "center" }}>
          <Typography color="text.secondary">
            {myClasses.length === 0
              ? "You are not assigned as a class teacher for any class."
              : "Select a class above to begin marking attendance"}
          </Typography>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <Card sx={{ p: 2, mb: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Week summary:
              </Typography>
              {STATUS_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={`${opt.label}: ${weekStats[opt.value] || 0}`}
                  color={opt.color}
                  size="small"
                  variant="outlined"
                />
              ))}
              <Chip
                label={`Unmarked: ${weekStats.unmarked}`}
                color="default"
                size="small"
                variant="outlined"
              />
            </Stack>
          </Card>

          {/* Weekly Attendance Grid */}
          <Card>
            <DataState
              loading={loading || studentsLoading}
              data={studentList}
              isEmpty={(d) => !d || d.length === 0}
              emptyMessage="No students in this class"
            >
              {() => (
                <>
                  <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              position: "sticky",
                              left: 0,
                              bgcolor: "background.paper",
                              zIndex: 2,
                              minWidth: 150,
                            }}
                          >
                            Student
                          </TableCell>
                          {weekDates.map((d, i) => {
                            const future = isFuture(d);
                            const today = isToday(d);
                            return (
                              <TableCell
                                key={i}
                                align="center"
                                sx={{
                                  fontWeight: 700,
                                  minWidth: isMobile ? 80 : 120,
                                  bgcolor: today
                                    ? "action.selected"
                                    : future
                                      ? "action.disabledBackground"
                                      : "background.paper",
                                  opacity: future ? 0.5 : 1,
                                }}
                              >
                                <Typography variant="caption" display="block">
                                  {d.toLocaleDateString("en-KE", { weekday: "short" })}
                                </Typography>
                                <Typography variant="body2">
                                  {d.toLocaleDateString("en-KE", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </Typography>
                                {future && (
                                  <LockIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {studentList.map((s) => (
                          <TableRow key={s.id} hover>
                            <TableCell
                              sx={{
                                position: "sticky",
                                left: 0,
                                bgcolor: "background.paper",
                                zIndex: 1,
                              }}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {getStudentName(s)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getAdmissionNumber(s)}
                              </Typography>
                            </TableCell>
                            {weekDates.map((d, i) => {
                              const key = `${s.id}_${formatDate(d)}`;
                              const currentStatus = records[key];
                              const future = isFuture(d);

                              return (
                                <TableCell
                                  key={i}
                                  align="center"
                                  sx={{
                                    bgcolor: future ? "action.disabledBackground" : "transparent",
                                    opacity: future ? 0.5 : 1,
                                  }}
                                >
                                  {future ? (
                                    <Typography variant="caption" color="text.disabled">
                                      —
                                    </Typography>
                                  ) : (
                                    <Stack
                                      direction={isMobile ? "column" : "row"}
                                      spacing={0.3}
                                      justifyContent="center"
                                    >
                                      {STATUS_OPTIONS.map((opt) => (
                                        <Tooltip key={opt.value} title={opt.label}>
                                          <IconButton
                                            size="small"
                                            color={
                                              currentStatus === opt.value ? opt.color : "default"
                                            }
                                            onClick={() => handleStatusChange(s.id, d, opt.value)}
                                            sx={{
                                              border: 1,
                                              borderColor:
                                                currentStatus === opt.value
                                                  ? `${opt.color}.main`
                                                  : "divider",
                                              bgcolor:
                                                currentStatus === opt.value
                                                  ? `${opt.color}.lighter`
                                                  : "transparent",
                                              padding: "4px",
                                            }}
                                          >
                                            <opt.icon sx={{ fontSize: isMobile ? 16 : 20 }} />
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

                  {/* Sticky Save Button */}
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: 1,
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      position: { xs: "sticky", md: "static" },
                      bottom: 0,
                      zIndex: 10,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {selectedClass?.name} • {markedCount} records marked
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={saving || markedCount === 0}
                    >
                      {saving ? "Saving..." : "Save Attendance"}
                    </Button>
                  </Box>
                </>
              )}
            </DataState>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
