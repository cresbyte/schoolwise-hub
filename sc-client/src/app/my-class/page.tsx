"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import PeopleIcon from "@mui/icons-material/People";
import WarningIcon from "@mui/icons-material/Warning";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { PageGuard } from "@/components/common/PageGuard";
import { StatCard } from "@/components/StatCard";
import { DataState } from "@/components/DataState";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function MyClassPage() {
  const { user, isClassTeacher } = useAuth();

  // classTeacherOf comes from the JWT — it's an array of class IDs (integers from the real DB)
  const classTeacherOf: number[] = (user as any)?.classTeacherOf ?? [];
  const classId = classTeacherOf[0] ? String(classTeacherOf[0]) : null;

  // Fetch all data in parallel from the real backend
  const classInfo  = useAsync(() => classId ? api.getClass(classId) : Promise.resolve(null), [classId]);
  const students   = useAsync(() => classId ? api.getStudentsByClass(classId) : Promise.resolve([]), [classId]);
  const exams      = useAsync(() => api.getExams(), []);

  // Derive today's date range for the current term attendance estimate
  const today      = new Date().toISOString().slice(0, 10);
  const termStart  = `${new Date().getFullYear()}-01-01`;
  const attendance = useAsync(
    () => classId ? api.getAttendanceSummary(classId, termStart, today) : Promise.resolve([]),
    [classId]
  );

  const loading = classInfo.loading || students.loading || attendance.loading;
  const error   = classInfo.error || students.error;

  // Compute stats from the real data
  const studentList: any[] = useMemo(() => {
    const res = students.data;
    return Array.isArray(res) ? res : (res as any)?.results ?? [];
  }, [students.data]);

  const attendanceList: any[] = useMemo(() => {
    const res = attendance.data;
    return Array.isArray(res) ? res : [];
  }, [attendance.data]);

  const attendanceRate = useMemo(() => {
    if (!attendanceList.length) return null;
    const avg = attendanceList.reduce((s: number, r: any) => s + (r.percentage ?? 0), 0) / attendanceList.length;
    return Math.round(avg);
  }, [attendanceList]);

  const studentsWithArrears = useMemo(
    () => studentList.filter((s: any) => (s.feeBalance ?? 0) > 0).length,
    [studentList]
  );

  const upcomingExams: any[] = useMemo(() => {
    const list = exams.data;
    return (Array.isArray(list) ? list : []).filter((e: any) => e.status === "upcoming").slice(0, 5);
  }, [exams.data]);

  const subjectsTaught: any[] = (user as any)?.subjectsTaught ?? [];

  return (
    <DashboardLayout>
      <PageGuard permission="students.view">
        {!isClassTeacher() ? (
          <Alert severity="warning">You are not currently assigned as a class teacher.</Alert>
        ) : (
          <>
            <PageHeader
              title={
                classInfo.loading
                  ? "My Class"
                  : `My Class: ${classInfo.data?.name ?? "—"}`
              }
              subtitle={`${studentList.length} students enrolled · Term 2, ${new Date().getFullYear()}`}
            />

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message}
              </Alert>
            )}

            {/* KPI Cards */}
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                mb: 3,
              }}
            >
              <StatCard
                icon={<PeopleIcon />}
                label="Enrolled Students"
                value={students.loading ? "…" : studentList.length}
                footer={<Typography variant="caption">This class</Typography>}
              />
              <StatCard
                icon={<EventAvailableIcon />}
                color="#2E7D32"
                label="Term Attendance"
                value={attendance.loading ? "…" : attendanceRate != null ? `${attendanceRate}%` : "N/A"}
                footer={<Typography variant="caption">Average across students</Typography>}
              />
              <StatCard
                icon={<EditNoteIcon />}
                color="#1565C0"
                label="Upcoming Exams"
                value={exams.loading ? "…" : upcomingExams.length}
                footer={<Typography variant="caption">Scheduled this term</Typography>}
              />
              <StatCard
                icon={<WarningIcon />}
                color="#C62828"
                label="Fee Arrears"
                value={students.loading ? "…" : studentsWithArrears}
                footer={<Typography variant="caption">Students with balances</Typography>}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", lg: "1.5fr 1fr" },
                mb: 3,
              }}
            >
              {/* Student Roster */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Student Roster
                  </Typography>
                  <DataState
                    loading={students.loading}
                    error={students.error}
                    data={studentList}
                    onRetry={students.refetch}
                    isEmpty={(d: any) => d.length === 0}
                  >
                    {(data: any[]) => (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Adm. No.</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Fee Balance</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.map((s: any) => (
                            <TableRow key={s.id} hover>
                              <TableCell sx={{ fontWeight: 600 }}>
                                {s.firstName} {s.lastName}
                              </TableCell>
                              <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                                {s.admissionNumber}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={s.status ?? "Active"}
                                  size="small"
                                  color={s.status === "active" || !s.status ? "success" : "default"}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: (s.feeBalance ?? 0) > 0 ? "error.main" : "success.main",
                                    fontWeight: 600,
                                  }}
                                >
                                  {(s.feeBalance ?? 0) > 0
                                    ? `KES ${Number(s.feeBalance).toLocaleString()}`
                                    : "Paid"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </DataState>
                </CardContent>
              </Card>

              {/* Right column */}
              <Stack spacing={2}>
                {/* My Subjects */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>
                      My Subjects in This Class
                    </Typography>
                    {subjectsTaught.filter((s: any) => String(s.class_room__id) === classId).length > 0 ? (
                      <Stack spacing={0.75}>
                        {subjectsTaught
                          .filter((s: any) => String(s.class_room__id) === classId)
                          .map((s: any, i: number) => (
                            <Box
                              key={i}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                p: 1,
                                bgcolor: "action.hover",
                                borderRadius: 1,
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {s.subject__name}
                              </Typography>
                              <Chip
                                label={`${s.periods_per_week} periods/wk`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No specific subjects assigned to you in this class.
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Exams */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>
                      Upcoming Exams
                    </Typography>
                    {exams.loading ? (
                      <LinearProgress />
                    ) : upcomingExams.length > 0 ? (
                      <Stack spacing={0.75}>
                        {upcomingExams.map((ex: any) => (
                          <Box
                            key={ex.id}
                            sx={{ p: 1, bgcolor: "action.hover", borderRadius: 1 }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {ex.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ex.startDate ?? ex.start_date} · {ex.examType ?? ex.exam_type ?? "Exam"}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No upcoming exams.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Box>

            {/* Attendance bar chart */}
            {attendanceList.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Student Attendance This Term (%)
                  </Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={attendanceList} layout="vertical" margin={{ left: 80, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} unit="%" fontSize={11} />
                      <YAxis dataKey="name" type="category" fontSize={11} width={80} />
                      <Tooltip formatter={(v: any) => `${v}%`} />
                      <Bar dataKey="percentage" fill="#1565C0" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </PageGuard>
    </DashboardLayout>
  );
}
