"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Card,
  Stack,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CoffeeIcon from "@mui/icons-material/Coffee";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { academicsApi, DAYS } from "@/lib/academicsApi";
import { schoolApi } from "@/lib/schoolApi";

export default function TimetablePage() {
  return (
    <>
      <PageGuard permission="timetable.view">
        <TimetableContent />
      </PageGuard>
    </>
  );
}

// Default bell schedule — matches the backend generate_auto defaults
const DEFAULT_BELL = [
  { period: 1, start: "08:00", end: "08:40", isBreak: false },
  { period: 2, start: "08:40", end: "09:20", isBreak: false },
  { period: 3, start: "09:20", end: "10:00", isBreak: false },
  { period: 4, start: "10:00", end: "10:30", isBreak: true, breakName: "Tea Break" },
  { period: 5, start: "10:30", end: "11:10", isBreak: false },
  { period: 6, start: "11:10", end: "11:50", isBreak: false },
  { period: 7, start: "11:50", end: "12:30", isBreak: false },
  { period: 8, start: "12:30", end: "13:30", isBreak: true, breakName: "Lunch Break" },
  { period: 9, start: "13:30", end: "14:10", isBreak: false },
  { period: 10, start: "14:10", end: "14:50", isBreak: false },
];

function TimetableContent() {
  const [yearFilter, setYearFilter] = useState("");
  const [classId, setClassId] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [editingSlot, setEditingSlot] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useAsync(async () => {
    const [classes, years, subjects, assignments, staff] = await Promise.all([
      academicsApi.getClasses(yearFilter ? { academic_year: yearFilter } : {}),
      schoolApi.getAcademicYears(),
      academicsApi.getSubjects(),
      classId ? academicsApi.getClassAssignments(classId) : [],
      [],
    ]);
    const cls = Array.isArray(classes) ? classes : [];
    if (!classId && cls.length > 0) setClassId(cls[0].id);

    const timetable = classId ? await academicsApi.getClassTimetable(classId) : [];

    return {
      classes: cls,
      years: Array.isArray(years) ? years : [],
      subjects: Array.isArray(subjects) ? subjects : [],
      assignments: Array.isArray(assignments) ? assignments : [],
      timetable: Array.isArray(timetable) ? timetable : [],
    };
  }, [classId, yearFilter]);

  const classes = data?.classes ?? [];
  const subjects = data?.subjects ?? [];
  const assignments = data?.assignments ?? [];
  const timetable = data?.timetable ?? [];
  const selectedClass = classes.find((c) => c.id === classId);

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  // Build a grid: day → period → slot (or null)
  const grid = useMemo(() => {
    const g = {};
    DAYS.forEach((d) => {
      g[d] = {};
      DEFAULT_BELL.forEach((b) => {
        g[d][b.period] = null;
      });
    });
    timetable.forEach((slot) => {
      if (g[slot.day]) g[slot.day][slot.periodNumber] = slot;
    });
    return g;
  }, [timetable]);

  const hasAssignments = assignments.length > 0;

  const handleGenerate = async () => {
    setSaving(true);
    try {
      await academicsApi.generateTimetable(classId, false);
      notify("Timetable generated from assignments");
      refetch();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear the entire timetable for this class?")) return;
    setSaving(true);
    try {
      await academicsApi.saveTimetable(classId, []);
      notify("Timetable cleared");
      refetch();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSlotSave = async (slotData) => {
    setSaving(true);
    try {
      const existing = grid[slotData.day]?.[slotData.periodNumber];
      const payload = {
        classId,
        day: slotData.day,
        periodNumber: slotData.periodNumber,
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        isBreak: slotData.isBreak,
        breakName: slotData.breakName || null,
        subjectId: slotData.isBreak ? null : slotData.subjectId || null,
        teacherId: slotData.isBreak ? null : slotData.teacherId || null,
      };

      if (existing) {
        await academicsApi.updateSlot(existing.id, payload);
      } else {
        await academicsApi.createSlot(payload);
      }
      notify("Slot saved");
      setEditingSlot(null);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSlotDelete = async (slot) => {
    if (!slot) return;
    try {
      await academicsApi.deleteSlot(slot.id);
      notify("Slot cleared");
      setEditingSlot(null);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle="Weekly schedule for each class. Assignments drive the auto-generator."
        actions={
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={yearFilter}
                label="Year"
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setClassId("");
                }}
              >
                <MenuItem value="">All</MenuItem>
                {data?.years.map((y) => (
                  <MenuItem key={y.id} value={y.id}>
                    {y.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Class</InputLabel>
              <Select value={classId} label="Class" onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <RoleGuard permission="timetable.manage">
              <Tooltip title={hasAssignments ? "" : "Assign teachers to subjects first"}>
                <span>
                  <Button
                    variant="contained"
                    startIcon={<AutoFixHighIcon />}
                    onClick={handleGenerate}
                    disabled={!hasAssignments || saving}
                  >
                    Auto-generate
                  </Button>
                </span>
              </Tooltip>
            </RoleGuard>
            <RoleGuard permission="timetable.manage">
              <Button color="inherit" onClick={handleClear} disabled={saving}>
                Clear
              </Button>
            </RoleGuard>
          </Stack>
        }
      />

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() => (
          <>
            {!selectedClass ? (
              <Card sx={{ p: 6, textAlign: "center" }}>
                <Typography variant="h6">Select a class</Typography>
              </Card>
            ) : (
              <Card>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6">{selectedClass.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedClass.gradeLevel} · Stream {selectedClass.stream}
                  </Typography>
                </Box>
                <Divider />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 90 }}>Period</TableCell>
                        <TableCell sx={{ minWidth: 110 }}>Time</TableCell>
                        {DAYS.slice(0, 5).map((d) => (
                          <TableCell key={d} align="center">
                            {d}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {DEFAULT_BELL.map((bell) => (
                        <TableRow key={bell.period} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {bell.isBreak ? (
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <CoffeeIcon fontSize="small" color="action" />
                                <span>{bell.breakName}</span>
                              </Stack>
                            ) : (
                              `P${bell.period}`
                            )}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                            {bell.start} – {bell.end}
                          </TableCell>
                          {DAYS.slice(0, 5).map((day) => {
                            const slot = grid[day]?.[bell.period];
                            if (bell.isBreak) {
                              return (
                                <TableCell
                                  key={day}
                                  align="center"
                                  sx={{ bgcolor: "action.hover", color: "text.secondary" }}
                                >
                                  {bell.breakName}
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell key={day} align="center" sx={{ p: 0.5 }}>
                                <RoleGuard
                                  permission="timetable.manage"
                                  fallback={
                                    slot ? (
                                      <SlotChip slot={slot} />
                                    ) : (
                                      <span style={{ color: "#bbb" }}>—</span>
                                    )
                                  }
                                >
                                  <SlotCell
                                    slot={slot}
                                    onClick={() =>
                                      setEditingSlot({
                                        day,
                                        periodNumber: bell.period,
                                        startTime: bell.start,
                                        endTime: bell.end,
                                        subjectId: slot?.subjectId || "",
                                        teacherId: slot?.teacherId || "",
                                      })
                                    }
                                  />
                                </RoleGuard>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </>
        )}
      </DataState>

      {editingSlot && (
        <SlotDialog
          open={!!editingSlot}
          slot={editingSlot}
          existing={grid[editingSlot.day]?.[editingSlot.periodNumber]}
          subjects={subjects}
          assignments={assignments}
          selectedClass={selectedClass}
          onClose={() => setEditingSlot(null)}
          onSave={handleSlotSave}
          onDelete={() => handleSlotDelete(grid[editingSlot.day]?.[editingSlot.periodNumber])}
          saving={saving}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function SlotChip({ slot }) {
  if (slot.isBreak) {
    return <Chip size="small" variant="outlined" label={slot.breakName || "Break"} />;
  }
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
        {slot.subjectName || "—"}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {slot.teacherName || "—"}
      </Typography>
    </Box>
  );
}

function SlotCell({ slot, onClick }) {
  if (slot) {
    return (
      <Box
        onClick={onClick}
        sx={{
          cursor: "pointer",
          p: 0.5,
          borderRadius: 1,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <SlotChip slot={slot} />
      </Box>
    );
  }
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: "pointer",
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1,
        color: "text.disabled",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <EditIcon fontSize="small" />
    </Box>
  );
}

function SlotDialog({
  open,
  slot,
  existing,
  subjects,
  assignments,
  selectedClass,
  onClose,
  onSave,
  onDelete,
  saving,
}) {
  const [form, setForm] = useState({
    subjectId: slot.subjectId || "",
    teacherId: slot.teacherId || "",
    isBreak: existing?.isBreak || false,
    breakName: existing?.breakName || "",
  });

  // Filter subjects offered by this class's grade
  const offeredSubjects = subjects.filter((s) =>
    (s.gradeLevels || []).includes(selectedClass?.gradeLevel),
  );

  // When subject changes, auto-pick the assigned teacher
  const handleSubjectChange = (subjectId) => {
    const assignment = assignments.find((a) => a.subjectId === subjectId);
    setForm((prev) => ({
      ...prev,
      subjectId,
      teacherId: assignment?.teacherId || "",
    }));
  };

  const handleSave = () => {
    onSave({
      ...slot,
      isBreak: form.isBreak,
      breakName: form.breakName,
      subjectId: form.isBreak ? null : form.subjectId,
      teacherId: form.isBreak ? null : form.teacherId,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {slot.day} · Period {slot.periodNumber}
        <Typography variant="body2" color="text.secondary">
          {slot.startTime} – {slot.endTime}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Chip
                label={form.isBreak ? "Break" : "Lesson"}
                color={form.isBreak ? "default" : "primary"}
                onClick={() => setForm((p) => ({ ...p, isBreak: !p.isBreak }))}
              />
            }
            label="Toggle break / lesson"
          />

          {form.isBreak ? (
            <TextField
              label="Break name"
              value={form.breakName}
              onChange={(e) => setForm((p) => ({ ...p, breakName: e.target.value }))}
              fullWidth
            />
          ) : (
            <>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={form.subjectId}
                  label="Subject"
                  onChange={(e) => handleSubjectChange(e.target.value)}
                >
                  <MenuItem value="">— None —</MenuItem>
                  {offeredSubjects.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {form.subjectId && (
                <Alert
                  severity={
                    assignments.find((a) => a.subjectId === form.subjectId) ? "success" : "warning"
                  }
                >
                  {assignments.find((a) => a.subjectId === form.subjectId) ? (
                    <>
                      Teacher:{" "}
                      <strong>
                        {assignments.find((a) => a.subjectId === form.subjectId).teacherName}
                      </strong>
                    </>
                  ) : (
                    "No teacher assigned to this subject yet. Assign one on the Teacher assignments page."
                  )}
                </Alert>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {existing && (
          <Button color="error" onClick={onDelete} disabled={saving} sx={{ mr: "auto" }}>
            Clear slot
          </Button>
        )}
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save slot"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
