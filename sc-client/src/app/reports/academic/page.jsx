"use client";

/**
 * Academic reports: school performance trend and per-class subject analysis.
 * @module reports/academic/page
 */
import { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { ClassSelect } from "@/components/ClassSelect";
import { useExams, useClassPerformanceReport, useSchoolPerformanceTrend } from "@/hooks/domain";

export default function AcademicReportsPage() {
  return (
    <DashboardLayout>
      <AcademicReportsContent />
    </DashboardLayout>
  );
}

function AcademicReportsContent() {
  const exams = useExams();
  const examOptions = (exams.data ?? []).filter((e) => e.status !== "upcoming");
  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const trend = useSchoolPerformanceTrend();
  const report = useClassPerformanceReport(classId, examId);

  useEffect(() => {
    if (!examId && examOptions.length > 0) {
      setExamId(String(examOptions[0].id));
    }
  }, [examOptions, examId]);

  return (
    <>
      <PageHeader title="Academic Reports" subtitle="School performance analytics" />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>School Mean Score Trend</Typography>
          <DataState loading={trend.loading} error={trend.error} data={trend.data} onRetry={trend.refetch} isEmpty={(d) => !d?.length} emptyMessage="No published exam data yet">
            {(data) => (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="term" fontSize={12} />
                  <YAxis fontSize={12} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="average" stroke="#1565C0" strokeWidth={2} name="Average" />
                  <Line type="monotone" dataKey="highest" stroke="#2E7D32" strokeWidth={2} name="Highest" />
                  <Line type="monotone" dataKey="lowest" stroke="#C62828" strokeWidth={2} name="Lowest" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </CardContent>
      </Card>
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField select size="small" label="Exam" value={examId} onChange={(e) => setExamId(e.target.value)} sx={{ width: 240 }}>
            {examOptions.map((e) => <MenuItem key={e.id} value={String(e.id)}>{e.name}</MenuItem>)}
          </TextField>
          <ClassSelect value={classId} onChange={setClassId} allOption={false} label="Class" />
        </Box>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Subject Analysis</Typography>
          {!classId ? (
            <Typography variant="body2" color="text.secondary">Select a class to view subject analysis.</Typography>
          ) : (
            <DataState loading={report.loading} error={report.error} data={report.data} onRetry={report.refetch} isEmpty={(d) => !d?.subjectStats?.length} emptyMessage="No marks for this class/exam">
              {(data) => (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell align="right">Average</TableCell>
                      <TableCell align="right">Highest</TableCell>
                      <TableCell align="right">Lowest</TableCell>
                      <TableCell align="right">Pass Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.subjectStats.map((s) => (
                      <TableRow key={s.subject}>
                        <TableCell sx={{ fontWeight: 600 }}>{s.subject}</TableCell>
                        <TableCell align="right">{s.average}%</TableCell>
                        <TableCell align="right">{s.highest}</TableCell>
                        <TableCell align="right">{s.lowest}</TableCell>
                        <TableCell align="right">{s.passRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataState>
          )}
        </CardContent>
      </Card>
    </>
  );
}
