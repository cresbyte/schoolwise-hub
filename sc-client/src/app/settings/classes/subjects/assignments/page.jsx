"use client";

import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Chip,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from "@mui/material";

import { DataState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { RoleGuard } from "@/components/RoleGuard";
import { useNotification } from "@/context/NotificationContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

export default function AssignmentsPage() {
  return <AssignmentsContent />;
}

function AssignmentsContent() {
  const { showNotification } = useNotification();
  const {
    data: assignmentsRes,
    loading,
    error,
    refetch,
  } = useAsync(() => api.getClassSubjects(), []);
  const { data: classesRes = [] } = useAsync(api.getClasses);
  const { data: staffRes = [] } = useAsync(() => api.getStaff());
  const { data: subjectsRes = [] } = useAsync(() => api.getSubjects());
  const [expandedId, setExpandedId] = useState(null);

  const allAssignments = assignmentsRes || [];
  const classes = classesRes || [];
  const staff = staffRes || [];
  const allSubjects = subjectsRes || [];

  const handleTeacherChange = async (cls, subject, existingAssgn, newTeacherId) => {
    try {
      if (existingAssgn) {
        if (!newTeacherId) {
          await api.deleteClassSubject(existingAssgn.id);
          showNotification("Assignment removed", "success");
        } else {
          await api.updateClassSubject(existingAssgn.id, {
            classId: cls.id,
            subjectId: subject.id,
            teacherId: newTeacherId,
            periodsPerWeek: existingAssgn.periodsPerWeek,
          });
          showNotification("Teacher updated", "success");
        }
      } else {
        if (newTeacherId) {
          await api.createClassSubject({
            classId: cls.id,
            subjectId: subject.id,
            teacherId: newTeacherId,
            periodsPerWeek: 5,
          });
          showNotification("Teacher assigned", "success");
        }
      }
      refetch();
    } catch (err) {
      showNotification(err.message || "Failed to assign teacher", "error");
    }
  };

  const handlePeriodsChange = async (cls, subject, existingAssgn, newPeriods) => {
    if (newPeriods < 1) return;
    try {
      if (existingAssgn) {
        await api.updateClassSubject(existingAssgn.id, {
          classId: cls.id,
          subjectId: subject.id,
          teacherId: existingAssgn.teacherId,
          periodsPerWeek: newPeriods,
        });
        showNotification("Periods updated", "success");
        refetch();
      } else {
        showNotification("Please assign a teacher first.", "info");
      }
    } catch (err) {
      showNotification(err.message || "Failed to update periods", "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Subject Assignments"
        subtitle={`${allAssignments.length} total assignments`}
      />

      <DataState
        loading={loading}
        error={error}
        data={classes}
        onRetry={refetch}
        isEmpty={(d) => d.length === 0}
      >
        {() => (
          <Box sx={{ mb: 4 }}>
            {classes.map((cls) => {
              const isExpanded = expandedId === cls.id;
              // Cheap — just a count, safe to compute for every class up front.
              const subjectCount = allSubjects.filter(
                (s) => s.curriculum === cls.curriculum,
              ).length;

              return (
                <Accordion
                  key={cls.id}
                  expanded={isExpanded}
                  onChange={(_e, nowExpanded) => setExpandedId(nowExpanded ? cls.id : null)}
                  TransitionProps={{ unmountOnExit: true }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {cls.name}{" "}
                      <Chip
                        size="small"
                        label={`${subjectCount} Curriculum Subjects`}
                        sx={{ ml: 2 }}
                      />
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    {/* The expensive part — a select + number field per subject row,
                        with a full staff dropdown in each — only gets built once this
                        specific panel is actually opened, not for all classes up front. */}
                    {isExpanded && (
                      <ClassAssignmentsTable
                        cls={cls}
                        allAssignments={allAssignments}
                        allSubjects={allSubjects}
                        staff={staff}
                        handleTeacherChange={handleTeacherChange}
                        handlePeriodsChange={handlePeriodsChange}
                      />
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </DataState>
    </>
  );
}

function ClassAssignmentsTable({
  cls,
  allAssignments,
  allSubjects,
  staff,
  handleTeacherChange,
  handlePeriodsChange,
}) {
  const clsAssignments = allAssignments.filter((a) => a.classId === cls.id);
  const classSubjects = allSubjects.filter((s) => s.curriculum === cls.curriculum);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "background.default" }}>
            <TableCell>Subject Code</TableCell>
            <TableCell>Subject Name</TableCell>
            <TableCell>Assigned Teacher</TableCell>
            <TableCell align="right">Periods/Week</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {classSubjects.map((subject) => {
            const existingAssgn = clsAssignments.find((a) => a.subjectId === subject.id);
            return (
              <TableRow key={subject.id} hover>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", color: "text.secondary" }}
                  >
                    {subject.code || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{subject.name}</Typography>
                </TableCell>
                <TableCell>
                  <RoleGuard
                    permission="classes.view"
                    fallback={
                      <Typography variant="body2">
                        {existingAssgn?.teacherName || "Unassigned"}
                      </Typography>
                    }
                  >
                    <TextField
                      select
                      size="small"
                      value={existingAssgn?.teacherId || ""}
                      onChange={(e) =>
                        handleTeacherChange(cls, subject, existingAssgn, e.target.value)
                      }
                      fullWidth
                      sx={{
                        minWidth: 200,
                        maxWidth: 300,
                        ".MuiSelect-select": { py: 0.5 },
                      }}
                    >
                      <MenuItem value="">— Unassigned —</MenuItem>
                      {staff.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name || `${s.firstName} ${s.lastName}`}
                        </MenuItem>
                      ))}
                    </TextField>
                  </RoleGuard>
                </TableCell>
                <TableCell align="right">
                  <RoleGuard
                    permission="classes.view"
                    fallback={
                      <Typography variant="body2">{existingAssgn?.periodsPerWeek || 5}</Typography>
                    }
                  >
                    <TextField
                      type="number"
                      size="small"
                      value={existingAssgn?.periodsPerWeek || 5}
                      onChange={(e) =>
                        handlePeriodsChange(cls, subject, existingAssgn, parseInt(e.target.value))
                      }
                      sx={{
                        width: 70,
                        ".MuiInputBase-input": { py: 0.5, textAlign: "right" },
                      }}
                    />
                  </RoleGuard>
                </TableCell>
              </TableRow>
            );
          })}
          {classSubjects.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No subjects configured for the {cls.curriculum} curriculum globally.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
