"use client";

/**
 * Advanced Weekly Attendance Matrix — backed by the real Django API.
 * @module attendance/page
 */
import { useEffect, useState, useMemo } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import TimerIcon from "@mui/icons-material/Timer";
import InfoIcon from "@mui/icons-material/Info";
import SaveIcon from "@mui/icons-material/Save";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import PeopleIcon from "@mui/icons-material/People";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { PageGuard } from "@/components/common/PageGuard";
import { ClassSelect } from "@/components/ClassSelect";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { getWeeksInRange, getDaysInWeek } from "@/lib/utils";

/** Status display config */
const STATUS_CONFIG = {
  present: { icon: <CheckCircleIcon fontSize="small" />, color: "#2E7D32", bg: "#E8F5E9", label: "Present",  shortcut: "P" },
  absent:  { icon: <CancelIcon    fontSize="small" />, color: "#C62828", bg: "#FFEBEE", label: "Absent",   shortcut: "A" },
  late:    { icon: <TimerIcon     fontSize="small" />, color: "#EF6C00", bg: "#FFF3E0", label: "Late",     shortcut: "L" },
  excused: { icon: <InfoIcon      fontSize="small" />, color: "#1565C0", bg: "#E3F2FD", label: "Excused",  shortcut: "E" },
};

const STATUS_CYCLE = ["present", "absent", "late", "excused"];

// Term date range — ideally fetched from /api/school/settings
const TERM_START = new Date("2026-04-28");
const TERM_END   = new Date("2026-08-15");

export default function AttendancePage() {
  return (
    <DashboardLayout>
      <PageGuard permission="attendance.write">
        <PageHeader
          title="Attendance Register"
          subtitle="Weekly matrix view — click a cell to cycle status"
        />
        <AttendanceMatrix />
      </PageGuard>
    </DashboardLayout>
  );
}

function AttendanceMatrix() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [classId, setClassId] = useState("");
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  // Auto-select class for class teachers
  const staffData = useAsync(
    () => (user?.staffId ? api.getStaffById(user.staffId) : Promise.resolve(null)),
    [user?.staffId]
  );
  useEffect(() => {
    if (user?.role === "class_teacher" && staffData.data?.classId) {
      setClassId(staffData.data.classId);
    }
  }, [user?.role, staffData.data]);

  // Build term weeks
  const weeks = useMemo(() => getWeeksInRange(TERM_START, TERM_END), []);
  const currentWeek = weeks[selectedWeekIdx] ?? weeks[0];
  const days = useMemo(() => getDaysInWeek(currentWeek?.start), [currentWeek]);

  // Fetch students in selected class
  const students = useAsync(
    () => (classId ? api.getStudents({ classId, status: "active" }) : Promise.resolve([])),
    [classId]
  );

  // Fetch existing attendance for the selected week
  const existingAtt = useAsync(
    () => {
      if (!classId || !days.length) return Promise.resolve([]);
      const from = days[0].toISOString().slice(0, 10);
      const to   = days[days.length - 1].toISOString().slice(0, 10);
      return api.getAttendance(classId, from, to);
    },
    [classId, days]
  );

  // Grid: { [studentId]: { [dateIso]: status } }
  const [grid, setGrid] = useState({});

  // Initialise / refresh grid when data changes
  useEffect(() => {
    if (!students.data || !existingAtt.data) return;
    const attMap = {};
    for (const rec of (existingAtt.data ?? [])) {
      if (!attMap[rec.student]) attMap[rec.student] = {};
      attMap[rec.student][rec.date] = rec.status;
    }
    const initial = {};
    for (const s of students.data) {
      initial[s.id] = {};
      for (const d of days) {
        const iso = d.toISOString().slice(0, 10);
        initial[s.id][iso] = attMap[s.id]?.[iso] ?? "present";
      }
    }
    setGrid(initial);
  }, [students.data, existingAtt.data, days]);

  // Summary stats for the week
  const weekStats = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    for (const studentStatuses of Object.values(grid)) {
      for (const s of Object.values(studentStatuses)) {
        counts[s] = (counts[s] ?? 0) + 1;
        counts.total++;
      }
    }
    return counts;
  }, [grid]);

  const toggleStatus = (studentId, dateIso) => {
    setGrid(prev => {
      const curr = prev[studentId]?.[dateIso] ?? "present";
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(curr) + 1) % STATUS_CYCLE.length];
      return { ...prev, [studentId]: { ...prev[studentId], [dateIso]: next } };
    });
  };

  const markAllDay = (dateIso, status) => {
    setGrid(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(sid => {
        updated[sid] = { ...updated[sid], [dateIso]: status };
      });
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = [];
      for (const s of (students.data ?? [])) {
        for (const d of days) {
          const iso = d.toISOString().slice(0, 10);
          records.push({
            student: s.id,
            date: iso,
            status: grid[s.id]?.[iso] ?? "present",
          });
        }
      }
      await api.saveAttendanceBulk(records);
      showNotification(`Attendance saved — ${records.length} records updated`, "success");
      existingAtt.refetch();
    } catch (err) {
      showNotification(err.message || "Failed to save attendance", "error");
    } finally {
      setSaving(false);
    }
  };

  const isWeekend = d => d.getDay() === 0 || d.getDay() === 6;

  return (
    <Box>
      {/* Controls */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <ClassSelect
              value={classId}
              onChange={setClassId}
              allOption={false}
              label="Select Class"
              disabled={user?.role === "class_teacher"}
            />
            <TextField
              select size="small" label="Select Week"
              value={selectedWeekIdx}
              onChange={e => setSelectedWeekIdx(Number(e.target.value))}
              sx={{ minWidth: 260 }}
            >
              {weeks.map((w, i) => (
                <MenuItem key={i} value={i}>Week {i + 1}: {w.label}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Alert severity="info" icon={<InfoIcon fontSize="small" />} sx={{ py: 0, "& .MuiAlert-message": { py: 0.5 } }}>
              Parents are auto-notified of absences
            </Alert>
            <Button
              variant="contained" startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!classId || saving || students.loading}
            >
              {saving ? "Saving…" : "Save All Changes"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Week Stats Bar */}
      {classId && !students.loading && Object.keys(grid).length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: "12px !important" }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mr: 1 }}>
                <PeopleIcon fontSize="small" sx={{ color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Week Summary:
                </Typography>
              </Box>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <Chip
                  key={key}
                  icon={<Box sx={{ color: cfg.color, display: "flex", pl: 0.5 }}>{cfg.icon}</Box>}
                  label={`${cfg.label}: ${weekStats[key] ?? 0}`}
                  size="small"
                  sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, "& .MuiChip-icon": { color: cfg.color } }}
                />
              ))}
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Total entries: {weekStats.total}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Table or empty state */}
      {!classId ? (
        <Card sx={{ p: 6, textAlign: "center", bgcolor: "action.hover" }}>
          <PeopleIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Class Selected
          </Typography>
          <Typography color="text.secondary">
            Select a class above to start recording attendance.
          </Typography>
        </Card>
      ) : (
        <DataState
          loading={students.loading || existingAtt.loading}
          error={students.error || existingAtt.error}
          data={students.data}
          onRetry={() => { students.refetch(); existingAtt.refetch(); }}
          emptyMessage="No active students found in this class."
        >
          {(studentList) =>
            studentList.length === 0 ? (
              <Card sx={{ p: 6, textAlign: "center", bgcolor: "action.hover" }}>
                <Typography color="text.secondary">No active students found in this class.</Typography>
              </Card>
            ) : (
              <TableContainer component={Card} sx={{ border: 1, borderColor: "divider", overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell sx={{ minWidth: 200, fontWeight: 800, borderRight: 1, borderColor: "divider", position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 1 }}>
                        Student
                      </TableCell>
                      {days.map((d, i) => {
                        const iso     = d.toISOString().slice(0, 10);
                        const weekend = isWeekend(d);
                        return (
                          <TableCell key={i} align="center" sx={{ borderRight: 1, borderColor: "divider", p: 1, minWidth: 80, bgcolor: weekend ? "rgba(0,0,0,0.03)" : "inherit", opacity: weekend ? 0.5 : 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                              {d.toLocaleDateString("en-US", { weekday: "short" })}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{d.getDate()}</Typography>
                            {!weekend && (
                              <Box sx={{ mt: 0.5 }}>
                                <Tooltip title={`Mark all ${iso} as Present`} placement="top">
                                  <IconButton size="small" onClick={() => markAllDay(iso, "present")} sx={{ p: 0.25 }}>
                                    <FlashOnIcon fontSize="small" sx={{ color: "success.main", fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentList.map((s, rowIdx) => (
                      <TableRow key={s.id} hover sx={{ "&:nth-of-type(even)": { bgcolor: "action.hover" } }}>
                        <TableCell sx={{ fontWeight: 600, borderRight: 1, borderColor: "divider", position: "sticky", left: 0, bgcolor: rowIdx % 2 === 0 ? "background.paper" : "action.hover", zIndex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.firstName} {s.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.admissionNumber}</Typography>
                        </TableCell>
                        {days.map((d, i) => {
                          const iso    = d.toISOString().slice(0, 10);
                          const status = grid[s.id]?.[iso] ?? "present";
                          const cfg    = STATUS_CONFIG[status];
                          const weekend = isWeekend(d);
                          return (
                            <TableCell
                              key={i}
                              align="center"
                              onClick={() => !weekend && toggleStatus(s.id, iso)}
                              sx={{
                                cursor: weekend ? "default" : "pointer",
                                borderRight: 1,
                                borderColor: "divider",
                                bgcolor: weekend ? "rgba(0,0,0,0.03)" : (status === "present" ? "transparent" : cfg.bg),
                                transition: "background 0.15s",
                                opacity: weekend ? 0.4 : 1,
                                "&:hover": !weekend ? { bgcolor: "action.selected", transform: "scale(1.05)" } : {},
                                userSelect: "none",
                              }}
                            >
                              {!weekend && (
                                <Tooltip title={`${cfg.label} — click to change`} placement="top">
                                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
                                    <Typography variant="caption" sx={{ fontWeight: 900, fontSize: 9, color: cfg.color, letterSpacing: 0.5 }}>
                                      {cfg.shortcut}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          }
        </DataState>
      )}

      {/* Legend */}
      <Card sx={{ mt: 2, p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Legend & Keyboard Hints</Typography>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ color: cfg.color, display: "flex" }}>{cfg.icon}</Box>
              <Typography variant="body2">{cfg.label}</Typography>
              <Chip label={cfg.shortcut} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
            </Box>
          ))}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, ml: "auto" }}>
            <FlashOnIcon fontSize="small" sx={{ color: "success.main" }} />
            <Typography variant="body2" color="text.secondary">= Bulk mark day as Present</Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
