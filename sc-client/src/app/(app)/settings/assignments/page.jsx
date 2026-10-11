"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  IconButton,
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
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { useClasses } from "@/hooks/domain";
import { academicsApi } from "@/lib/academicsApi";

export default function AssignmentsPage() {
  return (
    <>
      <PageGuard permission="timetable.manage">
        <PageHeader
          title="Timetable · Assignments"
          subtitle="Choose who teaches each subject, and how many periods a week."
        />
        <Suspense fallback={<LinearProgress />}>
          <Content>{(classRoom) => <AssignmentsPanel classRoom={classRoom} />}</Content>
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
// Assignments for the selected class
// ---------------------------------------------------------------------------
function AssignmentsPanel({ classRoom }) {
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const notify = (message, severity = "success") => setSnack({ open: true, message, severity });

  const { data: subjectsData, loading: subjLoading } = useAsync(
    () => academicsApi.getSubjects({ grade_level: classRoom.gradeLevel }),
    [classRoom.gradeLevel],
  );
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];

  const { data: teachersData } = useAsync(() => academicsApi.getTeachers(), []);
  const teachers = Array.isArray(teachersData) ? teachersData : [];

  const { data: assignmentsData, refetch } = useAsync(
    () => academicsApi.getClassAssignments(classRoom.id),
    [classRoom.id],
  );
  const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];

  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const map = {};
    assignments.forEach((a) => {
      map[String(a.subjectId)] = {
        teacherId: a.teacherId ?? "",
        periodsPerWeek: a.periodsPerWeek ?? 5,
        assignmentId: a.id,
      };
    });
    setDraft(map);
  }, [assignmentsData]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (subjectId, patch) =>
    setDraft((p) => ({
      ...p,
      [String(subjectId)]: { ...(p[String(subjectId)] || { periodsPerWeek: 5 }), ...patch },
    }));

  const saveOne = async (subjectId) => {
    const row = draft[String(subjectId)];
    if (!row?.teacherId) return;
    setBusy(true);
    try {
      await academicsApi.assignTeacher(
        classRoom.id,
        subjectId,
        row.teacherId,
        row.periodsPerWeek ?? 5,
      );
      notify("Saved.");
      refetch();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const saveAll = async () => {
    setBusy(true);
    try {
      let saved = 0;
      for (const s of subjects) {
        const row = draft[String(s.id)];
        if (!row?.teacherId) continue;
        await academicsApi.assignTeacher(
          classRoom.id,
          s.id,
          row.teacherId,
          row.periodsPerWeek ?? 5,
        );
        saved += 1;
      }
      notify(`Saved ${saved} assignment${saved === 1 ? "" : "s"}.`);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const removeOne = async (subjectId) => {
    const row = draft[String(subjectId)];
    if (!row?.assignmentId) return;
    try {
      await academicsApi.deleteAssignment(row.assignmentId);
      notify("Removed.");
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
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

  return (
    <Card sx={{ p: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Typography variant="body2" color="text.secondary">
          {assignments.length} of {subjects.length} subjects have a teacher. The teacher you pick
          here shows up automatically in the grid.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={saveAll} disabled={busy}>
            {busy ? "Saving…" : "Save all"}
          </Button>
          <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            href={`/timetable/grid?class=${encodeURIComponent(classRoom.id)}`}
          >
            Next: Grid
          </Button>
        </Stack>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell sx={{ width: 260 }}>Teacher</TableCell>
              <TableCell align="right" sx={{ width: 140 }}>
                Periods/week
              </TableCell>
              <TableCell sx={{ width: 120 }} align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((s) => {
              const row = draft[String(s.id)] ?? {};
              const saved = !!row.assignmentId;
              return (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {s.name} <Chip size="small" variant="outlined" label={s.code} sx={{ ml: 1 }} />
                    {saved && (
                      <Chip
                        size="small"
                        color="success"
                        label={
                          teachers.find((t) => String(t.id) === String(row.teacherId))?.name ||
                          "assigned"
                        }
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      fullWidth
                      displayEmpty
                      value={row.teacherId ?? ""}
                      onChange={(e) => set(s.id, { teacherId: e.target.value })}
                    >
                      <MenuItem value="">
                        <em>Unassigned</em>
                      </MenuItem>
                      {teachers.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={row.periodsPerWeek ?? 5}
                      onChange={(e) => set(s.id, { periodsPerWeek: Number(e.target.value) })}
                      inputProps={{ min: 1, max: 15, style: { textAlign: "right" } }}
                      sx={{ width: 90 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={() => saveOne(s.id)}
                        disabled={busy || !row.teacherId}
                      >
                        Save
                      </Button>
                      {saved && (
                        <IconButton size="small" onClick={() => removeOne(s.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

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
