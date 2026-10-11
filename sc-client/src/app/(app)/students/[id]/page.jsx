"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { studentApi } from "@/lib/studentApi";
import { AttendanceGrid } from "@/components/attendance/AttendanceGrid";
import { attendanceApi } from "@/lib/attendanceApi";
import LinearProgress from "@mui/material/LinearProgress";
import { feesApi, formatKES } from "@/lib/feesApi";
import PaymentsIcon from "@mui/icons-material/Payments";
import PrintIcon from "@mui/icons-material/Print";
import { RecordPaymentDialog } from "@/components/fees/RecordPaymentDialog";

export default function StudentProfilePage() {
  return (
    <PageGuard permission="students.view">
      <StudentProfileContent />
    </PageGuard>
  );
}

function StudentProfileContent() {
  const { id } = useParams();
  const router = useRouter();
  const [tab, setTab] = useState(0);

  const { data, loading, error, refetch } = useAsync(async () => {
    const [student, enrollments] = await Promise.all([
      studentApi.getStudent(id),
      studentApi.getStudentEnrollments(id),
    ]);
    return {
      student,
      enrollments: Array.isArray(enrollments) ? enrollments : [],
    };
  }, [id]);

  const student = data?.student;
  const enrollments = data?.enrollments ?? [];
  const activeEnrollment = enrollments.find((e) => e.status === "active");

  return (
    <>
      <PageHeader
        title={student ? `${student.firstName} ${student.lastName}` : "Student"}
        subtitle={student ? `Admission ${student.admissionNumber}` : ""}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/students")}
            >
              Back
            </Button>
            <RoleGuard permission="students.manage">
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/students/${id}/edit`)}
              >
                Edit
              </Button>
            </RoleGuard>
          </Stack>
        }
      />

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() =>
          student && (
            <Grid container spacing={3}>
              {/* Left: identity card */}
              <Grid item size={{ sm: 12, md: 3 }}>
                <Card sx={{ p: 3 }}>
                  <Stack alignitems="center" spacing={2}>
                    <Avatar
                      src={student.photo || undefined}
                      sx={{ width: 96, height: 96, fontSize: 32 }}
                    >
                      {student.firstName?.[0]}
                      {student.lastName?.[0]}
                    </Avatar>
                    <Box textalign="center">
                      <Typography variant="h6">
                        {student.firstName} {student.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {student.admissionNumber}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={student.status}
                      color={student.status === "active" ? "success" : "default"}
                    />
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  <Stack spacing={1.5}>
                    <DetailRow label="Grade" value={student.gradeLevel} />
                    <DetailRow label="Class" value={student.className} />
                    <DetailRow label="Gender" value={student.gender} />
                    <DetailRow label="Date of birth" value={student.dateOfBirth} />
                    <DetailRow label="Admission date" value={student.admissionDate} />
                    <DetailRow label="Home location" value={student.homeLocation} />
                    <DetailRow label="NEMIS" value={student.nemisNumber} />
                    <DetailRow label="Birth cert" value={student.birthCertNumber} />
                  </Stack>
                </Card>
              </Grid>

              {/* Right: tabs */}
              <Grid item size={{ sm: 12, md: 9 }}>
                <Card>
                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ borderBottom: 1, borderColor: "divider" }}
                  >
                    <Tab label="Parents / guardians" />
                    <Tab label="Enrollment history" />
                    <Tab label="Health" />
                    <Tab label="Attendance" />
                    <Tab label="Fees" />
                  </Tabs>

                  <Box sx={{ p: 3 }}>
                    {tab === 0 && <ParentsTab parents={student.parents || []} />}
                    {tab === 1 && <EnrollmentsTab enrollments={enrollments} />}
                    {tab === 2 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Health information
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {student.health_info || "No health information recorded."}
                        </Typography>
                      </Box>
                    )}
                    {tab === 3 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Attendance
                        </Typography>
                        <AttendanceTab studentId={student.id} />
                      </Box>
                    )}
                    {tab === 4 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Fees
                        </Typography>
                        <FeesTab studentId={student.id} />
                      </Box>
                    )}
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )
        }
      </DataState>
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack direction="row" justifycontent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, textalign: "right" }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
}

function ParentsTab({ parents }) {
  if (!parents || parents.length === 0) {
    return <Alert severity="info">No parent or guardian is linked to this student yet.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Relationship</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Email</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {parents.map((p) => (
            <TableRow key={p.id}>
              <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
              <TableCell sx={{ textTransform: "capitalize" }}>{p.relationship}</TableCell>
              <TableCell>{p.phone}</TableCell>
              <TableCell>{p.email || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function EnrollmentsTab({ enrollments }) {
  if (!enrollments || enrollments.length === 0) {
    return (
      <Alert severity="info">
        No enrollment record found. This student may have been created before the enrollment system
        was in place.
      </Alert>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Year</TableCell>
            <TableCell>Class</TableCell>
            <TableCell>Grade</TableCell>
            <TableCell>Enrolled</TableCell>
            <TableCell>Left</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {enrollments.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{e.academicYearName}</TableCell>
              <TableCell>{e.className}</TableCell>
              <TableCell>{e.gradeLevel}</TableCell>
              <TableCell>{e.enrolledOn}</TableCell>
              <TableCell>{e.leftOn || "—"}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  variant="outlined"
                  label={e.status}
                  color={e.status === "active" ? "success" : "default"}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function AttendanceTab({ studentId }) {
  const { data } = useAsync(async () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return attendanceApi.getStudentSummary(
      studentId,
      start.toISOString().slice(0, 10),
      today.toISOString().slice(0, 10),
    );
  }, [studentId]);

  if (!data) return null;

  return (
    <Stack spacing={3}>
      <AttendanceGrid records={data.records || []} days={30} />
      <Stack direction="row" spacing={4}>
        <Stat label="Rate" value={`${(data.summary.attendance_rate * 100).toFixed(1)}%`} />
        <Stat label="Present" value={data.summary.present} />
        <Stat label="Absent" value={data.summary.absent} />
        <Stat label="Late" value={data.summary.late} />
      </Stack>
    </Stack>
  );
}

function Stat({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Box>
  );
}

function FeesTab({ studentId }) {
  const router = useRouter();
  const [payOpen, setPayOpen] = useState(false);
  const [payKey, setPayKey] = useState(0);
  const [paySnackbar, setPaySnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const {
    data: summary,
    loading,
    refetch,
  } = useAsync(() => feesApi.getStudentSummary(studentId), [studentId]);

  if (loading) return <LinearProgress />;
  if (!summary) return <Alert severity="info">No fee information available.</Alert>;

  const balance = Number(summary.balance);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={4} flexwrap="wrap" useFlexGap>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Current balance
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: balance > 0 ? "error.main" : "success.main",
            }}
          >
            {formatKES(balance)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Total invoiced
          </Typography>
          <Typography variant="h6">{formatKES(summary.totalInvoiced)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Total paid
          </Typography>
          <Typography variant="h6">{formatKES(summary.totalPaid)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Unpaid invoices
          </Typography>
          <Typography variant="h6">{summary.unpaidInvoiceCount}</Typography>
        </Box>
      </Stack>

      {summary.daysOverdue > 0 && (
        <Alert severity="warning">
          Oldest unpaid invoice is {summary.daysOverdue} days overdue.
        </Alert>
      )}

      {/* Action buttons */}
      <Stack direction="row" spacing={1.5} flexwrap="wrap" useFlexGap>
        <RoleGuard permission="fees.manage">
          <Button
            variant="contained"
            startIcon={<PaymentsIcon />}
            onClick={() => {
              setPayKey((k) => k + 1);
              setPayOpen(true);
            }}
          >
            Record payment
          </Button>
        </RoleGuard>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => window.open(`/students/${studentId}/statement`, "_blank")}
        >
          Print statement
        </Button>
      </Stack>

      {summary.currentInvoice && (
        <Card sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" flexwrap="wrap" useFlexGap>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current invoice
              </Typography>
              <Typography variant="h6">{summary.currentInvoice.termLabel}</Typography>
              <Typography variant="body2">
                {formatKES(summary.currentInvoice.total)} · due {summary.currentInvoice.dueOn}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary">
                Balance due
              </Typography>
              <Typography variant="h5" color="error.main">
                {formatKES(summary.currentInvoice.balanceDue)}
              </Typography>
              <Button
                size="small"
                sx={{ mt: 1 }}
                onClick={() => router.push(`/fees/invoices/${summary.currentInvoice.id}`)}
              >
                View invoice
              </Button>
            </Box>
          </Stack>
        </Card>
      )}

      {summary.lastPayment && (
        <Card sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Last payment
          </Typography>
          <Typography variant="body1">
            {formatKES(summary.lastPayment.amount)} · {summary.lastPayment.methodLabel} ·{" "}
            {summary.lastPayment.paidOn}
          </Typography>
          {summary.lastPayment.receiptNumber && (
            <Typography variant="caption" color="text.secondary">
              Receipt: {summary.lastPayment.receiptNumber}
            </Typography>
          )}
        </Card>
      )}

      <RecordPaymentDialog
        key={payKey}
        open={payOpen}
        onClose={() => setPayOpen(false)}
        studentId={studentId}
        studentName={summary.studentName}
        suggestedAmount={summary.currentInvoice?.balanceDue}
        onSaved={() => {
          setPayOpen(false);
          setPaySnackbar({
            open: true,
            message: "Payment recorded",
            severity: "success",
          });
          refetch();
        }}
        onError={(msg) => setPaySnackbar({ open: true, message: msg, severity: "error" })}
      />

      {paySnackbar.open && (
        <Alert
          severity={paySnackbar.severity}
          variant="filled"
          sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1500 }}
          onClose={() => setPaySnackbar((s) => ({ ...s, open: false }))}
        >
          {paySnackbar.message}
        </Alert>
      )}
    </Stack>
  );
}
