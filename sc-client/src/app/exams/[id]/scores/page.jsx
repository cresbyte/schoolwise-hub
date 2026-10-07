"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Alert,
  Snackbar,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

const EXAM_TYPE_LABELS = {
  cat: "CAT",
  midterm: "Mid-Term",
  endterm: "End of Term",
  opener: "Opener Exam",
  mock: "Mock Exam",
  assignment: "Assignment",
};

export default function ExamScoresPage() {
  const params = useParams();
  const examId = params.id;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // 1. Fetch basic exam info for the header
  const {
    data: exam,
    loading: examLoading,
    error: examError,
  } = useAsync(() => api.exams.get(examId), [examId]);

  // 2. Fetch ONLY the subjects this specific teacher is allowed to grade
  const { data: mySubjects, loading: subjectsLoading } = useAsync(
    () => api.exams.getMyExamSubjects(examId),
    [examId],
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  useEffect(() => {
    if (mySubjects?.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(mySubjects[0].id);
    }
  }, [mySubjects, selectedSubjectId]);

  if (examLoading || subjectsLoading) {
    return (
      <DashboardLayout>
        <Typography sx={{ p: 4 }}>Loading...</Typography>
      </DashboardLayout>
    );
  }

  if (examError || !exam) {
    return (
      <DashboardLayout>
        <Typography color="error" sx={{ p: 4 }}>
          Exam not found or you do not have permission.
        </Typography>
      </DashboardLayout>
    );
  }

  const examTypeLabel = EXAM_TYPE_LABELS[exam.examType] || exam.examType;

  // Group allowed subjects by class for the UI
  const subjectsByClass = (mySubjects || []).reduce((acc, subject) => {
    const className = subject.classRoomName || "Unknown Class";
    if (!acc[className]) acc[className] = [];
    acc[className].push(subject);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <PageHeader
        title={isMobile ? exam.name.split(" ").slice(0, 3).join(" ") + "..." : exam.name}
        subtitle={`Term ${exam.term}, ${exam.year} · ${examTypeLabel}`}
        actions={
          <Button
            component={Link}
            href="/exams"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
          >
            Back
          </Button>
        }
      />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {/* Subject Picker: Dropdown on Mobile, Sidebar on Desktop */}
        <Card
          sx={{
            p: 2,
            width: { xs: "100%", md: 280 },
            alignSelf: "flex-start",
            maxHeight: { md: "calc(100vh - 200px)" },
            overflowY: { md: "auto" },
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            My Classes to Grade
          </Typography>

          {isMobile ? (
            <FormControl fullWidth size="small">
              <InputLabel>Select Subject</InputLabel>
              <Select
                value={selectedSubjectId || ""}
                label="Select Subject"
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {Object.entries(subjectsByClass)
                  .map(([className, subjects]) => [
                    <MenuItem key={`header-${className}`} disabled>
                      <em>{className}</em>
                    </MenuItem>,
                    ...subjects.map((s) => (
                      <MenuItem key={s.id} value={s.id} sx={{ pl: 4 }}>
                        {s.subjectName}
                      </MenuItem>
                    )),
                  ])
                  .flat()}
              </Select>
            </FormControl>
          ) : Object.keys(subjectsByClass).length > 0 ? (
            Object.entries(subjectsByClass).map(([className, subjects]) => (
              <Box key={className} sx={{ mb: 2 }}>
                <Typography
                  variant="overline"
                  color="primary"
                  fontWeight="bold"
                  sx={{ display: "block", mb: 0.5, px: 1 }}
                >
                  {className}
                </Typography>
                <Stack spacing={0.5}>
                  {subjects.map((s) => (
                    <Button
                      key={s.id}
                      variant={selectedSubjectId === s.id ? "contained" : "text"}
                      onClick={() => setSelectedSubjectId(s.id)}
                      sx={{
                        justifyContent: "flex-start",
                        textTransform: "none",
                        pl: 2,
                        fontWeight: selectedSubjectId === s.id ? 600 : 400,
                      }}
                    >
                      {s.subjectName}
                    </Button>
                  ))}
                </Stack>
              </Box>
            ))
          ) : (
            <Card sx={{ p: 2, bgcolor: "action.hover", textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                You are not assigned to grade any subjects for this exam.
              </Typography>
            </Card>
          )}
        </Card>

        {/* Score entry area */}
        <Box sx={{ flex: 1 }}>
          {selectedSubjectId ? (
            <ScoreEntryPanel examSubjectId={selectedSubjectId} exam={exam} />
          ) : (
            <Card sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">Select a subject to enter scores</Typography>
            </Card>
          )}
        </Box>
      </Stack>
    </DashboardLayout>
  );
}

function ScoreEntryPanel({ examSubjectId, exam }) {
  const {
    data: responseData,
    loading,
    error,
    refetch,
  } = useAsync(() => api.exams.getExamSubjectScores(examSubjectId), [examSubjectId]);

  const scores = responseData?.scores || [];
  const gradingScale = responseData?.grading_scale || [];
  const totalMarks =
    responseData?.total_marks ||
    exam.subjects?.find((s) => s.id === examSubjectId)?.totalMarks ||
    100;

  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (scores.length > 0 && gradingScale.length > 0) {
      const initial = {};
      scores.forEach((s) => {
        const marks =
          s.marksObtained !== null && s.marksObtained !== undefined
            ? Number(s.marksObtained)
            : null;
        let comment = s.teacherComment;

        if ((!comment || comment.trim() === "") && marks !== null && totalMarks) {
          const pct = (marks / totalMarks) * 100;
          const gInfo = gradingScale.find((g) => pct >= Number(g.min) && pct <= Number(g.max));
          if (gInfo) comment = gInfo.comment;
        }

        initial[s.studentId] = {
          marks: marks !== null ? String(marks) : "",
          comment: comment || "",
        };
      });
      setEdits(initial);
    }
  }, [scores, gradingScale, totalMarks]);

  const handleChange = (studentId, field, value) => {
    setEdits((prev) => {
      const current = prev[studentId] || { marks: "", comment: "" };
      const next = { ...current, [field]: value };

      if (field === "marks" && (!current.comment || current.comment.trim() === "")) {
        const marks = Number(value);
        if (!isNaN(marks) && marks >= 0 && totalMarks) {
          const pct = (marks / totalMarks) * 100;
          const gInfo = gradingScale.find((g) => pct >= Number(g.min) && pct <= Number(g.max));
          if (gInfo) next.comment = gInfo.comment;
        }
      }
      return { ...prev, [studentId]: next };
    });
  };

  const getGradeInfo = (marks) => {
    if (!marks || !totalMarks) return null;
    const pct = (Number(marks) / Number(totalMarks)) * 100;
    return gradingScale.find((g) => pct >= Number(g.min) && pct <= Number(g.max));
  };

  const handleSave = async () => {
    for (const [, data] of Object.entries(edits)) {
      if (data.marks === "" || data.marks === undefined) continue;
      const n = Number(data.marks);
      if (Number.isNaN(n) || n < 0)
        return setSnackbar({
          open: true,
          message: "Marks must be a non-negative number",
          severity: "error",
        });
      if (totalMarks !== undefined && n > totalMarks)
        return setSnackbar({
          open: true,
          message: `Marks cannot exceed ${totalMarks}`,
          severity: "error",
        });
    }

    setSaving(true);
    try {
      const payload = Object.entries(edits)
        .map(([studentId, data]) => ({
          studentId,
          marksObtained: data.marks === "" ? null : Number(data.marks),
          teacherComment: data.comment || "",
        }))
        .filter((s) => s.marksObtained !== null);

      if (payload.length === 0) {
        setSaving(false);
        return setSnackbar({
          open: true,
          message: "Enter at least one score before saving",
          severity: "error",
        });
      }

      await api.exams.saveExamSubjectScores(examSubjectId, payload);
      setSnackbar({ open: true, message: "Scores saved successfully", severity: "success" });
      refetch();
    } catch (e) {
      setSnackbar({ open: true, message: e.message || "Failed to save scores", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const subjectInfo = exam.subjects?.find((s) => s.id === examSubjectId);

  return (
    <>
      <Card>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{subjectInfo?.subjectName}</Typography>
          <Typography variant="body2" color="text.secondary">
            Class: {subjectInfo?.classRoomName} · Total Marks: {totalMarks}
          </Typography>
        </Box>
        <Divider />
        <DataState
          loading={loading}
          error={error}
          data={scores}
          onRetry={refetch}
          isEmpty={(d) => !d || d.length === 0}
          emptyMessage="No active students found in this class."
        >
          {() => (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Adm No</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell align="right" sx={{ width: { xs: 70, sm: 100 } }}>
                        Marks
                      </TableCell>
                      <TableCell sx={{ width: { xs: 80, sm: 120 } }}>Grade</TableCell>
                      <TableCell>Comment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scores.map((s) => {
                      const gradeInfo = getGradeInfo(edits[s.studentId]?.marks);
                      return (
                        <TableRow key={s.studentId}>
                          <TableCell sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                            {s.admissionNumber}
                          </TableCell>
                          <TableCell sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                            {s.studentName}
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              inputMode="decimal" // Opens numeric keypad on mobile
                              value={edits[s.studentId]?.marks ?? ""}
                              onChange={(e) => handleChange(s.studentId, "marks", e.target.value)}
                              inputprops={{
                                min: 0,
                                max: totalMarks,
                                style: { textAlign: "right" },
                              }}
                              sx={{ width: { xs: 60, sm: 80 } }}
                            />
                          </TableCell>
                          <TableCell>
                            {gradeInfo ? (
                              <Box>
                                <Chip
                                  label={gradeInfo.grade}
                                  size="small"
                                  color="primary"
                                  sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: "0.65rem" }}
                                >
                                  {gradeInfo.points} pts
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={edits[s.studentId]?.comment ?? ""}
                              onChange={(e) => handleChange(s.studentId, "comment", e.target.value)}
                              placeholder="Enter custom comment..."
                              sx={{ fontSize: "0.8rem" }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Sticky Save Button for Mobile */}
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "flex-end",
                  position: { xs: "sticky", md: "static" },
                  bottom: 0,
                  bgcolor: "background.paper",
                  zIndex: 10,
                  borderTop: { xs: 1, md: 0 },
                  borderColor: "divider",
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}

                >
                  {saving ? "Saving..." : "Save Scores"}
                </Button>
              </Box>
            </>
          )}
        </DataState>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
