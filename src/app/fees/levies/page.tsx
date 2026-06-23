"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SearchIcon from "@mui/icons-material/Search";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { formatKES, formatDate } from "@/lib/utils";
import type { SpecialLevy, LevyScope, Student } from "@/lib/types";

export default function LeviesPage() {
  return (
    <DashboardLayout title="Special Levies & Ad-hoc Charges">
      <RoleGuard permission="fees.view">
        <LeviesContent />
      </RoleGuard>
    </DashboardLayout>
  );
}

function LeviesContent() {
  const { showNotification } = useNotification();
  const [filters, setFilters] = useState({ status: "active", term: 2 });
  const { data: levies = [], loading, error, refetch } = useAsync(() => api.getAllLevies(filters), [filters]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLevy, setSelectedLevy] = useState<SpecialLevy | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleCancelLevy = async (id: string) => {
    if (confirm("Are you sure you want to cancel this levy?")) {
      await api.cancelLevy(id);
      showNotification("Levy cancelled", "success");
      refetch();
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Manage targetted charges, trips, kits, and other mid-term expenses.
        </Typography>
        <RoleGuard permission="fees.edit">
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
            New Levy
          </Button>
        </RoleGuard>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Term"
              value={filters.term}
              onChange={(e) => setFilters({ ...filters, term: Number(e.target.value) })}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value={1}>Term 1</MenuItem>
              <MenuItem value={2}>Term 2</MenuItem>
              <MenuItem value={3}>Term 3</MenuItem>
            </TextField>
          </Stack>

          <DataState loading={loading} error={error} data={levies} isEmpty={(d) => d.length === 0} emptyMessage="No levies found matching filters">
            {(items) => (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{l.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{l.description.substring(0, 40)}...</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={l.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{l.scope}</Typography>
                        {l.className && <Typography variant="caption" color="text.secondary">{l.className}</Typography>}
                        {l.gradeLevel && <Typography variant="caption" color="text.secondary">{l.gradeLevel}</Typography>}
                      </TableCell>
                      <TableCell align="right">{formatKES(l.amount)}</TableCell>
                      <TableCell>{formatDate(l.dueDate)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={l.status.toUpperCase()} 
                          size="small" 
                          color={l.status === 'active' ? 'success' : l.status === 'closed' ? 'default' : 'error'} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Collection">
                            <IconButton size="small" onClick={() => { setSelectedLevy(l); setDetailOpen(true); }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {l.status === "active" && (
                            <>
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleCancelLevy(l.id)}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataState>
        </CardContent>
      </Card>

      <NewLevyDialog open={openDialog} onClose={() => setOpenDialog(false)} onSuccess={() => refetch()} />
      {selectedLevy && <LevyDetailDialog open={detailOpen} onClose={() => setDetailOpen(false)} levy={selectedLevy} />}
    </Box>
  );
}

function NewLevyDialog({ open, onClose, onSuccess }: { open: boolean, onClose: () => void, onSuccess: () => void }) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<SpecialLevy>>({
    title: "",
    description: "",
    category: "activity",
    amount: 0,
    scope: "class",
    academicYear: 2026,
    term: 2,
    dueDate: new Date().toISOString().slice(0, 10),
    status: "active",
  });

  const { data: classes = [] } = useAsync(() => api.getClasses(), []);

  const handleSubmit = async () => {
    if (!formData.title || !formData.amount) return;
    setLoading(true);
    try {
      await api.createLevy(formData as any);
      showNotification("Special levy created successfully", "success");
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Special Levy</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField 
            label="Levy Title" 
            fullWidth 
            required 
            value={formData.title} 
            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
          />
          <TextField 
            label="Description" 
            fullWidth 
            multiline 
            rows={2} 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField 
              select 
              label="Category" 
              value={formData.category} 
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            >
              <MenuItem value="trip">Trip</MenuItem>
              <MenuItem value="kit">Kit</MenuItem>
              <MenuItem value="uniform">Uniform</MenuItem>
              <MenuItem value="activity">Activity</MenuItem>
              <MenuItem value="stationery">Stationery</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField 
              label="Amount (KES)" 
              type="number" 
              required 
              value={formData.amount} 
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} 
            />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField 
              select 
              label="Scope" 
              value={formData.scope} 
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as LevyScope })}
            >
              <MenuItem value="all">All Students</MenuItem>
              <MenuItem value="class">Specific Class</MenuItem>
              <MenuItem value="grade">Specific Grade</MenuItem>
              <MenuItem value="individual">Individual Students</MenuItem>
            </TextField>
            {formData.scope === 'class' && (
              <TextField 
                select 
                label="Class" 
                value={formData.classId || ''} 
                onChange={(e) => {
                  const cls = classes.find(c => c.id === e.target.value);
                  setFormData({ ...formData, classId: e.target.value, className: cls?.name });
                }}
              >
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            )}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField 
              label="Due Date" 
              type="date" 
              slotProps={{ inputLabel: { shrink: true } }} 
              value={formData.dueDate} 
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} 
            />
            <TextField 
              select 
              label="Term" 
              value={formData.term} 
              onChange={(e) => setFormData({ ...formData, term: Number(e.target.value) as any })}
            >
              <MenuItem value={1}>Term 1</MenuItem>
              <MenuItem value={2}>Term 2</MenuItem>
              <MenuItem value={3}>Term 3</MenuItem>
            </TextField>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !formData.title || !formData.amount}>
          Create Levy
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function LevyDetailDialog({ open, onClose, levy }: { open: boolean, onClose: () => void, levy: SpecialLevy }) {
  const { data: summary, loading, refetch } = useAsync(() => api.getLevyCollectionSummary(levy.id), [levy.id]);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1 }}>{levy.title}</DialogTitle>
      <DialogContent>
        <DataState loading={loading} data={summary} error={null}>
          {(s) => (
            <>
              <Box sx={{ mb: 3, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Target</Typography>
                  <Typography variant="h6">{s.totalStudents} Students</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Collection Rate</Typography>
                  <Typography variant="h6">{Math.round((s.paid / s.totalStudents) * 100)}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Collected</Typography>
                  <Typography variant="h6" color="success.main">{formatKES(s.totalCollected)}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2">{s.paid} / {s.totalStudents} Students Paid</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatKES(s.totalCollected)} / {formatKES(s.totalStudents * levy.amount)}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={(s.paid / s.totalStudents) * 100} sx={{ height: 8, borderRadius: 4 }} />
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Student Payment Status</Typography>
              <StudentPaymentList levyId={levy.id} onRecordPayment={(student) => { setSelectedStudent(student); setPayDialogOpen(true); }} />
            </>
          )}
        </DataState>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {selectedStudent && (
        <RecordPaymentDialog 
          open={payDialogOpen} 
          onClose={() => setPayDialogOpen(false)} 
          levy={levy} 
          student={selectedStudent} 
          onSuccess={() => { refetch(); }} 
        />
      )}
    </Dialog>
  );
}

function StudentPaymentList({ levyId, onRecordPayment }: { levyId: string, onRecordPayment: (s: any) => void }) {
  const { data: summary, loading } = useAsync(() => api.getLevyCollectionSummary(levyId), [levyId]);
  const { data: students = [] } = useAsync(async () => {
    const l = await api.getAllLevies();
    const target = l.find(x => x.id === levyId);
    if (!target) return [];
    if (target.scope === "class") return api.getStudentsByClass(target.classId!);
    if (target.scope === "grade") return api.getStudents({ gradeLevel: target.gradeLevel });
    if (target.scope === "all") return api.getStudents();
    if (target.scope === "individual") return Promise.all((target.studentIds || []).map(id => api.getStudentById(id)));
    return [];
  }, [levyId]);

  if (loading) return <LinearProgress />;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Student</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Date Paid</TableCell>
          <TableCell align="right">Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {students.map((st: Student) => {
          const payment = summary?.payments.find(p => p.studentId === st.id);
          return (
            <TableRow key={st.id}>
              <TableCell>
                <Typography variant="body2">{st.firstName} {st.lastName}</Typography>
                <Typography variant="caption" color="text.secondary">{st.admissionNumber}</Typography>
              </TableCell>
              <TableCell>
                {payment ? (
                  <Chip label="PAID" size="small" color="success" />
                ) : (
                  <Chip label="UNPAID" size="small" color="error" variant="outlined" />
                )}
              </TableCell>
              <TableCell>
                {payment ? formatDate(payment.paidAt) : "-"}
              </TableCell>
              <TableCell align="right">
                {!payment && (
                  <Button size="small" startIcon={<ReceiptIcon />} onClick={() => onRecordPayment(st)}>
                    Record Payment
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function RecordPaymentDialog({ open, onClose, levy, student, onSuccess }: { open: boolean, onClose: () => void, levy: SpecialLevy, student: Student, onSuccess: () => void }) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: levy.amount,
    paymentMethod: "mpesa",
    mpesaCode: "",
  });

  const handleRecord = async () => {
    setLoading(true);
    try {
      await api.recordLevyPayment({
        levyId: levy.id,
        levyTitle: levy.title,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        amount: formData.amount,
        paidAt: new Date().toISOString(),
        paymentMethod: formData.paymentMethod as any,
        mpesaCode: formData.mpesaCode,
        recordedBy: "Accountant",
      });
      showNotification(`Payment recorded for ${student.firstName}`, "success");
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Record Levy Payment</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>Student:</strong> {student.firstName} {student.lastName}<br />
          <strong>Levy:</strong> {levy.title}
        </Typography>
        <Stack spacing={2}>
          <TextField label="Amount" type="number" fullWidth value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} />
          <TextField select label="Payment Method" fullWidth value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
            <MenuItem value="mpesa">M-Pesa</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
          </TextField>
          {formData.paymentMethod === 'mpesa' && (
            <TextField label="M-Pesa Code" fullWidth value={formData.mpesaCode} onChange={e => setFormData({ ...formData, mpesaCode: e.target.value })} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleRecord} disabled={loading}>Record Payment</Button>
      </DialogActions>
    </Dialog>
  );
}
