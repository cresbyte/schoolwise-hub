"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuItem from "@mui/material/MenuItem";
import PublishIcon from "@mui/icons-material/Publish";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataState } from "@/components/DataState";
import { GradeChip } from "@/components/GradeChip";
import { StatusChip } from "@/components/StatusChip";
import { ClassSelect } from "@/components/ClassSelect";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { formatDate, getGrade, getSubjectGrade } from "@/lib/utils";
import { EXAM_TYPES } from "@/lib/constants";

export default function ExamDetailsPage() {
  const params = useParams();
  const id = params.id;
  return (
    <DashboardLayout>
      <ExamDetailContent id={id} />
    </DashboardLayout>
  );
}

function ExamDetailContent({ id }) {
  const router = useRouter();
  const { showNotification } = useNotification();
  const exam = useAsync(() => api.getExamById(id), [id]);
  const [tab, setTab] = useState(0);

  const publish = async () => {
    try {
      await api.publishExamResults(id);
      exam.refetch();
      showNotification("Results published successfully", "success");
    } catch (err) {
      showNotification(err.message || "Failed to publish exam", "error");
    }
  };

  return (
    <DataState loading={exam.loading} error={exam.error} data={exam.data} onRetry={exam.refetch}>
      {(e) => (
        <>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/exams")} sx={{ mb: 2 }}>
            Back to Exams
          </Button>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography variant="h5">{e.name}</Typography>
                    <Chip size="small" label={EXAM_TYPES.find((t) => t.value === e.type)?.label ?? e.type} color="primary" variant="outlined" />
                    <StatusChip status={e.status} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Term {e.term} · {e.year} · {formatDate(e.startDate)} – {formatDate(e.endDate)}
                  </Typography>
                </Box>
                <RoleGuard permission="exams.*">
                  {e.status === "ongoing" && (
                    <Button variant="contained" startIcon={<PublishIcon />} onClick={publish}>
                      Publish Results
                    </Button>
                  )}
                </RoleGuard>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tab label="Enter Marks" disabled={e.status === "upcoming"} />
              <Tab label="Class Results" disabled={e.status === "upcoming"} />
              <Tab label="Overview" />
            </Tabs>
            <CardContent>
              {tab === 0 && <MarksEntryTab examId={id} />}
              {tab === 1 && <ResultsTab examId={id} />}
              {tab === 2 && <OverviewTab exam={e} />}
            </CardContent>
          </Card>
        </>
      )}
    </DataState>
  );
}

function MarksEntryTab({ examId }) {
  const { showNotification } = useNotification();
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [rows, setRows] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleClassChange = async (cid) => {
    setClassId(cid);
    setSubjectId("");
    setRows([]);
    if (!cid) {
      setSubjects([]);
      return;
    }

    try {
      const assignments = await api.getClassSubjects({ classId: cid });
      if (assignments && assignments.length > 0) {
        const mapped = assignments.map(a => ({
          id: a.subjectId,
          name: a.subjectName,
          gradingSystem: a.gradingSystem || []
        }));
        setSubjects(mapped);
        setSubjectId(mapped[0].id);
      } else {
        const allSubs = await api.getSubjects();
        setSubjects(allSubs);
        if (allSubs.length > 0) {
          setSubjectId(allSubs[0].id);
        }
      }
    } catch (err) {
      const allSubs = await api.getSubjects();
      setSubjects(allSubs);
      if (allSubs.length > 0) {
        setSubjectId(allSubs[0].id);
      }
    }
  };

  useEffect(() => {
    if (!classId || !subjectId) return;

    let active = true;
    const fetchStudentsAndMarks = async () => {
      setLoadingStudents(true);
      try {
        const existing = await api.getExamMarks(examId, classId, subjectId);
        const studs = await api.getStudentsByClass(classId);
        if (active) {
          const selectedSub = subjects.find(s => s.id === subjectId);
          setRows(
            studs.map((s) => {
              const m = existing.find((x) => x.studentId === s.id);
              return m ?? {
                id: `tmp-${s.id}`,
                examId: examId,
                studentId: s.id,
                studentName: `${s.firstName} ${s.lastName}`,
                admissionNumber: s.admissionNumber,
                subjectId: subjectId,
                subjectName: selectedSub?.name || "",
                classId: classId,
                marks: null,
                teacherComment: "",
                enteredBy: "Teacher",
                enteredAt: new Date().toISOString(),
              };
            })
          );
        }
      } catch (err) {
        showNotification("Failed to load marks status", "error");
      } finally {
        if (active) setLoadingStudents(false);
      }
    };

    fetchStudentsAndMarks();
    return () => {
      active = false;
    };
  }, [classId, subjectId, examId, subjects]);

  const setMark = (studentId, value) => {
    const marks = value === "" ? null : Math.max(0, Math.min(100, Number(value)));
    setRows((prev) =>
      prev.map((r) => {
        if (r.studentId === studentId) {
          const subject = subjects.find((s) => s.id === subjectId);
          const rule = subject?.gradingSystem?.find((rule) => marks >= rule.min && marks <= rule.max);
          const { grade, color } = marks !== null ? getSubjectGrade(marks, subject) : { grade: undefined, color: undefined };
          return {
            ...r,
            marks,
            grade,
            color,
            teacherComment: rule?.comment || r.teacherComment || "",
          };
        }
        return r;
      })
    );
  };

  const setComment = (studentId, value) => {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, teacherComment: value } : r))
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.saveExamMarks(examId, classId, rows);
      showNotification("Marks saved successfully", "success");
    } catch (err) {
      showNotification(err.message || "Failed to save marks", "error");
    } finally {
      setSaving(false);
    }
  };

  const entered = rows.filter((r) => r.marks != null).length;

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <ClassSelect value={classId} onChange={handleClassChange} allOption={false} label="Select Class" />
        <TextField
          select
          size="small"
          label="Subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          sx={{ width: 220 }}
          disabled={subjects.length === 0}
        >
          {subjects.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {!classId ? (
        <Alert severity="info">Select a class to begin entering marks.</Alert>
      ) : loadingStudents ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : (
        <>
          {rows.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Marks entered: {entered} / {rows.length}
              </Typography>
              <LinearProgress variant="determinate" value={(entered / rows.length) * 100} sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Adm.</TableCell>
                <TableCell>Student</TableCell>
                <TableCell width={110}>Marks (/100)</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Teacher Comment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.studentId}>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{r.admissionNumber}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{r.studentName}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={r.marks ?? ""}
                      onChange={(e) => setMark(r.studentId, e.target.value)}
                      slotProps={{ htmlInput: { min: 0, max: 100 } }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>{r.marks != null ? <GradeChip grade={r.grade} color={r.color} /> : "—"}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Comment..."
                      value={r.teacherComment || ""}
                      onChange={(e) => setComment(r.studentId, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" onClick={save} disabled={!classId || !subjectId || saving}>
              {saving ? "Saving…" : "Save Marks"}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

function ResultsTab({ examId }) {
  const { showNotification } = useNotification();
  const [classId, setClassId] = useState("");
  const [commentDialog, setCommentDialog] = useState({ open: false });
  const cards = useAsync(() => (classId ? api.generateReportCards(examId, classId) : Promise.resolve([])), [examId, classId]);
  const list = cards.data ?? [];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <ClassSelect value={classId} onChange={setClassId} allOption={false} label="Select Class" />
      </Box>
      {!classId ? (
        <Alert severity="info">Select a class to view results.</Alert>
      ) : (
        <DataState loading={cards.loading} error={cards.error} data={list} onRetry={cards.refetch} isEmpty={(d) => d.length === 0} emptyMessage="No results. Enter marks first.">
          {() => (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pos.</TableCell>
                  <TableCell>Adm. No.</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Average</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Teacher Comment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((rc) => (
                  <TableRow key={rc.studentId} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{rc.position}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{rc.admissionNumber}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{rc.studentName}</TableCell>
                    <TableCell align="right">{rc.totalMarks}</TableCell>
                    <TableCell align="right">{rc.average}%</TableCell>
                    <TableCell><GradeChip grade={rc.averageGrade} color={rc.averageGradeColor} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {rc.classTeacherComment}
                        </Typography>
                        <Button size="small" onClick={() => setCommentDialog({ open: true, studentId: rc.studentId, studentName: rc.studentName, comment: rc.classTeacherComment })}>Edit</Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DataState>
      )}

      {commentDialog.open && (
        <Dialog open={commentDialog.open} onClose={() => setCommentDialog({ open: false })} fullWidth maxWidth="xs">
          <DialogTitle>Edit Teacher Comment</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ mb: 2 }}><strong>Student:</strong> {commentDialog.studentName}</Typography>
            <TextField
              label="Class Teacher Comment"
              fullWidth
              multiline
              rows={3}
              value={commentDialog.comment || ""}
              onChange={e => setCommentDialog({ ...commentDialog, comment: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCommentDialog({ open: false })}>Cancel</Button>
            <Button variant="contained" onClick={async () => {
              try {
                await api.saveClassTeacherComments(examId, classId, [{ studentId: commentDialog.studentId, comment: commentDialog.comment }]);
                showNotification("Comment saved", "success");
                setCommentDialog({ open: false });
                cards.refetch();
              } catch (err) {
                showNotification(err.message || "Failed to save comment", "error");
              }
            }}>Save Comment</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

function OverviewTab({ exam }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
      {[
        ["Exam Name", exam.name],
        ["Type", EXAM_TYPES.find((t) => t.value === exam.type)?.label ?? exam.type],
        ["Term", `Term ${exam.term}`],
        ["Year", String(exam.year)],
        ["Start Date", formatDate(exam.startDate)],
        ["End Date", formatDate(exam.endDate)],
        ["Status", exam.status],
      ].map(([label, value]) => (
        <Box key={label}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
        </Box>
      ))}
    </Box>
  );
}
