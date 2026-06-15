"use client";

/**
 * Student detail page: bio, exams, attendance, fees.
 * @module students/[id]/page
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataState } from "@/components/DataState";
import { StatusChip } from "@/components/StatusChip";
import { GradeChip } from "@/components/GradeChip";
import { CBCRatingChip } from "@/components/CBCRatingChip";
import { useStudent } from "@/hooks/domain";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { calculateAge, formatDate, formatKES, getInitials } from "@/lib/utils";
import type { Student } from "@/lib/types";

export default function StudentDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  return (
    <DashboardLayout>
      <StudentDetail id={id} />
    </DashboardLayout>
  );
}

function Field({ label, value }: { label: string; value?: string | number }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value ?? "—"}</Typography>
    </Box>
  );
}

/** Student detail body. */
function StudentDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, loading, error, refetch } = useStudent(id);
  const [tab, setTab] = useState(0);

  return (
    <DataState loading={loading} error={error} data={data} onRetry={refetch}>
      {(s: Student) => (
        <>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/students")} sx={{ mb: 2 }}>
            Back to Students
          </Button>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
                <Avatar sx={{ width: 84, height: 84, fontSize: 28, bgcolor: "primary.main" }}>
                  {getInitials(`${s.firstName} ${s.lastName}`)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography variant="h5">{s.firstName} {s.otherName} {s.lastName}</Typography>
                    <Chip size="small" label={s.admissionNumber} sx={{ fontFamily: "monospace" }} />
                    <StatusChip status={s.status} />
                    <Chip size="small" color="secondary" label={s.boardingStatus === "day" ? "Day Scholar" : "Boarder"} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {s.className} · {s.gender} · DOB {formatDate(s.dateOfBirth)} ({calculateAge(s.dateOfBirth)} yrs) · NEMIS {s.nemisNumber}
                  </Typography>
                </Box>
                <Button variant="outlined" startIcon={<EditIcon />}>Edit</Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tab label="Personal Info" />
              <Tab label="Exam Results" />
              <Tab label="Attendance" />
              <Tab label="Fee Account" />
            </Tabs>
            <CardContent>
              {tab === 0 && <PersonalTab s={s} />}
              {tab === 1 && <ResultsTab studentId={s.id} curriculum={s.curriculum} />}
              {tab === 2 && <AttendanceTab studentId={s.id} />}
              {tab === 3 && <FeeTab studentId={s.id} />}
            </CardContent>
          </Card>
        </>
      )}
    </DataState>
  );
}

function PersonalTab({ s }: { s: Student }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Bio Data</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <Field label="First Name" value={s.firstName} />
        <Field label="Last Name" value={s.lastName} />
        <Field label="Other Name" value={s.otherName} />
        <Field label="Gender" value={s.gender} />
        <Field label="Date of Birth" value={formatDate(s.dateOfBirth)} />
        <Field label="Birth Cert No." value={s.birthCertNumber} />
        <Field label="Home Location" value={s.homeLocation} />
        <Field label="Admission Date" value={formatDate(s.admissionDate)} />
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Parent / Guardian</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>FATHER</Typography>
          <Field label="Name" value={s.parent.fatherName} />
          <Field label="Phone" value={s.parent.fatherPhone} />
          <Field label="Occupation" value={s.parent.fatherOccupation} />
        </Card>
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>MOTHER</Typography>
          <Field label="Name" value={s.parent.motherName} />
          <Field label="Phone" value={s.parent.motherPhone} />
          <Field label="Occupation" value={s.parent.motherOccupation} />
        </Card>
      </Box>
    </Box>
  );
}

function ResultsTab({ studentId, curriculum }: { studentId: string; curriculum: string }) {
  const [examId, setExamId] = useState("exm-2");
  const exams = useAsync(() => api.getExams(), []);
  const rc = useAsync(() => api.getStudentReportCard(studentId, examId), [studentId, examId]);
  return (
    <Box>
      <TextField select size="small" label="Exam" value={examId} onChange={(e) => setExamId(e.target.value)} sx={{ width: 240, mb: 2 }}>
        {(exams.data ?? []).filter((e) => e.status !== "upcoming").map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
      </TextField>
      <DataState loading={rc.loading} error={rc.error} data={rc.data} onRetry={rc.refetch}>
        {(r) => (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell align="right">Marks</TableCell>
                  <TableCell>Grade</TableCell>
                  {curriculum === "CBC" && <TableCell>CBC Rating</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {r.subjects.map((sub: any) => (
                  <TableRow key={sub.subjectName}>
                    <TableCell>{sub.subjectName}</TableCell>
                    <TableCell align="right">{sub.marks} / {sub.outOf}</TableCell>
                    <TableCell><GradeChip grade={sub.grade} /></TableCell>
                    {curriculum === "CBC" && <TableCell><CBCRatingChip rating={sub.cbcRating} /></TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ display: "flex", gap: 3, mt: 2, flexWrap: "wrap" }}>
              <Field label="Total" value={r.totalMarks} />
              <Field label="Average" value={`${r.average}%`} />
              <Field label="Position" value={`${r.position} / ${r.classSize}`} />
            </Box>
          </>
        )}
      </DataState>
    </Box>
  );
}

function AttendanceTab({ studentId }: { studentId: string }) {
  const att = useAsync(() => api.getStudentAttendance(studentId, "2024-05-01", "2024-08-31"), [studentId]);
  return (
    <DataState loading={att.loading} error={att.error} data={att.data} onRetry={att.refetch} isEmpty={(d) => d.length === 0} emptyMessage="No attendance records">
      {(records) => {
        const present = records.filter((r: any) => r.status === "present").length;
        const absent = records.filter((r: any) => r.status === "absent").length;
        const late = records.filter((r: any) => r.status === "late").length;
        const pct = records.length ? Math.round(((present + late) / records.length) * 100) : 0;
        return (
          <>
            <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
              <Field label="Present" value={present} />
              <Field label="Absent" value={absent} />
              <Field label="Late" value={late} />
              <Field label="Attendance" value={`${pct}%`} />
            </Box>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell>Reason</TableCell></TableRow></TableHead>
              <TableBody>
                {records.slice(0, 20).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell><StatusChip status={r.status === "present" ? "active" : r.status === "absent" ? "unpaid" : "pending"} /></TableCell>
                    <TableCell>{r.reason ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        );
      }}
    </DataState>
  );
}

function FeeTab({ studentId }: { studentId: string }) {
  const inv = useAsync(() => api.getStudentInvoice(studentId), [studentId]);
  const pays = useAsync(() => api.getPayments({ studentId }), [studentId]);
  return (
    <DataState loading={inv.loading} error={inv.error} data={inv.data} onRetry={inv.refetch}>
      {(i: any) => (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" }, gap: 2, mb: 3 }}>
            <Card variant="outlined" sx={{ p: 2 }}><Field label="Charged This Term" value={formatKES(i.totalCharged)} /></Card>
            <Card variant="outlined" sx={{ p: 2 }}><Field label="Paid" value={formatKES(i.totalPaid)} /></Card>
            <Card variant="outlined" sx={{ p: 2, bgcolor: i.balance > 0 ? "#C6282808" : "transparent" }}>
              <Typography variant="caption" color="text.secondary">Balance</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: i.balance > 0 ? "error.main" : "success.main" }}>{formatKES(i.balance)}</Typography>
            </Card>
          </Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Invoice Breakdown</Typography>
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead><TableRow><TableCell>Fee Item</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
            <TableBody>
              {i.items.map((it: any) => <TableRow key={it.name}><TableCell>{it.name}</TableCell><TableCell align="right">{formatKES(it.amount)}</TableCell></TableRow>)}
            </TableBody>
          </Table>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Payment History</Typography>
          <DataState loading={pays.loading} error={pays.error} data={pays.data} isEmpty={(d) => d.length === 0} emptyMessage="No payments yet">
            {(payments) => (
              <Table size="small">
                <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Receipt</TableCell><TableCell align="right">Amount</TableCell><TableCell>Method</TableCell></TableRow></TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.paymentDate)}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{p.receiptNumber}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatKES(p.amount)}</TableCell>
                      <TableCell>{p.paymentMethod}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataState>
        </>
      )}
    </DataState>
  );
}
