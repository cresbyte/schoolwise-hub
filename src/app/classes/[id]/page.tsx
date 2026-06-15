"use client";

/**
 * Class detail page: students, subjects, timetable and performance tabs.
 * @module classes/[id]/page
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataState } from "@/components/DataState";
import { GradeChip } from "@/components/GradeChip";
import { StatusChip } from "@/components/StatusChip";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { formatKES, getInitials } from "@/lib/utils";
import { DAYS_OF_WEEK } from "@/lib/constants";
import type { ClassSubject, Student, TimetableSlot } from "@/lib/types";

export default function ClassDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  return (
    <DashboardLayout>
      <ClassDetailContent id={id} />
    </DashboardLayout>
  );
}

const PERIODS = ["7:30", "8:30", "9:30", "10:30", "11:45", "12:45", "1:45", "2:45"];

function ClassDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const classData = useAsync(() => api.getClassById(id), [id]);
  const [tab, setTab] = useState(0);

  return (
    <DataState loading={classData.loading} error={classData.error} data={classData.data} onRetry={classData.refetch}>
      {(cls: any) => (
        <>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/classes")} sx={{ mb: 2 }}>
            Back to Classes
          </Button>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontSize: 20 }}>
                  {cls.name.substring(0, 2)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography variant="h5">{cls.name}</Typography>
                    <Chip size="small" label={cls.curriculum} color="primary" variant="outlined" />
                    <Chip size="small" label={cls.gradeLevel} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Class Teacher: {cls.classTeacherName ?? "—"} · Room: {cls.room ?? "—"} · {cls.studentCount}/{cls.capacity} students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tab label="Students" />
              <Tab label="Subjects & Teachers" />
              <Tab label="Timetable" />
              <Tab label="Performance" />
            </Tabs>
            <CardContent>
              {tab === 0 && <StudentsTab classId={id} />}
              {tab === 1 && <SubjectsTab classId={id} />}
              {tab === 2 && <TimetableTab classId={id} />}
              {tab === 3 && <PerformanceTab classId={id} gradeLevel={cls.gradeLevel} />}
            </CardContent>
          </Card>
        </>
      )}
    </DataState>
  );
}

function StudentsTab({ classId }: { classId: string }) {
  const students = useAsync(() => api.getStudentsByClass(classId), [classId]);
  const list = students.data ?? [];

  return (
    <DataState loading={students.loading} error={students.error} data={list} onRetry={students.refetch} isEmpty={(d) => d.length === 0}>
      {() => (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Adm. No.</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Boarding</TableCell>
              <TableCell>Fee Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((s: Student, i: number) => (
              <TableRow key={s.id} hover>
                <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>{i + 1}</TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{s.admissionNumber}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</TableCell>
                <TableCell>{s.gender}</TableCell>
                <TableCell><Chip size="small" label={s.boardingStatus === "day" ? "Day" : "Boarder"} /></TableCell>
                <TableCell sx={{ color: s.feeBalance > 0 ? "error.main" : "success.main", fontWeight: 600 }}>
                  {formatKES(s.feeBalance)}
                </TableCell>
                <TableCell><StatusChip status={s.status} /></TableCell>
                <TableCell>
                  <Button size="small" component={Link} href={`/students/${s.id}`}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataState>
  );
}

function SubjectsTab({ classId }: { classId: string }) {
  const subjects = useAsync(() => api.getClassSubjects(classId), [classId]);
  const list = subjects.data ?? [];

  return (
    <DataState loading={subjects.loading} error={subjects.error} data={list} onRetry={subjects.refetch} isEmpty={(d) => d.length === 0}>
      {() => (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Periods / Week</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((cs: ClassSubject) => (
              <TableRow key={cs.subjectId} hover>
                <TableCell sx={{ fontWeight: 600 }}>{cs.subjectName}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: "secondary.main" }}>
                      {getInitials(cs.teacherName ?? "")}
                    </Avatar>
                    {cs.teacherName}
                  </Box>
                </TableCell>
                <TableCell>{cs.periodsPerWeek ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataState>
  );
}

function TimetableTab({ classId }: { classId: string }) {
  const slots = useAsync(() => api.getTimetable(classId), [classId]);
  const list = slots.data ?? [];

  const grid: Record<string, Record<string, TimetableSlot | undefined>> = {};
  PERIODS.forEach((p) => { grid[p] = {}; });
  list.forEach((slot) => {
    if (grid[slot.startTime]) grid[slot.startTime][slot.day] = slot;
  });

  return (
    <DataState loading={slots.loading} error={slots.error} data={list} onRetry={slots.refetch} isEmpty={(d) => d.length === 0}>
      {() => (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 80 }}>Time</TableCell>
                {DAYS_OF_WEEK.map((d) => (
                  <TableCell key={d} sx={{ fontWeight: 700 }}>{d}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {PERIODS.map((period) => (
                <TableRow key={period}>
                  <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{period}</TableCell>
                  {DAYS_OF_WEEK.map((day) => {
                    const slot = grid[period]?.[day];
                    return (
                      <TableCell key={day} sx={{ p: 0.75, verticalAlign: "top" }}>
                        {slot ? (
                          <Box sx={{ bgcolor: "primary.main", color: "#fff", borderRadius: 1, p: 0.75 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>{slot.subjectName}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>{slot.teacherName}</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 0.75, minHeight: 40 }} />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </DataState>
  );
}

function PerformanceTab({ classId, gradeLevel }: { classId: string; gradeLevel: string }) {
  const isForm4 = gradeLevel === "Form 4";
  const exams = useAsync(() => api.getExams(), []);
  const [examId, setExamId] = useState("exm-2");
  const report = useAsync(() => api.getClassPerformanceReport(classId, examId), [classId, examId]);
  const knec7 = useAsync(() => (isForm4 ? api.getKNEC7Best(classId, examId) : Promise.resolve(null)), [classId, examId, isForm4]);

  return (
    <Box>
      <TextField select size="small" label="Exam" value={examId} onChange={(e) => setExamId(e.target.value)} sx={{ width: 240, mb: 3 }}>
        {(exams.data ?? []).filter((e) => e.status !== "upcoming").map((e) => (
          <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>
        ))}
      </TextField>

      <DataState loading={report.loading} error={report.error} data={report.data} onRetry={report.refetch}>
        {(data: any) => (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Subject Performance</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.subjectStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" fontSize={11} height={50} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Bar dataKey="average" fill="#1565C0" name="Average %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="passRate" fill="#2E7D32" name="Pass Rate %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <Table size="small" sx={{ mt: 3 }}>
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
                {data.subjectStats.map((s: any) => (
                  <TableRow key={s.subject} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{s.subject}</TableCell>
                    <TableCell align="right"><GradeChip grade={s.average >= 50 ? "C" : "D"} label={`${s.average}%`} /></TableCell>
                    <TableCell align="right">{s.highest}%</TableCell>
                    <TableCell align="right">{s.lowest}%</TableCell>
                    <TableCell align="right">
                      <Chip size="small" label={`${s.passRate}%`} color={s.passRate >= 60 ? "success" : s.passRate >= 40 ? "warning" : "error"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {isForm4 && knec7.data && (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 4, mb: 1 }}>KNEC 7-Best Analysis (Form 4)</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>KCSE grade is computed from a student's 7 best subject scores.</Alert>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Pos.</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell align="right">7-Best Total</TableCell>
                      <TableCell>Top 7 Subjects</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(knec7.data as any[]).map((row: any, i: number) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.studentName}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{row.best7Total}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            {row.subjects.map((sub: any, j: number) => (
                              <Chip key={j} size="small" label={`${sub.subjectName}: ${sub.marks}`} sx={{ fontSize: 10 }} />
                            ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </>
        )}
      </DataState>
    </Box>
  );
}
