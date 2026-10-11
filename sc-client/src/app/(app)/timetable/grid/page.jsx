"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { useClasses } from "@/hooks/domain";
import { academicsApi } from "@/lib/academicsApi";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Fallback school day, used only when no bell schedule is set up for the class's grade.
const DEFAULT_BELL = [
  { periodNumber: 1, startTime: "08:00", endTime: "08:40", isBreak: false },
  { periodNumber: 2, startTime: "08:40", endTime: "09:20", isBreak: false },
  { periodNumber: 3, startTime: "09:20", endTime: "10:00", isBreak: false },
  { periodNumber: 4, startTime: "10:00", endTime: "10:30", isBreak: true, breakName: "Tea Break" },
  { periodNumber: 5, startTime: "10:30", endTime: "11:10", isBreak: false },
  { periodNumber: 6, startTime: "11:10", endTime: "11:50", isBreak: false },
  { periodNumber: 7, startTime: "11:50", endTime: "12:30", isBreak: false },
  {
    periodNumber: 8,
    startTime: "12:30",
    endTime: "13:30",
    isBreak: true,
    breakName: "Lunch Break",
  },
  { periodNumber: 9, startTime: "13:30", endTime: "14:10", isBreak: false },
  { periodNumber: 10, startTime: "14:10", endTime: "14:50", isBreak: false },
];

export default function GridPage() {
  return (
    <>
      <PageGuard permission="timetable.manage">
        <PageHeader
          title="Timetable · Grid"
          subtitle="Place subjects into the week. Teachers come from the assignments."
        />
        <Suspense fallback={<LinearProgress />}>
          <Content>{(classRoom) => <GridPanel classRoom={classRoom} />}</Content>
        </Suspense>
      </PageGuard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Class selection: academic year → grade → stream (stream only if >1 class).
// The chosen class is kept in the URL (?class=<id>) so both pages share it.
// ---------------------------------------------------------------------------
function Content({ children }) {
  const { data } = useClasses();
  const classes = Array.isArray(data) ? data : [];
  const router = useRouter();
  const pathname = usePathname();
  const classId = useSearchParams().get("class") ?? "";
  const select = useCallback(
    (id) => router.replace(`${pathname}?class=${encodeURIComponent(id)}`, { scroll: false }),
    [router, pathname],
  );
  const classRoom = classes.find((c) => String(c.id) === classId) ?? null;

  if (classes.length === 0) {
    return (
      <Alert severity="info">
        No classes available. Create a class for the active academic year first.
      </Alert>
    );
  }
  return (
    <Stack spacing={2}>
      <ClassPicker classes={classes} value={classId} onChange={select} />
      {classRoom ? <Box key={classRoom.id}>{children(classRoom)}</Box> : null}
    </Stack>
  );
}

function ClassPicker({ classes, value, onChange }) {
  const selected = classes.find((c) => String(c.id) === String(value)) ?? null;
  const [yearPick, setYearPick] = useState(null);
  const [gradePick, setGradePick] = useState(null);

  const years = useMemo(() => {
    const m = new Map();
    classes.forEach((c) =>
      m.set(String(c.academicYear), c.academicYearName ?? String(c.academicYear)),
    );
    return [...m]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
  }, [classes]);

  const yearId = years.some((y) => y.id === yearPick)
    ? yearPick
    : selected
      ? String(selected.academicYear)
      : (years[0]?.id ?? "");

  const inYear = useMemo(
    () => classes.filter((c) => String(c.academicYear) === yearId),
    [classes, yearId],
  );
  const grades = useMemo(() => {
    const m = new Map();
    inYear.forEach((c) => m.set(c.gradeLevel, c.gradeLevelOrder ?? 0));
    return [...m].sort((a, b) => a[1] - b[1]).map(([g]) => g);
  }, [inYear]);

  const grade = grades.includes(gradePick)
    ? gradePick
    : selected && String(selected.academicYear) === yearId
      ? selected.gradeLevel
      : (grades[0] ?? "");

  const streams = useMemo(
    () =>
      inYear
        .filter((c) => c.gradeLevel === grade)
        .sort((a, b) => String(a.stream ?? "").localeCompare(String(b.stream ?? ""))),
    [inYear, grade],
  );

  // Keep the selection inside the chosen year + grade (also picks the first class on load).
  useEffect(() => {
    if (streams.length && !streams.some((c) => String(c.id) === String(value))) {
      onChange(streams[0].id);
    }
  }, [streams, value, onChange]);

  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Academic year</InputLabel>
            <Select
              label="Academic year"
              value={yearId}
              onChange={(e) => {
                setYearPick(e.target.value);
                setGradePick(null);
              }}
            >
              {years.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selected && (
            <Typography variant="body2" color="text.secondary">
              {selected.name}
              {selected.studentCount != null ? ` · ${selected.studentCount} students` : ""}
            </Typography>
          )}
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            Grade
          </Typography>
          <Stack direction="row" spacing={1} flexwrap="wrap" useFlexGap>
            {grades.map((g) => (
              <Chip
                key={g}
                label={g}
                clickable
                color={g === grade ? "primary" : "default"}
                variant={g === grade ? "filled" : "outlined"}
                onClick={() => setGradePick(g)}
              />
            ))}
          </Stack>
        </Box>

        {streams.length > 1 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              Stream
            </Typography>
            <Stack direction="row" spacing={1} flexwrap="wrap" useFlexGap>
              {streams.map((c) => {
                const on = String(c.id) === String(value);
                return (
                  <Chip
                    key={c.id}
                    label={c.stream || "—"}
                    clickable
                    color={on ? "primary" : "default"}
                    variant={on ? "filled" : "outlined"}
                    onClick={() => onChange(c.id)}
                  />
                );
              })}
            </Stack>
          </Box>
        )}
      </Stack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Weekly grid for the selected class
// ---------------------------------------------------------------------------
function GridPanel({ classRoom }) {
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const notify = (message, severity = "success") => setSnack({ open: true, message, severity });

  const { data: subjectsData, loading: subjLoading } = useAsync(
    () => academicsApi.getSubjects({ grade_level: classRoom.gradeLevel }),
    [classRoom.gradeLevel],
  );
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];

  const { data: assignmentsData, loading: assignLoading } = useAsync(
    () => academicsApi.getClassAssignments(classRoom.id),
    [classRoom.id],
  );
  const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];

  const {
    data: slotsData,
    loading: slotsLoading,
    refetch: refetchSlots,
  } = useAsync(() => academicsApi.getClassTimetable(classRoom.id), [classRoom.id]);
  const slots = Array.isArray(slotsData) ? slotsData : [];

  const { data: bellData, loading: bellLoading } = useAsync(
    () => academicsApi.getClassBell(classRoom.id),
    [classRoom.id],
  );
  const bellFromServer = Array.isArray(bellData) && bellData.length > 0;
  const bell = useMemo(
    () =>
      bellFromServer ? [...bellData].sort((a, b) => a.periodNumber - b.periodNumber) : DEFAULT_BELL,
    [bellData, bellFromServer],
  );

  const assignmentBySubject = useMemo(() => {
    const m = {};
    assignments.forEach((a) => {
      m[String(a.subjectId)] = a;
    });
    return m;
  }, [assignments]);

  const loading = subjLoading || assignLoading || slotsLoading || bellLoading;

  const [draft, setDraft] = useState({}); // "day|period" -> subjectId
  const [busy, setBusy] = useState(false);

  // Draft from saved slots, keeping only periods that exist in this class's bell.
  const draftFromSlots = useMemo(() => {
    const valid = new Set(bell.filter((b) => !b.isBreak).map((b) => b.periodNumber));
    const map = {};
    slots.forEach((s) => {
      if (s.isBreak || !valid.has(s.periodNumber)) return;
      map[`${s.day}|${s.periodNumber}`] = s.subjectId != null ? String(s.subjectId) : "";
    });
    return map;
  }, [slots, bell]);

  useEffect(() => {
    setDraft(draftFromSlots);
  }, [draftFromSlots]);

  const setCell = (day, period, subjectId) =>
    setDraft((p) => ({ ...p, [`${day}|${period}`]: subjectId }));

  const handleGenerate = async () => {
    setBusy(true);
    try {
      await academicsApi.generateTimetable(classRoom.id, false);
      notify("Timetable generated.");
      refetchSlots();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      const payload = [];
      for (const period of bell) {
        for (const day of DAYS) {
          if (period.isBreak) {
            payload.push({
              day,
              periodNumber: period.periodNumber,
              startTime: period.startTime,
              endTime: period.endTime,
              isBreak: true,
              breakName: period.breakName,
            });
            continue;
          }
          const subjectId = draft[`${day}|${period.periodNumber}`];
          if (!subjectId) continue;
          payload.push({
            day,
            periodNumber: period.periodNumber,
            startTime: period.startTime,
            endTime: period.endTime,
            subjectId,
            teacherId: assignmentBySubject[String(subjectId)]?.teacherId || null,
            isBreak: false,
          });
        }
      }
      await academicsApi.saveTimetable(classRoom.id, payload);
      notify("Timetable saved.");
      refetchSlots();
    } catch (e) {
      // e.message carries the backend's conflict text, e.g.
      // "Mr. Otieno is already teaching Grade 4 West on Monday, period 3."
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setDraft(draftFromSlots);
    notify("Reverted.", "info");
  };

  if (subjLoading) return <LinearProgress />;
  if (subjects.length === 0) {
    return (
      <Alert severity="info">
        No subjects are offered in {classRoom.gradeLevel} yet. Attach subjects to this grade in
        Academics → Subjects first.
      </Alert>
    );
  }

  const assignedSubjects = subjects.filter((s) => assignmentBySubject[String(s.id)]);
  const lessonsPerDay = bell.filter((b) => !b.isBreak).length;
  const dayEnds = bell[bell.length - 1]?.endTime;

  return (
    <Card sx={{ p: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            {assignedSubjects.length} of {subjects.length} subjects have a teacher. Cells without a
            teacher fall back to &ldquo;free&rdquo;.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {classRoom.name}: {lessonsPerDay} lessons a day, finishing at {dayEnds}.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RestartAltIcon />} onClick={handleReset} disabled={busy}>
            Reset
          </Button>
          <Button
            variant="outlined"
            startIcon={<AutoFixHighIcon />}
            onClick={handleGenerate}
            disabled={busy || assignedSubjects.length === 0}
          >
            {busy ? "Working…" : "Generate"}
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={busy}>
            Save
          </Button>
        </Stack>
      </Stack>

      {!loading && assignedSubjects.length === 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              href={`/timetable/assignments?class=${encodeURIComponent(classRoom.id)}`}
            >
              Assign teachers
            </Button>
          }
        >
          No teachers are assigned to subjects in this class yet. Do that first so the grid can fill
          in teachers.
        </Alert>
      )}

      {!bellFromServer && !loading && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" href="/timetable/bell-schedules">
              Set up
            </Button>
          }
        >
          No bell schedule is set up for {classRoom.gradeLevel}, so the default school day is shown.
          Generate uses the default as well.
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 100 }}>Period</TableCell>
                {DAYS.map((d) => (
                  <TableCell key={d} sx={{ fontWeight: 700 }}>
                    {d}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {bell.map((period) => (
                <TableRow key={period.periodNumber}>
                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                      P{period.periodNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {period.startTime}–{period.endTime}
                    </Typography>
                  </TableCell>

                  {DAYS.map((day) => {
                    if (period.isBreak) {
                      return (
                        <TableCell key={day}>
                          <Box
                            sx={{
                              bgcolor: "action.hover",
                              borderRadius: 1,
                              p: 0.75,
                              textAlign: "center",
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {period.breakName}
                            </Typography>
                          </Box>
                        </TableCell>
                      );
                    }

                    const subjectId = draft[`${day}|${period.periodNumber}`] ?? "";
                    const assignment = assignmentBySubject[String(subjectId)];
                    const subject = subjects.find((s) => String(s.id) === String(subjectId));

                    return (
                      <TableCell key={day} sx={{ p: 0.5, minWidth: 160 }}>
                        <Stack spacing={0.5}>
                          <Select
                            size="small"
                            displayEmpty
                            value={subjectId}
                            onChange={(e) => setCell(day, period.periodNumber, e.target.value)}
                          >
                            <MenuItem value="">
                              <em>Free</em>
                            </MenuItem>
                            {subjects.map((s) => (
                              <MenuItem key={s.id} value={String(s.id)}>
                                {s.name}
                                {!assignmentBySubject[String(s.id)] ? " (no teacher)" : ""}
                              </MenuItem>
                            ))}
                          </Select>
                          {subject && (
                            <Typography
                              variant="caption"
                              color={assignment ? "text.secondary" : "warning.main"}
                              sx={{ pl: 0.5 }}
                            >
                              {assignment ? assignment.teacherName : "No teacher assigned"}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={snack.severity === "error" ? 9000 : 4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ maxWidth: 520 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
