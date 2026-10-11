"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { ReportCard } from "@/components/exams/ReportCard";
import { PageHeader } from "@/components/PageHeader";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { academicsApi } from "@/lib/academicsApi";
import { EXAM_STATUS, examsApi } from "@/lib/examsApi";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PrintIcon from "@mui/icons-material/Print";
import ReplayIcon from "@mui/icons-material/Replay";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function ExamDetailPage() {
  return (
    <>
      <PageGuard permission="exams.view">
        <ExamDetailContent />
      </PageGuard>
    </>
  );
}

function ExamDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [releaseDialog, setReleaseDialog] = useState(null);
  // null = closed; { checking: true } = loading; { report } = loaded

  const { data, loading, error, refetch } = useAsync(async () => {
    const [exam, subjects, classes] = await Promise.all([
      examsApi.get(id),
      examsApi.getSubjects(id),
      academicsApi.getClasses({ academic_year: null }).catch(() => []),
    ]);
    return {
      exam,
      subjects: Array.isArray(subjects) ? subjects : [],
      classes: Array.isArray(classes) ? classes : [],
    };
  }, [id]);

  const exam = data?.exam;
  const subjects = data?.subjects ?? [];
  const allClasses = data?.classes ?? [];

  const examClasses = useMemo(
    () =>
      allClasses.filter(
        (c) =>
          (!exam?.academic_year || String(c.academicYear) === String(exam.academic_year)) &&
          (!exam?.classRooms?.length || exam.classRooms.includes(c.id)),
      ),
    [allClasses, exam?.academic_year, exam?.classRooms],
  );

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const handleLifecycle = async (action) => {
    // Release is gated by the confirmation dialog with the missing-marks report
    if (action === "release") {
      setReleaseDialog({ checking: true });
      try {
        const report = await examsApi.getMissingMarks(exam.id);
        setReleaseDialog({ report });
      } catch (e) {
        notify(e.message, "error");
        setReleaseDialog(null);
      }
      return;
    }

    const labels = {
      open: "opened for marks",
      close: "closed",
      reopen: "reopened",
    };

    try {
      await examsApi[action](exam.id);
      notify(`${exam.name} ${labels[action]}`);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const confirmRelease = async () => {
    try {
      await examsApi.release(exam.id);
      notify(`${exam.name} released`);
      setReleaseDialog(null);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const totalMarks = subjects.reduce((s, x) => s + (x.markCount || 0), 0);
  const totalPossible = subjects.length * 40;

  return (
    <>
      <PageHeader
        title={exam?.name || "Exam"}
        subtitle={exam ? `${exam.termLabel} · ${exam.academicYearName}` : ""}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/exams")}
            >
              Back
            </Button>
            {exam && <LifecycleActions exam={exam} onAction={handleLifecycle} />}
          </Stack>
        }
      />

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() =>
          exam && (
            <Stack spacing={3}>
              <SummaryStrip
                exam={exam}
                subjects={subjects}
                totalMarks={totalMarks}
                totalPossible={totalPossible}
              />

              <Card>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
                    <Tab label="Subjects" />
                    <Tab label="Grade entry" />
                    <Tab label="Reports" />
                  </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                  {tab === 0 && <SubjectsTab exam={exam} subjects={subjects} onSaved={refetch} />}
                  {tab === 1 && (
                    <GradeEntryTab
                      exam={exam}
                      subjects={subjects}
                      examClasses={examClasses}
                      router={router}
                    />
                  )}
                  {tab === 2 && <ReportsTab exam={exam} examClasses={examClasses} />}
                </Box>
              </Card>
            </Stack>
          )
        }
      </DataState>

      <ReleaseDialog
        state={releaseDialog}
        onClose={() => setReleaseDialog(null)}
        onConfirm={confirmRelease}
      />

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

// ============================================================================
// Release confirmation dialog
// ============================================================================

function ReleaseDialog({ state, onClose, onConfirm }) {
  const open = !!state;
  const report = state?.report;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Release report cards?</DialogTitle>

      <DialogContent dividers>
        {state?.checking ? (
          <Stack alignitems="center" spacing={2} sx={{ py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Checking for missing marks…
            </Typography>
          </Stack>
        ) : (
          <>
            <Typography variant="body1" paragraph>
              Releasing will:
            </Typography>
            <Typography component="ul" variant="body2" sx={{ pl: 3, mb: 2 }}>
              <li>Make every report card visible to parents</li>
              <li>Lock all marks in this exam</li>
              <li>Prevent further mark or comment edits</li>
            </Typography>

            {report && report.incompleteSubjects.length === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                All {report.totalSubjects} subjects have marks for every enrolled student. Ready to
                release.
              </Alert>
            )}

            {report && report.incompleteSubjects.length > 0 && (
              <>
                <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningAmberIcon />}>
                  <strong>
                    {report.incompleteSubjects.length} subject
                    {report.incompleteSubjects.length === 1 ? "" : "s"}
                  </strong>{" "}
                  have missing marks. {report.incompleteSubjects.reduce((s, x) => s + x.missing, 0)}{" "}
                  students across these subjects will show as “—” on their report cards.
                </Alert>

                <TableContainer sx={{ mt: 2, maxHeight: 320 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Grade</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell align="right">Expected</TableCell>
                        <TableCell align="right">Entered</TableCell>
                        <TableCell align="right">Missing</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.incompleteSubjects.map((s) => (
                        <TableRow key={s.examSubjectId}>
                          <TableCell>{s.gradeLevel}</TableCell>
                          <TableCell>{s.subjectName}</TableCell>
                          <TableCell align="right">{s.expected}</TableCell>
                          <TableCell align="right">{s.entered}</TableCell>
                          <TableCell align="right" sx={{ color: "warning.main", fontWeight: 600 }}>
                            {s.missing}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={state?.checking}>
          Cancel
        </Button>
        <Button variant="contained" color="success" disabled={state?.checking} onClick={onConfirm}>
          {report?.incompleteSubjects?.length ? "Release anyway" : "Release report cards"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// Lifecycle actions
// ============================================================================

function LifecycleActions({ exam, onAction }) {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);

  const config = {
    draft: {
      primary: { action: "open", label: "Open for marks", icon: <PlayArrowIcon /> },
      others: [],
    },
    open: {
      primary: {
        action: "close",
        label: "Close marks",
        icon: <LockIcon />,
        color: "warning",
      },
      others: [{ action: "release", label: "Release early", icon: <CheckCircleIcon /> }],
    },
    closed: {
      primary: {
        action: "release",
        label: "Release report cards",
        icon: <CheckCircleIcon />,
        color: "success",
      },
      others: [{ action: "open", label: "Reopen marks entry", icon: <PlayArrowIcon /> }],
    },
    released: {
      primary: {
        action: "reopen",
        label: "Reopen for corrections",
        icon: <ReplayIcon />,
        color: "warning",
      },
      others: [],
    },
  }[exam.status] || { primary: null, others: [] };

  if (!config.primary) return null;

  return (
    <RoleGuard permission="exams.manage">
      <Stack direction="row" spacing={0.5} alignitems="center">
        <Button
          variant="contained"
          color={config.primary.color || "primary"}
          startIcon={config.primary.icon}
          onClick={() => onAction(config.primary.action)}
        >
          {config.primary.label}
        </Button>
        {config.others.length > 0 && (
          <>
            <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={anchor} open={!!anchor} onClose={close}>
              {config.others.map((o) => (
                <MenuItem
                  key={o.action}
                  onClick={() => {
                    close();
                    onAction(o.action);
                  }}
                >
                  <ListItemIcon>{o.icon}</ListItemIcon>
                  <ListItemText>{o.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Stack>
    </RoleGuard>
  );
}

// ============================================================================
// Summary strip
// ============================================================================

function SummaryStrip({ exam, subjects, totalMarks, totalPossible }) {
  const grades = exam.gradeLevels?.length || 0;
  const pct = totalPossible ? Math.round((totalMarks / totalPossible) * 100) : 0;
  const statusMeta = EXAM_STATUS[exam.status] || EXAM_STATUS.draft;

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignitems={{ md: "center" }}>
        <Stack direction="row" spacing={2} alignitems="center">
          <Chip label={statusMeta.label} color={statusMeta.color} />
          <Typography variant="body2" color="text.secondary">
            {exam.start_date} → {exam.end_date}
          </Typography>
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

        <Stack direction="row" spacing={4} sx={{ flex: 1 }}>
          <Stat label="Subjects" value={subjects.length} />
          <Stat label="Grades" value={grades} />
          <Stat label="Marks" value={`${totalMarks}/${totalPossible}`} />
        </Stack>

        <Box sx={{ minWidth: 220 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Overall progress
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {pct}%
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
      </Stack>
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Box>
  );
}

// ============================================================================
// Tab 1 — Subjects
// ============================================================================

function SubjectsTab({ exam, subjects, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const handleAutoAdd = async () => {
    if (!exam.gradeLevels || exam.gradeLevels.length === 0) {
      return notify("This exam has no grade levels set.", "error");
    }
    setBusy(true);
    try {
      const catalog = await academicsApi.getSubjects();
      const idsToSend = (catalog || []).map((s) => s.id);
      const result = await examsApi.setupSubjects(exam.id, exam.gradeLevels, idsToSend);
      notify(`Added ${result.length} subjects.`);
      onSaved();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignitems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {subjects.length} subject{subjects.length === 1 ? "" : "s"} in this exam. Use “Add all” if
          you created the exam before adding subjects.
        </Typography>
        <RoleGuard permission="exams.manage">
          <Button variant="outlined" size="small" onClick={handleAutoAdd} disabled={busy}>
            {busy ? "Adding…" : "Add all"}
          </Button>
        </RoleGuard>
      </Stack>

      {subjects.length === 0 ? (
        <Alert severity="info">
          No subjects yet. Click “Add all” to populate every subject offered by this exam’s grades.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Grade</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Code</TableCell>
                <TableCell align="right">Marks entered</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.gradeLevel}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{s.subjectName}</TableCell>
                  <TableCell>
                    <Chip size="small" label={s.subjectCode} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{s.markCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// ============================================================================
// Tab 2 — Grade entry
// ============================================================================

function GradeEntryTab({ exam, subjects, examClasses, router }) {
  const [grade, setGrade] = useState("");
  const [classId, setClassId] = useState("");

  const grades = exam.gradeLevels ?? [];

  useMemo(() => {
    if (!grade && grades.length > 0) setGrade(grades[0]);
  }, [grades, grade]);

  const gradeClasses = examClasses.filter((c) => c.gradeLevel === grade);

  useMemo(() => {
    if (gradeClasses.length > 0 && !gradeClasses.find((c) => c.id === classId)) {
      setClassId(gradeClasses[0].id);
    }
  }, [grade, gradeClasses, classId]);

  const gradeSubjects = subjects.filter((s) => s.gradeLevel === grade);

  const perSubjectDone = gradeSubjects.reduce((s, x) => s + (x.markCount || 0), 0);
  const perSubjectTotal = gradeSubjects.length * 40;

  const openMarksEntry = (examSubjectId) => {
    const qs = classId ? `?class_room=${classId}` : "";
    router.push(`/exams/${exam.id}/grade/${examSubjectId}${qs}`);
  };

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Grade</InputLabel>
          <Select value={grade} label="Grade" onChange={(e) => setGrade(e.target.value)}>
            {grades.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }} disabled={gradeClasses.length === 0}>
          <InputLabel>Class / stream</InputLabel>
          <Select
            value={classId}
            label="Class / stream"
            onChange={(e) => setClassId(e.target.value)}
          >
            {gradeClasses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={3} alignitems="center">
          <Stat label="Subjects" value={gradeSubjects.length} />
          <Stat label="Marks entered" value={`${perSubjectDone}/${perSubjectTotal}`} />
        </Stack>
      </Stack>

      {gradeSubjects.length === 0 ? (
        <Alert severity="info">
          No subjects set up for {grade}. Add them from the Subjects tab.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Code</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>
                  Marks
                </TableCell>
                <TableCell sx={{ width: 200 }}>Progress</TableCell>
                <TableCell align="right" sx={{ width: 120 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {gradeSubjects.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{s.subjectName}</TableCell>
                  <TableCell>
                    <Chip size="small" label={s.subjectCode} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{s.markCount}</TableCell>
                  <TableCell>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, ((s.markCount || 0) / 40) * 100)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <RoleGuard permission="exams.marks">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => openMarksEntry(s.id)}
                      >
                        Enter
                      </Button>
                    </RoleGuard>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}

// ============================================================================
// Tab 3 — Reports
// ============================================================================

function ReportsTab({ exam, examClasses }) {
  const [view, setView] = useState("ranking");
  const [classId, setClassId] = useState("");

  const openPrintView = (studentFilter = null) => {
    const url =
      `/print/exam/${exam.id}/class/${classId}` +
      (studentFilter ? `?student=${studentFilter}` : "");
    window.open(url, "_blank");
  };

  useMemo(() => {
    if (!classId && examClasses.length > 0) setClassId(examClasses[0].id);
  }, [examClasses, classId]);

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3 }}
        alignitems={{ sm: "center" }}
        flexwrap="wrap"
        useFlexGap
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Class</InputLabel>
          <Select value={classId} label="Class" onChange={(e) => setClassId(e.target.value)}>
            {examClasses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="ranking">Ranking</ToggleButton>
          <ToggleButton value="comments">Class teacher</ToggleButton>
          <ToggleButton value="head_comments">Head teacher</ToggleButton>
          <ToggleButton value="cards">Report cards</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flex: 1 }} />

        {classId && (
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => openPrintView()}>
            Print all for class
          </Button>
        )}
      </Stack>

      {!classId ? (
        <Alert severity="info">Pick a class to continue.</Alert>
      ) : view === "ranking" ? (
        <RankingView exam={exam} classId={classId} />
      ) : view === "comments" ? (
        <CommentsView exam={exam} classId={classId} variant="class" />
      ) : view === "head_comments" ? (
        <CommentsView exam={exam} classId={classId} variant="head" />
      ) : (
        <ReportCardsView exam={exam} classId={classId} />
      )}
    </>
  );
}

function RankingView({ exam, classId }) {
  const { data: report, loading } = useAsync(
    () => examsApi.getClassReport(exam.id, classId),
    [exam.id, classId],
  );

  const cards = Array.isArray(report) ? report : [];

  if (loading) return <LinearProgress />;
  if (cards.length === 0) return <Alert severity="info">No report data for this class.</Alert>;

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 60 }}>Rank</TableCell>
            <TableCell>Student</TableCell>
            <TableCell align="right">Mean points</TableCell>
            <TableCell align="right">Mean score</TableCell>
            <TableCell>Comment</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cards.map((c) => (
            <TableRow key={c.student.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{c.rank}</TableCell>
              <TableCell>{c.student.name}</TableCell>
              <TableCell align="right">{Number(c.totals.meanPoints).toFixed(2)}</TableCell>
              <TableCell align="right">{c.totals.meanScore}</TableCell>
              <TableCell
                sx={{
                  maxWidth: 340,
                  color: "text.secondary",
                  fontSize: 12,
                  whiteSpace: "normal",
                }}
              >
                {c.comments.classTeacher || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ============================================================================
// Comments — parameterised for class teacher vs head teacher
// ============================================================================

function CommentsView({ exam, classId, variant = "class" }) {
  const isHead = variant === "head";
  const [overrides, setOverrides] = useState({});
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const {
    data: items = [],
    loading,
    refetch,
  } = useAsync(() => examsApi.getCommentRoster(exam.id, classId), [exam.id, classId]);

  const handleChange = (studentId, value) => setOverrides((p) => ({ ...p, [studentId]: value }));

  const handleSave = async () => {
    setBusy(true);
    try {
      const payload = items.map((c) => ({
        studentId: c.studentId,
        comment:
          overrides[c.studentId] ?? (isHead ? c.headTeacherComment : c.classTeacherComment) ?? "",
      }));

      if (isHead) {
        await examsApi.saveHeadTeacherComments(exam.id, payload);
      } else {
        await examsApi.saveClassTeacherComments(exam.id, payload);
      }

      notify(`Saved ${payload.length} comments.`);
      setOverrides({});
      refetch();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LinearProgress />;
  if (items.length === 0) return <Alert severity="info">No students in this class yet.</Alert>;

  const roleLabel = isHead ? "head teacher" : "class teacher";

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignitems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {items.length} student{items.length === 1 ? "" : "s"}. Each row suggests a {roleLabel}’s
          comment based on the student’s mean points. Leave a field blank to keep the suggestion, or
          type to customise.
        </Typography>
        <RoleGuard permission="exams.manage">
          <Button variant="contained" onClick={handleSave} disabled={busy}>
            {busy ? "Saving…" : "Save comments"}
          </Button>
        </RoleGuard>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell align="right" sx={{ width: 110 }}>
                Mean points
              </TableCell>
              <TableCell>{isHead ? "Head teacher’s comment" : "Class teacher’s comment"}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((c) => {
              const saved = isHead ? c.headTeacherComment : c.classTeacherComment;
              const placeholder = isHead ? c.defaultHeadTeacher : c.defaultClassTeacher;
              return (
                <TableRow key={c.studentId} hover>
                  <TableCell sx={{ fontWeight: 500, minWidth: 160 }}>{c.studentName}</TableCell>
                  <TableCell align="right">{c.meanPoints}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      minRows={1}
                      placeholder={placeholder}
                      value={overrides[c.studentId] ?? saved ?? ""}
                      onChange={(e) => handleChange(c.studentId, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// ============================================================================
// Report cards view
// ============================================================================

function ReportCardsView({ exam, classId }) {
  const [studentId, setStudentId] = useState("");

  const { data: report, loading } = useAsync(
    () => examsApi.getClassReport(exam.id, classId),
    [exam.id, classId],
  );

  const cards = Array.isArray(report) ? report : [];

  useMemo(() => {
    if (!studentId && cards.length > 0) setStudentId(cards[0].student.id);
  }, [cards, studentId]);

  const active = cards.find((c) => c.student.id === studentId);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignitems="center">
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Student</InputLabel>
          <Select value={studentId} label="Student" onChange={(e) => setStudentId(e.target.value)}>
            {cards.map((c) => (
              <MenuItem key={c.student.id} value={c.student.id}>
                #{c.rank} · {c.student.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {studentId && (
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() =>
              window.open(`/print/exam/${exam.id}/class/${classId}?student=${studentId}`, "_blank")
            }
          >
            Print this card
          </Button>
        )}
      </Stack>

      {loading ? <LinearProgress /> : active ? <ReportCard card={active} /> : null}
    </Stack>
  );
}
