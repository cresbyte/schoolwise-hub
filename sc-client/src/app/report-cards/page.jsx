"use client";

/**
 * Report cards: generate per class/exam, preview and print.
 * @module report-cards/page
 */
import { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import PrintIcon from "@mui/icons-material/Print";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { GradeChip } from "@/components/GradeChip";
import { CBCRatingChip } from "@/components/CBCRatingChip";
import { ClassSelect } from "@/components/ClassSelect";
import { Letterhead } from "@/components/Letterhead";
import { useExams, useReportCards } from "@/hooks/domain";

export default function ReportCardsPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="reports.view">
        <ReportCardsContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function ReportCardsContent() {
  const exams = useExams();
  const examOptions = (exams.data ?? []).filter((e) => e.status !== "upcoming");
  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!examId && examOptions.length > 0) {
      setExamId(String(examOptions[0].id));
    }
  }, [examOptions, examId]);

  const cards = useReportCards(examId, classId);
  const list = cards.data ?? [];

  return (
    <>
      <PageHeader title="Report Cards" subtitle="Generate and print termly report cards" />
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField select size="small" label="Exam" value={examId} onChange={(e) => setExamId(e.target.value)} sx={{ width: 240 }}>
            {examOptions.map((e) => <MenuItem key={e.id} value={String(e.id)}>{e.name}</MenuItem>)}
          </TextField>
          <ClassSelect value={classId} onChange={setClassId} allOption={false} label="Select Class" />
        </Box>
      </Card>
      {!classId ? (
        <Card><CardContent><Typography variant="body2" color="text.secondary">Select a class to generate report cards.</Typography></CardContent></Card>
      ) : (
        <Card>
          <DataState loading={cards.loading} error={cards.error} data={list} onRetry={cards.refetch} isEmpty={(d) => d.length === 0} emptyMessage="No results for this class/exam">
            {() => (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pos.</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Average</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((rc) => (
                    <TableRow key={rc.studentId} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{rc.position}</TableCell>
                      <TableCell>{rc.studentName}</TableCell>
                      <TableCell align="right">{rc.totalMarks}</TableCell>
                      <TableCell align="right">{rc.average}%</TableCell>
                      <TableCell align="right"><Button size="small" onClick={() => setPreview(rc)}>View</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataState>
        </Card>
      )}
      <ReportCardDialog rc={preview} onClose={() => setPreview(null)} />
    </>
  );
}

function ReportCardDialog({ rc, onClose }) {
  return (
    <Dialog open={!!rc} onClose={onClose} maxWidth="md" fullWidth>
      {rc && (
        <>
          <DialogContent>
            <Box className="printable">
              <Letterhead title={`Report Card — Term ${rc.term}, ${rc.year}`} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
                <Typography variant="body2"><strong>Name:</strong> {rc.studentName}</Typography>
                <Typography variant="body2"><strong>Adm No:</strong> {rc.admissionNumber}</Typography>
                <Typography variant="body2"><strong>Class:</strong> {rc.className}</Typography>
                <Typography variant="body2"><strong>Position:</strong> {rc.position} / {rc.classSize}</Typography>
              </Box>
              <Table size="small" sx={{ mb: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell align="right">Marks</TableCell>
                    <TableCell>Grade</TableCell>
                    {rc.curriculum === "CBC" && <TableCell>CBC</TableCell>}
                    <TableCell>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rc.subjects.map((s) => (
                    <TableRow key={s.subjectName}>
                      <TableCell>{s.subjectName}</TableCell>
                      <TableCell align="right">{s.marks} / {s.outOf}</TableCell>
                      <TableCell><GradeChip grade={s.grade} /></TableCell>
                      {rc.curriculum === "CBC" && <TableCell><CBCRatingChip rating={s.cbcRating} /></TableCell>}
                      <TableCell>{s.teacherComment ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
                <Typography variant="body2"><strong>Total:</strong> {rc.totalMarks}</Typography>
                <Typography variant="body2"><strong>Average:</strong> {rc.average}%</Typography>
                <Typography variant="body2"><strong>Attendance:</strong> {rc.attendance?.daysPresent ?? 0}/{rc.attendance?.totalDays ?? 0} days</Typography>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="body2" sx={{ mb: 1 }}><strong>Class Teacher:</strong> {rc.classTeacherComment}</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}><strong>Principal:</strong> {rc.principalComment}</Typography>
            </Box>
          </DialogContent>
          <DialogActions className="no-print" sx={{ p: 2 }}>
            <Button onClick={onClose}>Close</Button>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
