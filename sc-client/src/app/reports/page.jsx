"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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
import { ClassSelect } from "@/components/ClassSelect";
import { Letterhead } from "@/components/Letterhead";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

const GRADE_COLORS = {
  EE: "success",
  ME: "info",
  AE: "warning",
  BE: "warning",
  NI: "error",
};

function GradeBadge({ grade }) {
  if (!grade) return "—";
  return <Chip label={grade} size="small" color={GRADE_COLORS[grade] || "default"} />;
}

/**
 * Backend (build_report_card_with_rank) returns:
 * { student: {id, name, admission_number, class_room, ...},
 *   term: {year, term},
 *   subjects: [{subject_name, marks_obtained, total_marks, percentage, grade, interpretation, points, teacher_comment}],
 *   summary: {total_marks_obtained, total_marks_possible, overall_percentage, mean_grade, mean_points,
 *             position_in_class, total_students_in_class},
 *   teacher_comment }
 * Normalize it once so the UI only deals with one shape.
 */
function normalizeCard(rc, fallbackYear, fallbackTerm) {
  const st = rc.student || {};
  const sm = rc.summary || {};
  return {
    key: st.id ?? rc.student_id ?? rc.studentId,
    studentName: st.name ?? rc.student_name ?? rc.studentName ?? "",
    admissionNumber: st.admission_number ?? rc.admission_number ?? rc.admissionNumber ?? "",
    className: st.class_room ?? rc.class_room ?? rc.className ?? "",
    year: rc.term?.year ?? fallbackYear,
    term: rc.term?.term ?? fallbackTerm,
    subjects: (rc.subjects || []).map((s) => ({
      name: s.subject_name ?? s.subjectName,
      marks: s.marks_obtained ?? s.marksObtained,
      outOf: s.total_marks ?? s.totalMarks,
      percentage: s.percentage,
      grade: s.grade,
      interpretation: s.interpretation,
      comment: s.teacher_comment ?? s.teacherComment ?? "",
    })),
    totalObtained: sm.total_marks_obtained ?? 0,
    totalPossible: sm.total_marks_possible ?? 0,
    average: sm.overall_percentage ?? 0,
    meanGrade: sm.mean_grade ?? "",
    meanPoints: sm.mean_points ?? 0,
    position: sm.position_in_class ?? 0,
    classSize: sm.total_students_in_class ?? 0,
    teacherComment: rc.teacher_comment ?? "",
  };
}

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
  const { data: examsRaw } = useAsync(() => api.exams.list(), []);
  const exams = Array.isArray(examsRaw) ? examsRaw : examsRaw?.results || [];

  const [year, setYear] = useState("");
  const [term, setTerm] = useState("");
  const [classId, setClassId] = useState("");
  const [preview, setPreview] = useState(null);

  // Default year/term to the most recent exam (API returns newest first)
  useEffect(() => {
    if (!year && !term && exams.length > 0) {
      setYear(String(exams[0].year));
      setTerm(String(exams[0].term));
    }
  }, [exams, year, term]);

  const yearOptions = useMemo(() => {
    const ys = new Set(exams.map((e) => e.year));
    ys.add(new Date().getFullYear());
    return [...ys].sort((a, b) => b - a);
  }, [exams]);

  const ready = Boolean(classId && year && term);

  const {
    data: raw,
    loading,
    error,
    refetch,
  } = useAsync(
    () => (ready ? api.exams.getClassReportCards(classId, year, term) : Promise.resolve([])),
    [classId, year, term],
  );

  const list = useMemo(() => {
    const arr = Array.isArray(raw) ? raw : raw?.cards || raw?.students || [];
    return arr
      .map((rc) => normalizeCard(rc, Number(year), Number(term)))
      .sort((a, b) => {
        // Ranked students first (1, 2, 3...), unranked (0) last
        if (!a.position && !b.position) return a.studentName.localeCompare(b.studentName);
        if (!a.position) return 1;
        if (!b.position) return -1;
        return a.position - b.position;
      });
  }, [raw, year, term]);

  return (
    <>
      <PageHeader title="Report Cards" subtitle="Generate and print termly report cards" />
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            select
            size="small"
            label="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            sx={{ width: 120 }}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={String(y)}>
                {y}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            sx={{ width: 120 }}
          >
            <MenuItem value="1">Term 1</MenuItem>
            <MenuItem value="2">Term 2</MenuItem>
            <MenuItem value="3">Term 3</MenuItem>
          </TextField>
          <ClassSelect
            value={classId}
            onChange={setClassId}
            allOption={false}
            label="Select Class"
          />
        </Box>
      </Card>

      {!ready ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Select a year, term and class to generate report cards.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <DataState
            loading={loading}
            error={error}
            data={list}
            onRetry={refetch}
            isEmpty={(d) => !d || d.length === 0}
            emptyMessage="No results for this class, year and term. Enter scores first."
          >
            {() => (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pos.</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Adm No</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Average</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((rc) => (
                    <TableRow key={rc.key} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{rc.position || "—"}</TableCell>
                      <TableCell>{rc.studentName}</TableCell>
                      <TableCell>{rc.admissionNumber}</TableCell>
                      <TableCell align="right">
                        {rc.totalObtained} / {rc.totalPossible}
                      </TableCell>
                      <TableCell align="right">{rc.average}%</TableCell>
                      <TableCell>
                        <GradeBadge grade={rc.meanGrade} />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => setPreview(rc)}>
                          View
                        </Button>
                      </TableCell>
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
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography variant="body2">
                  <strong>Name:</strong> {rc.studentName}
                </Typography>
                <Typography variant="body2">
                  <strong>Adm No:</strong> {rc.admissionNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Class:</strong> {rc.className}
                </Typography>
                <Typography variant="body2">
                  <strong>Position:</strong> {rc.position || "—"} / {rc.classSize}
                </Typography>
              </Box>

              <Table size="small" sx={{ mb: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell align="right">Marks</TableCell>
                    <TableCell align="right">%</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rc.subjects.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell align="right">
                        {s.marks} / {s.outOf}
                      </TableCell>
                      <TableCell align="right">{s.percentage}%</TableCell>
                      <TableCell>
                        <GradeBadge grade={s.grade} />{" "}
                        <Typography component="span" variant="caption" color="text.secondary">
                          {s.interpretation}
                        </Typography>
                      </TableCell>
                      <TableCell>{s.comment || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
                <Typography variant="body2">
                  <strong>Total:</strong> {rc.totalObtained} / {rc.totalPossible}
                </Typography>
                <Typography variant="body2">
                  <strong>Average:</strong> {rc.average}%
                </Typography>
                <Typography variant="body2">
                  <strong>Mean Grade:</strong> {rc.meanGrade} ({rc.meanPoints} pts)
                </Typography>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Class Teacher:</strong> {rc.teacherComment || "—"}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions className="no-print" sx={{ p: 2 }}>
            <Button onClick={onClose}>Close</Button>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
              Print
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
