"use client";

import { useState, useEffect } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import AddIcon from "@mui/icons-material/Add";
import EditNoteIcon from "@mui/icons-material/EditNote";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { StatusChip } from "@/components/StatusChip";
import { GradeChip } from "@/components/GradeChip";
import { ClassSelect } from "@/components/ClassSelect";
import { RoleGuard } from "@/components/RoleGuard";
import { PageGuard } from "@/components/common/PageGuard";
import { useExams } from "@/hooks/domain";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { formatDate, getGrade, getSubjectGrade } from "@/lib/utils";
import { EXAM_TYPES } from "@/lib/constants";

export default function ExamsPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="exams.view">
        <ExamsContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function ExamsContent() {
  const router = useRouter();
  const { data, loading, error, refetch } = useExams();
  const [marksFor, setMarksFor] = useState(null);
  const list = data ?? [];
  return (
    <>
      <PageHeader
        title="Examinations"
        subtitle={<Chip size="small" label={`${list.length} exams`} />}
        actions={
          <RoleGuard permission="exams.*">
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/exams/new")}>
              Create Exam
            </Button>
          </RoleGuard>
        }
      />
      <Card>
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d) => d.length === 0}>
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Exam</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Link href={`/exams/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {e.name}
                        </Link>
                      </TableCell>
                      <TableCell>{EXAM_TYPES.find((t) => t.value === e.type)?.label ?? e.type}</TableCell>
                      <TableCell>Term {e.term} · {e.year}</TableCell>
                      <TableCell>{formatDate(e.startDate)} – {formatDate(e.endDate)}</TableCell>
                      <TableCell><StatusChip status={e.status} /></TableCell>
                      <TableCell align="right">
                        <RoleGuard permission="exams.marks">
                          <Button size="small" startIcon={<EditNoteIcon />} disabled={e.status === "upcoming"} onClick={() => setMarksFor(e)}>
                            Enter Marks
                          </Button>
                        </RoleGuard>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      </Card>
      {marksFor && <MarksDialog exam={marksFor} onClose={() => setMarksFor(null)} />}
    </>
  );
}

function MarksDialog({ exam, onClose }) {
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
        // Map assignments to standard subject structures containing name/id
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
    if (!classId || !subjectId || !exam) return;

    let active = true;
    const fetchStudentsAndMarks = async () => {
      setLoadingStudents(true);
      try {
        const existing = await api.getExamMarks(exam.id, classId, subjectId);
        const studs = await api.getStudentsByClass(classId);
        if (active) {
          const selectedSub = subjects.find(s => s.id === subjectId);
          setRows(
            studs.map((s) => {
              const m = existing.find((x) => x.studentId === s.id);
              return m ?? {
                id: `tmp-${s.id}`,
                examId: exam.id,
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
  }, [classId, subjectId, exam, subjects]);

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
    if (!exam || !classId) return;
    setSaving(true);
    try {
      await api.saveExamMarks(exam.id, classId, rows);
      showNotification("Marks saved successfully", "success");
      onClose();
    } catch (err) {
      showNotification(err.message || "Failed to save marks", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!exam} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Enter Marks — {exam?.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 1, mb: 2, display: "flex", gap: 2 }}>
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
          <Typography variant="body2" color="text.secondary">Select a class to enter marks.</Typography>
        ) : loadingStudents ? (
          <Typography variant="body2" color="text.secondary">Loading students…</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Adm.</TableCell>
                <TableCell>Student</TableCell>
                <TableCell width={120}>Marks (/100)</TableCell>
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
                      sx={{ width: 100 }}
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
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!classId || !subjectId || saving}>
          {saving ? "Saving…" : "Save Marks"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
