"use client";

/**
 * Parent portal: a parent's view of their child's school record.
 * @module portal/page
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import PaymentsIcon from "@mui/icons-material/Payments";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { DataState } from "@/components/DataState";
import { StatCard } from "@/components/StatCard";
import { GradeChip } from "@/components/GradeChip";
import { CBCRatingChip } from "@/components/CBCRatingChip";
import { useStudent } from "@/hooks/domain";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/mockApi";
import { formatKES, formatDate, getInitials } from "@/lib/utils";
import type { Student } from "@/lib/types";

export default function PortalPage() {
  return (
    <PortalLayout>
      <PortalContent />
    </PortalLayout>
  );
}

/** Parent portal content. */
function PortalContent() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? "std-1";
  const { data, loading, error, refetch } = useStudent(studentId);
  const [tab, setTab] = useState(0);

  return (
    <DataState loading={loading} error={error} data={data} onRetry={refetch}>
      {(s: Student) => (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Avatar sx={{ width: 72, height: 72, fontSize: 24, bgcolor: "primary.main" }}>{getInitials(`${s.firstName} ${s.lastName}`)}</Avatar>
                <Box>
                  <Typography variant="h5">{s.firstName} {s.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.className} · {s.admissionNumber}</Typography>
                  <Chip size="small" sx={{ mt: 0.5 }} label={s.boardingStatus === "day" ? "Day Scholar" : "Boarder"} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, mb: 2 }}>
            <StatCard icon={<PaymentsIcon />} color={s.feeBalance > 0 ? "#C62828" : "#2E7D32"} label="Fee Balance" value={formatKES(s.feeBalance)} />
            <StatCard icon={<EventAvailableIcon />} color="#1565C0" label="Curriculum" value={s.curriculum === "CBC" ? "CBC" : "8-4-4"} />
          </Box>

          {s.feeBalance > 0 && <Alert severity="warning" sx={{ mb: 2 }}>You have an outstanding fee balance of {formatKES(s.feeBalance)}. Kindly clear it before end of term.</Alert>}

          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tab label="Results" />
              <Tab label="Attendance" />
              <Tab label="Fees" />
            </Tabs>
            <CardContent>
              {tab === 0 && <ResultsTab studentId={s.id} curriculum={s.curriculum} />}
              {tab === 1 && <AttendanceTab studentId={s.id} />}
              {tab === 2 && <FeesTab studentId={s.id} />}
            </CardContent>
          </Card>
        </>
      )}
    </DataState>
  );
}

function ResultsTab({ studentId, curriculum }: { studentId: string; curriculum: string }) {
  const exams = useAsync(() => api.getExams(), []);
  const [examId, setExamId] = useState("exm-2");
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
              <TableHead><TableRow><TableCell>Subject</TableCell><TableCell align="right">Marks</TableCell><TableCell>Grade</TableCell>{curriculum === "CBC" && <TableCell>CBC</TableCell>}</TableRow></TableHead>
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
              <Typography variant="body2"><strong>Average:</strong> {r.average}%</Typography>
              <Typography variant="body2"><strong>Position:</strong> {r.position} / {r.classSize}</Typography>
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>{r.classTeacherComment}</Alert>
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
        const pct = records.length ? Math.round((present / records.length) * 100) : 0;
        return (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}><strong>Attendance rate:</strong> {pct}% ({present}/{records.length} days)</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {records.slice(0, 15).map((r: any) => (
                  <TableRow key={r.id}><TableCell>{formatDate(r.date)}</TableCell><TableCell sx={{ textTransform: "capitalize" }}>{r.status}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        );
      }}
    </DataState>
  );
}

function FeesTab({ studentId }: { studentId: string }) {
  const inv = useAsync(() => api.getStudentInvoice(studentId), [studentId]);
  const pays = useAsync(() => api.getPayments({ studentId }), [studentId]);
  return (
    <DataState loading={inv.loading} error={inv.error} data={inv.data} onRetry={inv.refetch}>
      {(i: any) => (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" }, gap: 2, mb: 3 }}>
            <Card variant="outlined" sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Charged</Typography><Typography sx={{ fontWeight: 700 }}>{formatKES(i.totalCharged)}</Typography></Card>
            <Card variant="outlined" sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Paid</Typography><Typography sx={{ fontWeight: 700 }}>{formatKES(i.totalPaid)}</Typography></Card>
            <Card variant="outlined" sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Balance</Typography><Typography sx={{ fontWeight: 700, color: i.balance > 0 ? "error.main" : "success.main" }}>{formatKES(i.balance)}</Typography></Card>
          </Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Payment History</Typography>
          <DataState loading={pays.loading} error={pays.error} data={pays.data} isEmpty={(d) => d.length === 0} emptyMessage="No payments yet">
            {(payments) => (
              <Table size="small">
                <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Receipt</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}><TableCell>{formatDate(p.paymentDate)}</TableCell><TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{p.receiptNumber}</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{formatKES(p.amount)}</TableCell></TableRow>
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
