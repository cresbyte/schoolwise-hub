"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/hooks/useAsync";
import { academicsApi } from "@/lib/academicsApi";
import { examsApi } from "@/lib/examsApi";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ReplayIcon from "@mui/icons-material/Replay";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
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
  Tooltip,
} from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function MarksEntryPage() {
  return (
    <>
      <PageGuard permission="exams.marks">
        <MarksEntryContent />
      </PageGuard>
    </>
  );
}

function MarksEntryContent() {
  const { id: examId, examSubjectId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Default to whatever class the caller passed in the URL
  const initialClassId = searchParams.get("class_room") || "";

  const [classId, setClassId] = useState(initialClassId);
  const [rows, setRows] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  // Fetch all classes so we can populate the stream picker
  const { data: setup } = useAsync(async () => {
    const [classes, exam] = await Promise.all([academicsApi.getClasses(), examsApi.get(examId)]);
    return { classes: Array.isArray(classes) ? classes : [], exam };
  }, [examId]);

  const allClasses = setup?.classes ?? [];
  const exam = setup?.exam;

  const { data, loading, error, refetch } = useAsync(async () => {
    const roster = await examsApi.getRoster(examSubjectId, classId || null);
    return roster;
  }, [examSubjectId, classId]);

  const examSubject = data?.examSubject;
  const canEdit = data?.canEdit;
  const gradeLevel = examSubject?.gradeLevel;

  // Classes in this subject's grade, this exam's year, and (if the exam is
  // limited to certain classes) only those classes
  const relevantClasses = useMemo(
    () =>
      allClasses.filter(
        (c) =>
          c.gradeLevel === gradeLevel &&
          String(c.academicYear) === String(exam?.academic_year) &&
          (!exam?.classRooms?.length || exam.classRooms.includes(c.id)),
      ),
    [allClasses, gradeLevel, exam],
  );

  // If no class picked but only one exists in this grade, use it
  useEffect(() => {
    if (!classId && relevantClasses.length === 1) {
      setClassId(relevantClasses[0].id);
    }
  }, [relevantClasses, classId]);

  // Sync rows from server when roster arrives or class changes.
  // Uses useEffect, not a top-level if, so we never setState during render.
  useEffect(() => {
    if (!data?.rows) return;
    setRows(
      data.rows.map((r) => ({
        ...r,
        // A saved comment means someone edited it (or it was default-filled).
        // Either way, don't overwrite it when the score changes.
        commentEdited: Boolean(r.comment && r.comment.trim()),
      })),
    );
    setDirty(false);
  }, [data]);

  // ---- score / comment handlers ----------------------------------------

  const handleScoreChange = (index, value) => {
    setRows((prev) => {
      const next = [...prev];
      const row = next[index];
      const band = lookupBand(examSubject?.grading_scale, value);

      row.score = value;
      row.grade = band?.grade || "";
      row.points = band?.points || 0;

      // Auto-fill the comment only if the teacher hasn't edited it
      if (!row.commentEdited) {
        row.comment = band?.comment || "";
      }

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
      const band = lookupBand(examSubject?.grading_scale, next[index].score);
      next[index] = {
        ...next[index],
        comment: band?.comment || "",
        commentEdited: false,
      };
      return next;
    });
    setDirty(true);
  };

  const handleMarkAll = (scoreValue) => {
    setRows((prev) =>
      prev.map((r) => {
        const band = lookupBand(examSubject?.grading_scale, scoreValue);
        return {
          ...r,
          score: String(scoreValue),
          grade: band?.grade || "",
          points: band?.points || 0,
          // Bulk-fill clears any per-row edit state
          comment: band?.comment || "",
          commentEdited: false,
        };
      }),
    );
    setDirty(true);
  };

  // ---- save ------------------------------------------------------------

  const handleSave = async () => {
    for (const r of rows) {
      if (!r.isNa && (r.score === "" || r.score === null || isNaN(Number(r.score)))) {
        return notify(`${r.studentName} has no score.`, "error");
      }
    }

    setSaving(true);
    try {
      await examsApi.saveMarks(
        examSubjectId,
        rows.map((r) => ({
          studentId: r.studentId,
          score: r.isNa ? null : Number(r.score),
          comment: r.comment,
          isNa: r.isNa,
        })),
      );
      notify(`Saved ${rows.length} marks`);
      setDirty(false);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ---- derived ---------------------------------------------------------

  const counts = useMemo(() => {
    const c = { EE: 0, ME: 0, AE: 0, BE: 0, none: 0 };
    rows.forEach((r) => {
      if (r.score === "" || r.score === null) c.none++;
      else if (r.grade) c[r.grade] = (c[r.grade] || 0) + 1;
    });
    return c;
  }, [rows]);

  return (
    <>
      <PageHeader
        title={examSubject ? `${examSubject.subjectName} · ${gradeLevel}` : "Marks entry"}
        subtitle={
          canEdit
            ? "Enter scores. Grades and comments auto-fill — edit any comment to override."
            : "Read-only — this exam is not open for marks."
        }
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push(`/exams/${examId}`)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={!canEdit || saving || !dirty}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </Stack>
        }
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexwrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Class (stream)</InputLabel>
            <Select
              value={classId}
              label="Class (stream)"
              onChange={(e) => {
                setClassId(e.target.value);
                setRows([]);
              }}
            >
              <MenuItem value="">All streams</MenuItem>
              {relevantClasses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flex: 1 }} />

          {canEdit && (
            <Button startIcon={<FlashOnIcon />} onClick={() => handleMarkAll(75)}>
              Mark all 75
            </Button>
          )}

          <Stack direction="row" spacing={1}>
            <Chip size="small" color="success" variant="outlined" label={`EE: ${counts.EE}`} />
            <Chip size="small" color="info" variant="outlined" label={`ME: ${counts.ME}`} />
            <Chip size="small" color="warning" variant="outlined" label={`AE: ${counts.AE}`} />
            <Chip size="small" color="error" variant="outlined" label={`BE: ${counts.BE}`} />
          </Stack>
        </Stack>
      </Card>

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => rows.length === 0}
        emptyMessage="No students on the roster for this subject."
      >
        {() => (
          <Card>
            <TableContainer sx={{ maxHeight: 640 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      Score
                    </TableCell>
                    <TableCell align="center" sx={{ width: 80 }}>
                      Grade
                    </TableCell>
                    <TableCell align="right" sx={{ width: 80 }}>
                      Points
                    </TableCell>
                    <TableCell>Comment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={r.studentId} hover>
                      <TableCell sx={{ color: "text.secondary" }}>{i + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 26, height: 26, fontSize: 11 }}>
                            {r.studentName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </Avatar>
                          <span style={{ fontWeight: 500 }}>{r.studentName}</span>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={r.score}
                          onChange={(e) => handleScoreChange(i, e.target.value)}
                          disabled={!canEdit}
                          inputProps={{
                            min: 0,
                            max: examSubject?.max_mark || 100,
                            style: { textAlign: "right" },
                          }}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {r.grade && (
                          <Chip
                            size="small"
                            label={r.grade}
                            color={
                              r.grade === "EE"
                                ? "success"
                                : r.grade === "ME"
                                  ? "info"
                                  : r.grade === "AE"
                                    ? "warning"
                                    : "error"
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">{r.points}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <TextField
                            size="small"
                            fullWidth
                            value={r.comment || ""}
                            onChange={(e) => handleCommentChange(i, e.target.value)}
                            disabled={!canEdit}
                            placeholder="(default comment)"
                          />
                          {canEdit && r.commentEdited && (
                            <Tooltip title="Reset to suggested comment">
                              <IconButton size="small" onClick={() => handleResetComment(i)}>
                                <ReplayIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </DataState>

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

// Local grade lookup so the grade badge updates as the teacher types.
// Uses the same bands the server uses so preview and save always agree.
function lookupBand(scale, score) {
  if (!scale || score === "" || score === null) return null;
  const n = Number(score);
  if (isNaN(n)) return null;
  return scale.find((b) => n >= b.min && n <= b.max) || null;
}
