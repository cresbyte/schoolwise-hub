"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import CommentIcon from "@mui/icons-material/Comment";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { examsApi, EXAM_STATUS } from "@/lib/examsApi";
import { academicsApi } from "@/lib/academicsApi";
import { getInitials } from "@/lib/utils";

// Local grade lookup
function lookupBand(scale, score) {
  if (score === "" || score === null || score === undefined) return null;
  const n = Number(score);
  if (isNaN(n)) return null;
  if (scale && Array.isArray(scale) && scale.length > 0) {
    const found = scale.find((b) => n >= b.min && n <= b.max);
    if (found) return found;
  }
  // Standard CBC ratings fallback
  if (n >= 75)
    return { grade: "EE", points: 4, comment: "Exceeding Expectations. Excellent grasp." };
  if (n >= 50)
    return { grade: "ME", points: 3, comment: "Meeting Expectations. Good understanding." };
  if (n >= 35)
    return { grade: "AE", points: 2, comment: "Approaching Expectations. Developing skills." };
  return { grade: "BE", points: 1, comment: "Below Expectations. Needs support." };
}

function groupByGrade(subjects) {
  const map = new Map();
  (subjects || []).forEach((s) => {
    const grade = s.gradeLevel || "General";
    if (!map.has(grade)) map.set(grade, []);
    map.get(grade).push(s);
  });
  return [...map.entries()];
}

export default function StaffGradingPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <StaffGradingContent />
    </Suspense>
  );
}

function StaffGradingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active grading target: if set, shows the grading sheet
  const [activeExam, setActiveExam] = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeClassId, setActiveClassId] = useState(searchParams.get("class_room") || "");

  // Class teacher comments dialog state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentClassId, setCommentClassId] = useState("");
  const [commentExamId, setCommentExamId] = useState("");
  const [commentRows, setCommentRows] = useState([]);
  const [commentSaving, setCommentSaving] = useState(false);

  // Fetch teacher's exams and all classes
  const { data, loading, error, refetch } = useAsync(async () => {
    const [groups, classes] = await Promise.all([
      examsApi.getMyGrading().catch(() => []),
      academicsApi.getClasses().catch(() => []),
    ]);

    return {
      groups: Array.isArray(groups) ? groups : [],
      classes: Array.isArray(classes) ? classes : [],
    };
  }, []);

  const groups = data?.groups || [];
  const classes = data?.classes || [];
  const classById = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);

  // Read URL query params to auto-open subject if passed
  useEffect(() => {
    const examParam = searchParams.get("exam");
    const subParam = searchParams.get("subject");
    if (examParam && subParam && groups.length > 0 && !activeSubject) {
      for (const g of groups) {
        if (String(g.exam?.id) === String(examParam)) {
          const matchSub = (g.subjects || []).find((s) => String(s.id) === String(subParam));
          if (matchSub) {
            setActiveExam(g.exam);
            setActiveSubject(matchSub);
            break;
          }
        }
      }
    }
  }, [groups, searchParams, activeSubject]);

  const handleOpenMarksEntry = (exam, subject) => {
    setActiveExam(exam);
    setActiveSubject(subject);

    // Pick stream if exam has class rooms
    const inGrade = (exam.classRooms || []).filter(
      (id) => classById[id]?.gradeLevel === subject.gradeLevel,
    );
    if (inGrade.length === 1) {
      setActiveClassId(inGrade[0]);
    }
  };

  const handleBackToOverview = () => {
    setActiveExam(null);
    setActiveSubject(null);
    setActiveClassId("");
    refetch();
  };

  // Class Teacher Comments handler
  const handleOpenClassComments = async (examId, clsId) => {
    setCommentExamId(examId);
    setCommentClassId(clsId);
    setCommentDialogOpen(true);
    setCommentSaving(true);
    try {
      const roster = await examsApi.getCommentRoster(examId, clsId);
      setCommentRows(Array.isArray(roster) ? roster : []);
    } catch {
      setCommentRows([]);
    } finally {
      setCommentSaving(false);
    }
  };

  const handleSaveClassComments = async () => {
    setCommentSaving(true);
    try {
      await examsApi.saveClassTeacherComments(
        commentExamId,
        commentRows.map((r) => ({
          studentId: r.studentId,
          comment: r.comment || "",
        })),
      );
      toast.success("Class teacher comments saved successfully!");
      setCommentDialogOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save comments");
    } finally {
      setCommentSaving(false);
    }
  };

  return (
    <Box>
      {/* If an active subject is selected, render the full Marks Entry Sheet */}
      {activeExam && activeSubject ? (
        <MarksEntrySheet
          exam={activeExam}
          subject={activeSubject}
          allClasses={classes}
          initialClassId={activeClassId}
          onBack={handleBackToOverview}
        />
      ) : (
        /* Otherwise, render Exams & Subjects Overview */
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Examinations & Marks Entry
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exams currently open for marks entry. Select an assigned subject to enter student
              scores.
            </Typography>
          </Box>

          {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

          {groups.length === 0 && !loading ? (
            <Card sx={{ p: 5, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No active grading tasks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                There are currently no examinations open for marks entry assigned to your profile.
              </Typography>
            </Card>
          ) : (
            <Stack spacing={3}>
              {groups.map((g) => {
                const exam = g.exam;
                const status = EXAM_STATUS[exam?.status] || {
                  label: exam?.status,
                  color: "default",
                };
                const scope = (exam?.classRooms || [])
                  .map((id) => classById[id]?.name)
                  .filter(Boolean);

                return (
                  <Card key={exam?.id} elevation={1} sx={{ borderRadius: 2, p: { xs: 2, sm: 3 } }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ sm: "flex-start" }}
                      spacing={1}
                    >
                      <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {exam?.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={status.label}
                            color={status.color}
                            sx={{ fontWeight: 600 }}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {exam?.termLabel || exam?.term} •{" "}
                          {exam?.academicYearName || exam?.academic_year}
                          {exam?.start_date && exam?.end_date
                            ? ` (${exam.start_date} → ${exam.end_date})`
                            : ""}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mt: 1.5 }}
                      flexwrap="wrap"
                      useFlexGap
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Streams:
                      </Typography>
                      {scope.length > 0 ? (
                        scope.map((name) => (
                          <Chip key={name} size="small" variant="outlined" label={name} />
                        ))
                      ) : (
                        <Chip size="small" variant="outlined" label="All classes" />
                      )}
                    </Stack>

                    {/* Assigned subjects per grade */}
                    {groupByGrade(g.subjects).map(([grade, subjects]) => (
                      <Box key={grade} sx={{ mt: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: "primary.main", mb: 1 }}
                        >
                          {grade}
                        </Typography>
                        <TableContainer
                          sx={{ border: 1, borderColor: "divider", borderRadius: 1.5 }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: "grey.50" }}>
                                <TableCell sx={{ fontWeight: 600 }}>Subject Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Marks Progress</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                  Action
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {subjects.map((s) => {
                                const marksProgress =
                                  s.totalStudents > 0
                                    ? `${s.marksEntered || 0} / ${s.totalStudents} entered`
                                    : s.completed
                                      ? "Completed"
                                      : "Pending entry";

                                return (
                                  <TableRow key={s.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{s.subjectName}</TableCell>
                                    <TableCell>
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        label={s.subjectCode || "SUB"}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary">
                                        {marksProgress}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<EditIcon />}
                                        onClick={() => handleOpenMarksEntry(exam, s)}
                                        sx={{ textTransform: "none", fontSize: "0.8rem" }}
                                      >
                                        Enter Marks
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ))}
                  </Card>
                );
              })}
            </Stack>
          )}
        </Box>
      )}

      {/* Class Teacher Comments Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Class Teacher Remarks</DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2 }}>
          {commentSaving && commentRows.length === 0 ? (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 380 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Adm No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Teacher Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commentRows.map((row, i) => (
                    <TableRow key={row.studentId || i}>
                      <TableCell sx={{ fontWeight: 600 }}>{row.admissionNumber}</TableCell>
                      <TableCell>{row.studentName}</TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.comment || ""}
                          placeholder="e.g. Consistent worker, shows great improvement."
                          onChange={(e) => {
                            const val = e.target.value;
                            setCommentRows((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], comment: val };
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCommentDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveClassComments} disabled={commentSaving}>
            Save Remarks
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/**
 * Dedicated Marks Entry Sheet for a selected exam subject
 */
function MarksEntrySheet({ exam, subject, allClasses, initialClassId, onBack }) {
  const [classId, setClassId] = useState(initialClassId);
  const [rows, setRows] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fillScore, setFillScore] = useState("");

  const gradeLevel = subject.gradeLevel;

  // Relevant classes for this exam subject
  const relevantClasses = useMemo(() => {
    return allClasses.filter(
      (c) =>
        c.gradeLevel === gradeLevel && (!exam.classRooms?.length || exam.classRooms.includes(c.id)),
    );
  }, [allClasses, gradeLevel, exam]);

  // Auto-pick first class if not set
  useEffect(() => {
    if (!classId && relevantClasses.length > 0) {
      setClassId(relevantClasses[0].id);
    }
  }, [relevantClasses, classId]);

  // Load roster
  const { data, loading, error, refetch } = useAsync(async () => {
    const roster = await examsApi.getRoster(subject.id, classId || null);
    return roster;
  }, [subject.id, classId]);

  const examSubject = data?.examSubject || subject;
  const canEdit = data?.canEdit ?? true;

  useEffect(() => {
    if (!data?.rows) return;
    setRows(
      data.rows.map((r) => ({
        ...r,
        commentEdited: Boolean(r.comment && r.comment.trim()),
      })),
    );
    setDirty(false);
  }, [data]);

  const handleScoreChange = (index, value) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[index] };
      const band = lookupBand(examSubject.grading_scale, value);

      row.score = value;
      row.grade = band?.grade || "";
      row.points = band?.points || 0;

      if (!row.commentEdited) {
        row.comment = band?.comment || "";
      }

      next[index] = row;
      return next;
    });
    setDirty(true);
  };

  const handleCommentChange = (index, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], comment: value, commentEdited: true };
      return next;
    });
    setDirty(true);
  };

  const handleResetComment = (index) => {
    setRows((prev) => {
      const next = [...prev];
      const band = lookupBand(examSubject.grading_scale, next[index].score);
      next[index] = {
        ...next[index],
        comment: band?.comment || "",
        commentEdited: false,
      };
      return next;
    });
    setDirty(true);
  };

  const handleToggleNa = (index) => {
    setRows((prev) => {
      const next = [...prev];
      const isNa = !next[index].isNa;
      next[index] = {
        ...next[index],
        isNa,
        score: isNa ? "" : next[index].score,
        grade: isNa ? "X" : "",
        comment: isNa ? "Absent / Not Assessed" : "",
      };
      return next;
    });
    setDirty(true);
  };

  const handleBulkFill = () => {
    if (fillScore === "") return;
    const val = Number(fillScore);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error("Please enter a valid score between 0 and 100");
      return;
    }

    setRows((prev) =>
      prev.map((r) => {
        if (r.isNa) return r;
        const band = lookupBand(examSubject.grading_scale, val);
        return {
          ...r,
          score: String(val),
          grade: band?.grade || "",
          points: band?.points || 0,
          comment: band?.comment || "",
          commentEdited: false,
        };
      }),
    );
    setDirty(true);
    toast.info(`Filled marks with ${val}`);
  };

  const handleSave = async () => {
    // Validate rows
    for (const r of rows) {
      if (!r.isNa && (r.score === "" || r.score === null || isNaN(Number(r.score)))) {
        toast.error(`Please enter a score for ${r.studentName}`);
        return;
      }
    }

    setSaving(true);
    try {
      await examsApi.saveMarks(
        subject.id,
        rows.map((r) => ({
          studentId: r.studentId,
          score: r.isNa ? null : Number(r.score),
          comment: r.comment || "",
          isNa: Boolean(r.isNa),
        })),
      );
      toast.success(`Successfully saved marks for ${rows.length} students!`);
      setDirty(false);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => {
    const c = { EE: 0, ME: 0, AE: 0, BE: 0, unmarked: 0 };
    rows.forEach((r) => {
      if (r.isNa || r.score === "" || r.score === null) c.unmarked++;
      else if (r.grade && c[r.grade] !== undefined) c[r.grade]++;
    });
    return c;
  }, [rows]);

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
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={onBack}
              size="small"
              sx={{ textTransform: "none" }}
            >
              All Exams
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {examSubject.subjectName} • {gradeLevel}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {exam.name} • {exam.termLabel || "Term"} • Max Score: {examSubject.max_score || 100}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!canEdit || saving || !dirty}
          >
            {saving ? "Saving..." : "Save Marks"}
          </Button>
        </Stack>
      </Stack>

      {/* Control bar */}
      <Card elevation={1} sx={{ borderRadius: 2, p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
            {relevantClasses.length > 1 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Stream</InputLabel>
                <Select value={classId} label="Stream" onChange={(e) => setClassId(e.target.value)}>
                  {relevantClasses.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Quick score fill */}
            {canEdit && (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  type="number"
                  placeholder="Score"
                  value={fillScore}
                  onChange={(e) => setFillScore(e.target.value)}
                  sx={{ width: 90 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBulkFill}
                  startIcon={<FlashOnIcon />}
                >
                  Fill All
                </Button>
              </Stack>
            )}
          </Stack>

          {/* Proficiency counts */}
          <Stack direction="row" spacing={1} flexwrap="wrap" useFlexGap alignItems="center">
            <Chip size="small" color="success" label={`EE: ${counts.EE}`} />
            <Chip size="small" color="primary" label={`ME: ${counts.ME}`} />
            <Chip size="small" color="warning" label={`AE: ${counts.AE}`} />
            <Chip size="small" color="error" label={`BE: ${counts.BE}`} />
            {counts.unmarked > 0 && (
              <Chip size="small" variant="outlined" label={`Unmarked: ${counts.unmarked}`} />
            )}
            {dirty && (
              <Chip size="small" label="Unsaved Changes" color="warning" sx={{ fontWeight: 600 }} />
            )}
          </Stack>
        </Stack>
      </Card>

      {/* Marks Table */}
      <Card elevation={1} sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={36} />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              No students found for this class stream.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>Adm No</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>Score (/100)</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 110 }}>CBC Rating</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 80 }}>Points</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Remarks & Comments</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, width: 100 }}>
                    Absent
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => {
                  const isNa = Boolean(row.isNa);

                  return (
                    <TableRow key={row.studentId || index} hover sx={{ opacity: isNa ? 0.6 : 1 }}>
                      <TableCell sx={{ fontWeight: 600 }}>{row.admissionNumber}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: 12,
                              bgcolor: "secondary.light",
                              color: "secondary.main",
                            }}
                          >
                            {getInitials(row.studentName)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.studentName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.score ?? ""}
                          disabled={!canEdit || isNa}
                          onChange={(e) => handleScoreChange(index, e.target.value)}
                          inputProps={{ min: 0, max: 100 }}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell>
                        {isNa ? (
                          <Chip label="ABS" size="small" color="error" variant="outlined" />
                        ) : row.grade ? (
                          <Chip
                            label={row.grade}
                            size="small"
                            color={
                              row.grade === "EE"
                                ? "success"
                                : row.grade === "ME"
                                  ? "primary"
                                  : row.grade === "AE"
                                    ? "warning"
                                    : "error"
                            }
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {isNa ? "0" : (row.points ?? "—")}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={row.comment || ""}
                            disabled={!canEdit || isNa}
                            onChange={(e) => handleCommentChange(index, e.target.value)}
                            placeholder="Teacher comment"
                          />
                          {canEdit && !isNa && row.commentEdited && (
                            <Tooltip title="Reset to suggested CBC comment">
                              <IconButton size="small" onClick={() => handleResetComment(index)}>
                                <ReplayIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color={isNa ? "error" : "inherit"}
                          variant={isNa ? "contained" : "outlined"}
                          onClick={() => handleToggleNa(index)}
                          sx={{ minWidth: 44, textTransform: "none", fontSize: "0.75rem" }}
                        >
                          {isNa ? "ABS" : "N/A"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
