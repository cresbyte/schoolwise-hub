"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Divider,
  TextField,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { useStudent } from "@/hooks/domain";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { calculateAge, formatDate, formatKES, getInitials } from "@/lib/utils";

import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";

export default function StudentDetailsPage() {
  const params = useParams();
  const id = params.id;
  return (
    <DashboardLayout>
      <PageGuard permission="students.view">
        <StudentDetail id={id} />
      </PageGuard>
    </DashboardLayout>
  );
}

function StudentDetail({ id }) {
  const router = useRouter();
  const { hasAnyRole } = useAuth();
  const canViewFees = hasAnyRole(["admin", "headteacher", "deputy", "accountant"]);
  const { data, loading, error, refetch } = useStudent(id);
  const [tab, setTab] = useState(0);

  return (
    <DataState loading={loading} error={error} data={data} onRetry={refetch}>
      {(s) => (
        <>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/students")}
            sx={{ mb: 2 }}
          >
            Back to Students
          </Button>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
                <Avatar
                  src={s.photo}
                  variant="rounded"
                  sx={{ width: 100, height: 125, fontSize: 32, bgcolor: "primary.main" }}
                >
                  {getInitials(`${s.firstName} ${s.lastName}`)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography variant="h5">
                      {s.firstName} {s.otherName} {s.lastName}
                    </Typography>
                    <Chip size="small" label={s.admissionNumber} sx={{ fontFamily: "monospace" }} />
                    <Chip
                      size="small"
                      label={s.status}
                      color={s.status === "active" ? "success" : "default"}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {s.className} · {s.gender} · DOB {formatDate(s.dateOfBirth)} (
                    {calculateAge(s.dateOfBirth)} yrs)
                  </Typography>
                </Box>
                <RoleGuard roles={["admin", "headteacher", "deputy"]}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => router.push(`/students/${s.id}/edit`)}
                  >
                    Edit
                  </Button>
                </RoleGuard>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label="Personal Info" />
              <Tab label="Exam Results" />
              <Tab label="Attendance" />
              {canViewFees && <Tab label="Fee Account" />}
            </Tabs>
            <CardContent>
              {tab === 0 && <PersonalTab s={s} />}
              {tab === 1 && <ResultsTab studentId={s.id} />}
              {tab === 2 && <AttendanceTab studentId={s.id} />}
              {tab === 3 && canViewFees && <FeeTab studentId={s.id} />}
            </CardContent>
          </Card>
        </>
      )}
    </DataState>
  );
}

function PersonalTab({ s }) {
  const { hasAnyRole } = useAuth();
  const canViewContacts = hasAnyRole(["admin", "headteacher", "deputy", "accountant"]);
  const parents = s.parents ?? [];

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Bio Data
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
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
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Parents
      </Typography>
      {parents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No parents on record.
        </Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {parents.map((p) => (
            <Card key={p.id} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                {p.relationship.toUpperCase()}
              </Typography>
              <Field label="Name" value={p.name} />
              <Field label="Phone" value={canViewContacts ? p.phone : "[Restricted]"} />
              <Field label="Email" value={canViewContacts ? p.email : "[Restricted]"} />
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

function ResultsTab({ studentId }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [term, setTerm] = useState(1);

  const {
    data: card,
    loading,
    error,
    refetch,
  } = useAsync(
    () => api.exams.getStudentReportCard(studentId, year, term),
    [studentId, year, term],
  );

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          select
          size="small"
          label="Year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          sx={{ width: 120 }}
        >
          <MenuItem value={2026}>2026</MenuItem>
          <MenuItem value={2025}>2025</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Term"
          value={term}
          onChange={(e) => setTerm(Number(e.target.value))}
          sx={{ width: 120 }}
        >
          <MenuItem value={1}>Term 1</MenuItem>
          <MenuItem value={2}>Term 2</MenuItem>
          <MenuItem value={3}>Term 3</MenuItem>
        </TextField>
      </Box>

      <DataState
        loading={loading}
        error={error}
        data={card}
        onRetry={refetch}
        isEmpty={(d) => !d || !d.subjects || d.subjects.length === 0}
        emptyMessage="No results for this term"
      >
        {(r) => (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell align="right">Marks</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {r.subjects.map((sub) => (
                  <TableRow key={sub.subject_name}>
                    <TableCell>{sub.subject_name}</TableCell>
                    <TableCell align="right">
                      {sub.marks_obtained} / {sub.total_marks}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={sub.grade} />
                    </TableCell>
                    <TableCell>{sub.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ display: "flex", gap: 3, mt: 2, flexWrap: "wrap" }}>
              <Field
                label="Total"
                value={`${r.summary.total_marks_obtained} / ${r.summary.total_marks_possible}`}
              />
              <Field label="Average" value={`${r.summary.overall_percentage}%`} />
              <Field
                label="Position"
                value={`${r.summary.position_in_class} / ${r.summary.total_students_in_class}`}
              />
              <Field label="Mean Grade" value={r.summary.mean_grade} />
            </Box>
            {r.teacher_comment && (
              <Box sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Class Teacher's Comment
                </Typography>
                <Typography variant="body2">{r.teacher_comment}</Typography>
              </Box>
            )}
          </>
        )}
      </DataState>
    </Box>
  );
}

function AttendanceTab({ studentId }) {
  const [year, setYear] = useState(2026);
  const [term, setTerm] = useState(2);

  // Calculate date range for the term (simplified)
  const dateFrom = term === 1 ? "2026-01-01" : term === 2 ? "2026-05-01" : "2026-09-01";
  const dateTo = term === 1 ? "2026-04-30" : term === 2 ? "2026-08-31" : "2026-12-31";

  const {
    data: records,
    loading,
    error,
    refetch,
  } = useAsync(
    () => api.getStudentAttendance(studentId, dateFrom, dateTo),
    [studentId, dateFrom, dateTo],
  );

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          select
          size="small"
          label="Year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          sx={{ width: 120 }}
        >
          <MenuItem value={2026}>2026</MenuItem>
          <MenuItem value={2025}>2025</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Term"
          value={term}
          onChange={(e) => setTerm(Number(e.target.value))}
          sx={{ width: 120 }}
        >
          <MenuItem value={1}>Term 1</MenuItem>
          <MenuItem value={2}>Term 2</MenuItem>
          <MenuItem value={3}>Term 3</MenuItem>
        </TextField>
      </Box>

      <DataState
        loading={loading}
        error={error}
        data={records || []}
        onRetry={refetch}
        isEmpty={(d) => d.length === 0}
        emptyMessage="No attendance records for this period"
      >
        {(records) => {
          const stats = {
            present: records.filter((r) => r.status === "present").length,
            absent: records.filter((r) => r.status === "absent").length,
            late: records.filter((r) => r.status === "late").length,
            excused: records.filter((r) => r.status === "excused").length,
            total: records.length,
          };
          const pct = stats.total
            ? Math.round(((stats.present + stats.late) / stats.total) * 100)
            : 0;

          return (
            <>
              <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 4 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell align="center">Present</TableCell>
                      <TableCell align="center">Absent</TableCell>
                      <TableCell align="center">Late</TableCell>
                      <TableCell align="center">Excused</TableCell>
                      <TableCell align="center" sx={{ bgcolor: "primary.main", color: "white" }}>
                        Overall %
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 800, fontSize: 18, color: "success.main" }}
                      >
                        {stats.present}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 800, fontSize: 18, color: "error.main" }}
                      >
                        {stats.absent}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 800, fontSize: 18, color: "warning.main" }}
                      >
                        {stats.late}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 800, fontSize: 18, color: "info.main" }}
                      >
                        {stats.excused}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 800,
                          fontSize: 18,
                          bgcolor: "primary.main",
                          color: "white",
                        }}
                      >
                        {pct}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                Daily Logs
              </Typography>
              <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Day</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{formatDate(r.date)}</TableCell>
                        <TableCell>
                          {new Date(r.date).toLocaleDateString("en-US", { weekday: "long" })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={r.status.toUpperCase()}
                            color={
                              r.status === "present"
                                ? "success"
                                : r.status === "absent"
                                  ? "error"
                                  : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell>{r.remarks || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          );
        }}
      </DataState>
    </Box>
  );
}

function FeeTab({ studentId }) {
  const {
    data: invoice,
    loading: invLoading,
    error: invError,
    refetch: invRefetch,
  } = useAsync(() => api.getStudentInvoice(studentId), [studentId]);

  const {
    data: payments,
    loading: paysLoading,
    refetch: paysRefetch,
  } = useAsync(() => api.getPayments({ student: studentId }), [studentId]);

  return (
    <DataState loading={invLoading} error={invError} data={invoice} onRetry={invRefetch}>
      {(i) => (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" },
              gap: 2,
              mb: 3,
            }}
          >
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Total Invoiced
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {formatKES(i.totalCharged || 0)}
              </Typography>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Total Paid
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {formatKES(i.totalPaid || 0)}
              </Typography>
            </Card>
            <Card
              variant="outlined"
              sx={{ p: 2, bgcolor: (i.balance || 0) > 0 ? "#C6282808" : "transparent" }}
            >
              <Typography variant="caption" color="text.secondary">
                Current Balance
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: (i.balance || 0) > 0 ? "error.main" : "success.main",
                }}
              >
                {formatKES(i.balance || 0)}
              </Typography>
            </Card>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Current Invoice Items
          </Typography>
          <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 4 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell>Fee Item</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(i.items || []).map((it, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{it.name}</TableCell>
                    <TableCell align="right">{formatKES(it.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Payment History
          </Typography>
          <DataState
            loading={paysLoading}
            data={payments || []}
            isEmpty={(d) => d.length === 0}
            emptyMessage="No payments recorded"
          >
            {(payments) => (
              <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.date)}</TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                          {p.reference || "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "success.main" }}>
                          {formatKES(p.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataState>
        </>
      )}
    </DataState>
  );
}

function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}
