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
import TableContainer from "@mui/material/TableContainer";
import IconButton from "@mui/material/IconButton";
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
import { useNotification } from "@/context/NotificationContext";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
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
                <Box sx={{ position: "relative" }}>
                  <Avatar src={s.photo} sx={{ width: 100, height: 100, fontSize: 32, bgcolor: "primary.main" }}>
                    {getInitials(`${s.firstName} ${s.lastName}`)}
                  </Avatar>
                  <IconButton
                    size="small"
                    component="label"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      bgcolor: "background.paper",
                      boxShadow: 2,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <EditIcon fontSize="small" />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={async () => {
                        const randomId = Math.floor(Math.random() * 70) + 1;
                        const photoUrl = `https://i.pravatar.cc/150?u=std-${randomId}`;
                        await api.updateStudentAvatar(s.id, photoUrl);
                        refetch();
                      }}
                    />
                  </IconButton>
                </Box>
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
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => router.push(`/students/${s.id}/edit`)}>Edit</Button>
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
  const [term, setTerm] = useState(2);
  const [year, setYear] = useState(2026);
  // Simulation: using the date ranges for the current term
  const att = useAsync(() => api.getStudentAttendance(studentId, "2026-05-01", "2026-08-31"), [studentId, term, year]);
  
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <TextField select size="small" label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 120 }}>
          <MenuItem value={2026}>2026</MenuItem>
          <MenuItem value={2025}>2025</MenuItem>
        </TextField>
        <TextField select size="small" label="Term" value={term} onChange={(e) => setTerm(Number(e.target.value))} sx={{ width: 120 }}>
          <MenuItem value={1}>Term 1</MenuItem>
          <MenuItem value={2}>Term 2</MenuItem>
          <MenuItem value={3}>Term 3</MenuItem>
        </TextField>
      </Box>

      <DataState loading={att.loading} error={att.error} data={att.data} onRetry={att.refetch} isEmpty={(d) => d.length === 0} emptyMessage="No attendance records for this period">
        {(records) => {
          const stats = {
            present: records.filter((r: any) => r.status === "present").length,
            absent: records.filter((r: any) => r.status === "absent").length,
            late: records.filter((r: any) => r.status === "late").length,
            excused: records.filter((r: any) => r.status === "excused").length,
            total: records.length,
          };
          const pct = stats.total ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;
          
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
                      <TableCell align="center" sx={{ bgcolor: "primary.main", color: "white" }}>Overall %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: 18, color: "success.main" }}>{stats.present}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: 18, color: "error.main" }}>{stats.absent}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: 18, color: "warning.main" }}>{stats.late}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: 18, color: "info.main" }}>{stats.excused}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: 18, bgcolor: "primary.main", color: "white" }}>{pct}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Daily Logs</Typography>
              <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Day</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Recorded By</TableCell>
                      <TableCell>Reason / Remark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{formatDate(r.date)}</TableCell>
                        <TableCell>{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' })}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={r.status.toUpperCase()} 
                            sx={{ 
                              fontWeight: 700, fontSize: 10,
                              color: r.status === "present" ? "success.main" : r.status === "absent" ? "error.main" : "warning.main",
                              bgcolor: r.status === "present" ? "success.main" + "19" : r.status === "absent" ? "error.main" + "19" : "warning.main" + "19"
                            }} 
                          />
                        </TableCell>
                        <TableCell>{r.recordedBy}</TableCell>
                        <TableCell>{r.reason ?? "—"}</TableCell>
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

function FeeTab({ studentId }: { studentId: string }) {
  const inv = useAsync(() => api.getStudentInvoice(studentId), [studentId]);
  const pays = useAsync(() => api.getPayments({ studentId }), [studentId]);
  const levies = useAsync(() => api.getStudentLevies(studentId), [studentId]);
  
  const [payLevyOpen, setPayLevyOpen] = useState(false);
  const [selectedLevy, setSelectedLevy] = useState<any>(null);

  const { showNotification } = useNotification();
  
  return (
    <DataState loading={inv.loading} error={inv.error} data={inv.data} onRetry={inv.refetch}>
      {(i: any) => (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" }, gap: 2, mb: 3 }}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Invoiced (All Time)</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatKES(i.totalCharged + 45000)}</Typography>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Paid (All Time)</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatKES(i.totalPaid + 40000)}</Typography>
            </Card>
            <Card variant="outlined" sx={{ p: 2, bgcolor: i.balance > 0 ? "#C6282808" : "transparent" }}>
              <Typography variant="caption" color="text.secondary">Current Balance</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: i.balance > 0 ? "error.main" : "success.main" }}>{formatKES(i.balance)}</Typography>
            </Card>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Current Term Invoice: {i.invoiceNumber}</Typography>
          <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 4 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell>Fee Item</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {i.items.map((it: any) => (
                  <TableRow key={it.name}>
                    <TableCell>{it.name}</TableCell>
                    <TableCell align="right">{formatKES(it.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Total Term Charge</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatKES(i.totalCharged)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle2" sx={{ mt: 4, mb: 1, fontWeight: 700 }}>Special Levies & Ad-hoc Charges</Typography>
          <DataState loading={levies.loading} error={levies.error} data={levies.data} isEmpty={(d) => d.length === 0} emptyMessage="No special levies for this student">
            {(studentLevies) => (
              <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 4 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentLevies.map((sl: any) => (
                      <TableRow key={sl.levy.id}>
                        <TableCell>{sl.levy.title}</TableCell>
                        <TableCell><Chip label={sl.levy.category} size="small" /></TableCell>
                        <TableCell align="right">{formatKES(sl.levy.amount)}</TableCell>
                        <TableCell>{formatDate(sl.levy.dueDate)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={sl.paid ? "PAID" : "UNPAID"} 
                            size="small" 
                            color={sl.paid ? "success" : "warning"} 
                          />
                        </TableCell>
                        <TableCell align="right">
                          {!sl.paid && (
                            <Button 
                              size="small" 
                              onClick={() => { setSelectedLevy(sl.levy); setPayLevyOpen(true); }}
                            >
                              Pay
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataState>

          {selectedLevy && (
            <Dialog open={payLevyOpen} onClose={() => setPayLevyOpen(false)} fullWidth maxWidth="xs">
              <DialogTitle>Record Levy Payment</DialogTitle>
              <DialogContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Recording payment of <strong>{formatKES(selectedLevy.amount)}</strong> for <strong>{selectedLevy.title}</strong>.
                </Typography>
                <TextField select fullWidth label="Method" size="small" defaultValue="cash" sx={{ mt: 1 }}>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="mpesa">M-Pesa</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                </TextField>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setPayLevyOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={async () => {
                  if (!selectedLevy) return;
                  await api.recordLevyPayment({
                    levyId: selectedLevy.id,
                    levyTitle: selectedLevy.title,
                    studentId: studentId,
                    studentName: "Student", 
                    amount: selectedLevy.amount,
                    paidAt: new Date().toISOString(),
                    paymentMethod: "cash",
                    recordedBy: "Admin",
                  });
                  showNotification("Payment recorded", "success");
                  setPayLevyOpen(false);
                  levies.refetch();
                }}>
                  Confirm Payment
                </Button>
              </DialogActions>
            </Dialog>
          )}

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Full Statement of Account (All Periods)</Typography>
          <DataState loading={pays.loading} error={pays.error} data={pays.data} isEmpty={(d) => d.length === 0} emptyMessage="No transactions found">
            {(payments) => (
              <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Reference / Receipt</TableCell>
                      <TableCell align="right">Charge</TableCell>
                      <TableCell align="right">Payment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Simulated historical row */}
                    <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                      <TableCell>05/01/2026</TableCell>
                      <TableCell><em>Opening Balance (from 2025)</em></TableCell>
                      <TableCell>B/F</TableCell>
                      <TableCell align="right">{formatKES(5000)}</TableCell>
                      <TableCell align="right">—</TableCell>
                    </TableRow>
                    {/* Current term charges as one entry for brevity in summary */}
                    <TableRow>
                      <TableCell>{formatDate(i.issuedDate)}</TableCell>
                      <TableCell>Term 2 2026 Invoice</TableCell>
                      <TableCell>{i.invoiceNumber}</TableCell>
                      <TableCell align="right">{formatKES(i.totalCharged)}</TableCell>
                      <TableCell align="right">—</TableCell>
                    </TableRow>
                    {/* All payments */}
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                        <TableCell>Fee Payment — {p.paymentMethod}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{p.receiptNumber}</TableCell>
                        <TableCell align="right">—</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "success.main" }}>{formatKES(p.amount)}</TableCell>
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
