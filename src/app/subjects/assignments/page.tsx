"use client";

/**
 * Teacher-Subject-Class Assignment Manager.
 * @module subjects/assignments/page
 */
import { useState } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { getInitials } from "@/lib/utils";
import type { ClassSubject, Staff, ClassRoom, Subject } from "@/lib/types";

export default function AssignmentsPage() {
  return (
    <DashboardLayout>
      <AssignmentsContent />
    </DashboardLayout>
  );
}

function AssignmentsContent() {
  const { showNotification } = useNotification();
  const [filters, setFilters] = useState({ classId: "all", teacherId: "all", subjectId: "all" });
  
  const { data: assignmentsRes, loading, error, refetch } = useAsync(() => 
    api.getClassSubjects(filters.classId === "all" ? undefined : { 
      classId: filters.classId === "all" ? undefined : filters.classId,
    })
  , [filters]);

  const { data: classesRes = [] } = useAsync(api.getClasses);
  const { data: staffRes = [] } = useAsync(() => api.getStaff());
  const { data: subjectsRes = [] } = useAsync(() => api.getSubjects());

  const assignments = assignmentsRes || [];
  const classes = classesRes || [];
  const staff = staffRes || [];
  const allSubjects = subjectsRes || [];

  const [editDialog, setEditDialog] = useState<{ open: boolean, assignment?: ClassSubject }>({ open: false });
  const [newDialog, setNewDialog] = useState(false);

  const filteredAssignments = assignments.filter(a => {
    if (filters.classId !== "all" && a.classId !== filters.classId) return false;
    if (filters.teacherId !== "all" && a.teacherId !== filters.teacherId) return false;
    if (filters.subjectId !== "all" && a.subjectId !== filters.subjectId) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Subject Assignments"
        subtitle={<Chip size="small" label={`${filteredAssignments.length} assignments`} />}
        actions={
          <RoleGuard permission="classes.view">
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setNewDialog(true)}>Assign Teacher</Button>
          </RoleGuard>
        }
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField select size="small" label="Class" value={filters.classId} onChange={(e) => setFilters({ ...filters, classId: e.target.value })} sx={{ minWidth: 150 }}>
            <MenuItem value="all">All Classes</MenuItem>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Subject" value={filters.subjectId} onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })} sx={{ minWidth: 150 }}>
            <MenuItem value="all">All Subjects</MenuItem>
            {allSubjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Teacher" value={filters.teacherId} onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })} sx={{ minWidth: 150 }}>
            <MenuItem value="all">All Teachers</MenuItem>
            {staff.map(s => <MenuItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</MenuItem>)}
          </TextField>
        </Box>
      </Card>

      <Card>
        <DataState loading={loading} error={error} data={assignments} onRetry={refetch} isEmpty={(d) => d.length === 0}>
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Class</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Assigned Teacher</TableCell>
                    <TableCell>Periods/Week</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssignments.map((a) => {
                    const cls = classes.find(c => c.id === a.classId);
                    return (
                      <TableRow key={a.id} hover>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{cls?.name || "—"}</Typography></TableCell>
                        <TableCell>{a.subjectName}</TableCell>
                        <TableCell>
                          {a.teacherId ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "primary.main" }}>{getInitials(a.teacherName || "")}</Avatar>
                              <Typography variant="body2">{a.teacherName}</Typography>
                            </Box>
                          ) : (
                            <Chip size="small" label="Unassigned" color="warning" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>{a.periodsPerWeek} periods</TableCell>
                        <TableCell align="right">
                          <RoleGuard permission="classes.view">
                            <IconButton size="small" onClick={() => setEditDialog({ open: true, assignment: a })}><EditIcon fontSize="small" /></IconButton>
                          </RoleGuard>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      </Card>

      {editDialog.open && editDialog.assignment && (
        <EditAssignmentDialog 
          open={editDialog.open} 
          assignment={editDialog.assignment} 
          staff={staff}
          onClose={() => setEditDialog({ open: false })}
          onSave={async (data) => {
            await api.updateClassSubject(editDialog.assignment!.id, data);
            showNotification("Assignment updated", "success");
            setEditDialog({ open: false });
            refetch();
          }}
        />
      )}

      {newDialog && (
        <NewAssignmentDialog 
          open={newDialog}
          classes={classes}
          subjects={allSubjects}
          staff={staff}
          onClose={() => setNewDialog(false)}
          onSave={async (data) => {
            await api.createClassSubject(data);
            showNotification("Assignment created", "success");
            setNewDialog(false);
            refetch();
          }}
        />
      )}
    </>
  );
}

function EditAssignmentDialog({ open, assignment, staff, onClose, onSave }: { open: boolean, assignment: ClassSubject, staff: Staff[], onClose: () => void, onSave: (data: Partial<ClassSubject>) => Promise<void> }) {
  const [teacherId, setTeacherId] = useState(assignment.teacherId || "");
  const [periods, setPeriods] = useState(assignment.periodsPerWeek);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit Assignment</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Class" value={assignment.classId} disabled fullWidth size="small" />
          <TextField label="Subject" value={assignment.subjectName} disabled fullWidth size="small" />
          <TextField select label="Assign Teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} fullWidth size="small">
            <MenuItem value="">— Unassigned</MenuItem>
            {staff.map(s => <MenuItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</MenuItem>)}
          </TextField>
          <TextField label="Periods/Week" type="number" value={periods} onChange={(e) => setPeriods(Number(e.target.value))} slotProps={{ htmlInput: { min: 1, max: 10 } }} fullWidth size="small" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ teacherId, periodsPerWeek: periods })}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

function NewAssignmentDialog({ open, classes, subjects, staff, onClose, onSave }: { open: boolean, classes: ClassRoom[], subjects: Subject[], staff: Staff[], onClose: () => void, onSave: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({ classId: "", subjectId: "", teacherId: "", periodsPerWeek: 5 });
  const selectedClass = classes.find(c => c.id === form.classId);
  const filteredSubjects = subjects.filter(s => s.curriculum === selectedClass?.curriculum);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>New Assignment</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField select label="Class" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} fullWidth size="small">
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select label="Subject" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} fullWidth size="small" disabled={!form.classId}>
            {filteredSubjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
          <TextField select label="Teacher" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} fullWidth size="small">
            {staff.map(s => <MenuItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</MenuItem>)}
          </TextField>
          <TextField label="Periods/Week" type="number" value={form.periodsPerWeek} onChange={(e) => setForm({ ...form, periodsPerWeek: Number(e.target.value) })} slotProps={{ htmlInput: { min: 1, max: 10 } }} fullWidth size="small" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ ...form, subjectName: subjects.find(s => s.id === form.subjectId)?.name })} disabled={!form.subjectId || !form.teacherId}>Create</Button>
      </DialogActions>
    </Dialog>
  );
}
