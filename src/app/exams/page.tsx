"use client";

/**
 * Examinations: list exams, create exams and enter marks per class/subject.
 * @module exams/page
 */
import { useState } from "react";
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
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { formatDate, getGrade } from "@/lib/utils";
import { EXAM_TYPES } from "@/lib/constants";
import type { Exam, ExamMark } from "@/lib/types";

export default function ExamsPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="exams.view">
        <ExamsContent />
      </PageGuard>
    </DashboardLayout>
  );
}

/** Examinations page content. */
function ExamsContent() {
  const router = useRouter();
  const { data, loading, error, refetch } = useExams();
  const [marksFor, setMarksFor] = useState<Exam | null>(null);
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
      <MarksDialog exam={marksFor} onClose={() => setMarksFor(null)} />
    </>
  );
}

/** Marks entry dialog for an exam: pick class, edit marks, save. */
function MarksDialog({ exam, onClose }: { exam: Exam | null; onClose: () => void }) {
  const { showNotification } = useNotification();
  const [classId, setClassId] = useState("");
  const [rows, setRows] = useState<ExamMark[]>([]);
  const [saving, setSaving] = useState(false);
  const students = useAsync(() => (classId ? api.getStudentsByClass(classId) : Promise.resolve([])), [classId]);

  const load = async (cid: string) => {
    setClassId(cid);
    if (!cid || !exam) return;
    const existing = await api.getExamMarks(exam.id, cid);
    const studs = await api.getStudentsByClass(cid);
    setRows(
      studs.map((s) => {
        const m = existing.find((x: any) => x.studentId === s.id);
        return m ?? {
          id: `tmp-${s.id}`, examId: exam.id, studentId: s.id, studentName: `${s.firstName} ${s.lastName}`,
          admissionNumber: s.admissionNumber, subjectId: "sub-math", subjectName: "Mathematics", classId: cid,
          marks: null, enteredBy: "Teacher", enteredAt: new Date().toISOString(),
        } as ExamMark;
      }),
    );
  };

  const setMark = (studentId: string, value: string) => {
    const marks = value === "" ? null : Math.max(0, Math.min(100, Number(value)));
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, marks } : r)));
  };

  const save = async () => {
    if (!exam) return;
    setSaving(true);
    await api.saveExamMarks(exam.id, classId, rows);
    setSaving(false);
    showNotification("Marks saved successfully", "success");
    onClose();
    setClassId("");
    setRows([]);
  };

  return (
    <Dialog open={!!exam} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Enter Marks — {exam?.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 1, mb: 2 }}>
          <ClassSelect value={classId} onChange={load} allOption={false} label="Select Class" />
          <TextField select size="small" label="Subject" value="Mathematics" sx={{ width: 180, ml: 1.5 }} disabled>
            <MenuItem value="Mathematics">Mathematics</MenuItem>
          </TextField>
        </Box>
        {!classId ? (
          <Typography variant="body2" color="text.secondary">Select a class to enter marks.</Typography>
        ) : students.loading ? (
          <Typography variant="body2" color="text.secondary">Loading students…</Typography>
        ) : (
          <Table size="small">
            <TableHead><TableRow><TableCell>Adm.</TableCell><TableCell>Student</TableCell><TableCell width={120}>Marks (/100)</TableCell><TableCell>Grade</TableCell></TableRow></TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.studentId}>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{r.admissionNumber}</TableCell>
                  <TableCell>{r.studentName}</TableCell>
                  <TableCell>
                    <TextField type="number" size="small" value={r.marks ?? ""} onChange={(e) => setMark(r.studentId, e.target.value)} slotProps={{ htmlInput: { min: 0, max: 100 } }} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell>{r.marks != null ? <GradeChip grade={getGrade(r.marks)} /> : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!classId || saving}>{saving ? "Saving…" : "Save Marks"}</Button>
      </DialogActions>
    </Dialog>
  );
}
