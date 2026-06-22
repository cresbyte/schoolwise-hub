"use client";

/**
 * Advanced Weekly Attendance Matrix.
 * Grouped by Term and Week for efficiency.
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

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import TimerIcon from "@mui/icons-material/Timer";
import InfoIcon from "@mui/icons-material/Info";
import SaveIcon from "@mui/icons-material/Save";
import FlashOnIcon from "@mui/icons-material/FlashOn";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ClassSelect } from "@/components/ClassSelect";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { formatDate, getWeeksInRange, getDaysInWeek } from "@/lib/utils";
import type { AttendanceRecord, AttendanceStatus, Student } from "@/lib/types";

const STATUS_CONFIG: Record<AttendanceStatus, { icon: any; color: string; label: string; shortcut: string }> = {
  present: { icon: <CheckCircleIcon fontSize="small" />, color: "#2E7D32", label: "Present", shortcut: "P" },
  absent: { icon: <CancelIcon fontSize="small" />, color: "#C62828", label: "Absent", shortcut: "A" },
  late: { icon: <TimerIcon fontSize="small" />, color: "#EF6C00", label: "Late", shortcut: "L" },
  excused: { icon: <InfoIcon fontSize="small" />, color: "#1565C0", label: "Excused", shortcut: "E" },
};

export default function AttendancePage() {
  const settings = useAsync(() => api.getSchoolSettings(), []);
  
  return (
    <DashboardLayout>
      <PageHeader title="Attendance Register" subtitle="Weekly matrix view for efficient recording" />
      <DataState loading={settings.loading} error={settings.error} data={settings.data}>
        {(s) => <AttendanceMatrix settings={s} />}
      </DataState>
    </DashboardLayout>
  );
}

function AttendanceMatrix({ settings }: { settings: any }) {
  const { showNotification } = useNotification();
  const [classId, setClassId] = useState("");
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  // Calculate available weeks in the current term
  const weeks = useMemo(() => {
    return getWeeksInRange(new Date(settings.termStartDate), new Date(settings.termEndDate));
  }, [settings.termStartDate, settings.termEndDate]);

  const currentWeek = weeks[selectedWeekIdx] || weeks[0];
  const days = useMemo(() => getDaysInWeek(currentWeek.start), [currentWeek]);

  // Fetch students and existing attendance
  const students = useAsync(() => (classId ? api.getStudentsByClass(classId) : Promise.resolve([])), [classId]);
  const existingAttendance = useAsync(
    () => (classId ? api.getAttendanceRange(classId, days[0].toISOString().slice(0,10), days[6].toISOString().slice(0,10)) : Promise.resolve([])),
    [classId, days]
  );

  // State for the grid: [studentId][dateString] = status
  const [grid, setGrid] = useState<Record<string, Record<string, AttendanceStatus>>>({});

  useEffect(() => {
    if (students.data && existingAttendance.data) {
      const initialGrid: any = {};
      const attData = existingAttendance.data || [];
      students.data.forEach((s: Student) => {
        initialGrid[s.id] = {};
        days.forEach(d => {
          const iso = d.toISOString().slice(0, 10);
          const found = attData.find((a: AttendanceRecord) => a.studentId === s.id && a.date === iso);
          initialGrid[s.id][iso] = found ? found.status : "present"; 
        });
      });
      setGrid(initialGrid);
    }
  }, [students.data, existingAttendance.data, days]);

  const toggleStatus = (studentId: string, date: string) => {
    const statuses: AttendanceStatus[] = ["present", "absent", "late", "excused"];
    setGrid(prev => {
      const current = prev[studentId]?.[date] || "present";
      const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
      return {
        ...prev,
        [studentId]: { ...prev[studentId], [date]: statuses[nextIdx] }
      };
    });
  };

  const markAllDay = (dateString: string, status: AttendanceStatus) => {
    setGrid(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(sid => {
        next[sid] = { ...next[sid], [dateString]: status };
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const records: AttendanceRecord[] = [];
    const studentList = students.data || [];
    
    studentList.forEach((s: Student) => {
      days.forEach(d => {
        const iso = d.toISOString().slice(0, 10);
        records.push({
          id: `att-${s.id}-${iso}`,
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          classId,
          date: iso,
          status: grid[s.id]?.[iso] || "present",
          recordedBy: "Staff Member",
          recordedAt: new Date().toISOString(),
          parentNotified: grid[s.id]?.[iso] === "absent",
        });
      });
    });

    await api.saveAttendanceBulk(records);
    setSaving(false);
    showNotification("Weekly attendance saved successfully", "success");
    existingAttendance.refetch();
  };

  const isHoliday = (date: Date) => date.getDay() === 0 || date.getDay() === 6; // Sunday/Saturday as weekend visually

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <ClassSelect value={classId} onChange={setClassId} allOption={false} label="Select Class" />
            <TextField
              select
              size="small"
              label="Select Week"
              value={selectedWeekIdx}
              onChange={(e) => setSelectedWeekIdx(Number(e.target.value))}
              sx={{ minWidth: 250 }}
            >
              {weeks.map((w, i) => (
                <MenuItem key={i} value={i}>
                  Week {i + 1}: {w.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
             <Alert severity="info" icon={<InfoIcon fontSize="small" />} sx={{ py: 0, '& .MuiAlert-message': { py: 0.5 } }}>
               Parents are auto-notified of absences
             </Alert>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!classId || saving || students.loading}
            >
              {saving ? "Saving..." : "Save All Changes"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {!classId ? (
        <Card sx={{ p: 4, textAlign: "center", bgcolor: "action.hover" }}>
          <Typography color="text.secondary">Please select a class to start recording attendance.</Typography>
        </Card>
      ) : (
        <DataState loading={students.loading || existingAttendance.loading} error={students.error || existingAttendance.error} data={students.data}>
          {(studentList: Student[]) => (
            <TableContainer component={Card} sx={{ border: 1, borderColor: "divider" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ minWidth: 200, fontWeight: 800, borderRight: 1, borderColor: "divider" }}>Student Name</TableCell>
                    {days.map((d, i) => {
                      const iso = d.toISOString().slice(0, 10);
                      const holiday = isHoliday(d);
                      return (
                        <TableCell key={i} align="center" sx={{ borderRight: 1, borderColor: "divider", p: 1, bgcolor: holiday ? "rgba(0,0,0,0.02)" : "inherit" }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{d.getDate()}</Typography>
                          <Box sx={{ mt: 1 }}>
                            <Tooltip title={`Mark all ${iso} as Present`}>
                              <IconButton size="small" onClick={() => markAllDay(iso, "present")}><FlashOnIcon fontSize="small" sx={{ color: "success.main", fontSize: 16 }} /></IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentList.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600, borderRight: 1, borderColor: "divider" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.firstName} {s.lastName}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.admissionNumber}</Typography>
                      </TableCell>
                      {days.map((d, i) => {
                        const iso = d.toISOString().slice(0, 10);
                        const status = grid[s.id]?.[iso] || "present";
                        const config = STATUS_CONFIG[status];
                        return (
                          <TableCell 
                            key={i} 
                            align="center" 
                            onClick={() => toggleStatus(s.id, iso)}
                            sx={{ 
                              cursor: "pointer", 
                              borderRight: 1, 
                              borderColor: "divider",
                              bgcolor: status === "present" ? "transparent" : `${config.color}08`,
                              transition: "background 0.2s",
                              "&:hover": { bgcolor: "action.hover" }
                            }}
                          >
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <Box sx={{ color: config.color }}>{config.icon}</Box>
                              <Typography variant="caption" sx={{ fontWeight: 900, fontSize: 10, color: config.color }}>{config.shortcut}</Typography>
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      )}

      <Card sx={{ mt: 3, p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Legend & Shortcuts</Typography>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ color: cfg.color, display: "flex" }}>{cfg.icon}</Box>
              <Typography variant="body2">{cfg.label} ({cfg.shortcut})</Typography>
            </Box>
          ))}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
            <FlashOnIcon fontSize="small" sx={{ color: "success.main" }} />
            <Typography variant="body2" color="text.secondary">Bulk Mark Day as Present</Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
