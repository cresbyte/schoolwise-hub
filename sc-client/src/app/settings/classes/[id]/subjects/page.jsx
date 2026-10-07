"use client";

/**
 * Subjects & teachers for one stream (for example PP1 West).
 * Shows the subjects offered in the stream's grade, with one teacher dropdown per subject.
 * @module classes/[id]/subjects/page
 */
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { getTeachers } from "@/lib/grades";

export default function StreamSubjectsPage() {
  return (
    <DashboardLayout>
      <StreamSubjectsContent />
    </DashboardLayout>
  );
}

function StreamSubjectsContent() {
  const { id } = useParams();
  const { showNotification } = useNotification();
  const room = useAsync(() => api.getClass(id), [id]);
  const subjects = useAsync(() => api.getSubjects(), []);
  const staff = useAsync(() => api.getStaff(), []);
  const assignments = useAsync(() => api.getClassSubjects({ class_room: id }), [id]);
  const [savingId, setSavingId] = useState(null);

  const teachers = getTeachers(staff.data);
  const assignmentList = Array.isArray(assignments.data)
    ? assignments.data
    : assignments.data?.results || [];
  const grade = room.data?.gradeLevel;

  const offered = (Array.isArray(subjects.data) ? subjects.data : []).filter((s) =>
    (s.gradeLevels || []).includes(grade),
  );

  const assignmentBySubject = {};
  assignmentList.forEach((a) => {
    assignmentBySubject[a.subjectId] = a;
  });

  const offeredIds = offered.map((s) => s.id);
  const others = assignmentList.filter((a) => !offeredIds.includes(a.subjectId));

  // Use direct CRUD methods instead of the buggy helper
  async function changeTeacher(subject, teacherId) {
    setSavingId(subject.id);
    try {
      const current = assignmentBySubject[subject.id];

      if (teacherId === "") {
        // Remove assignment
        if (current) {
          await api.deleteClassSubject(current.id);
        }
      } else {
        // Update or Create assignment
        const payload = {
          classId: id,
          subjectId: subject.id,
          teacherId: Number(teacherId), // Ensure it's sent as a number
          periodsPerWeek: current ? current.periodsPerWeek : 5,
        };

        if (current) {
          await api.updateClassSubject(current.id, payload);
        } else {
          await api.createClassSubject(payload);
        }
      }

      await assignments.refetch();
      showNotification("Saved successfully", "success");
    } catch (e) {
      console.error(e);
      showNotification(e.message || "Failed to save assignment", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function removeAssignment(assignment) {
    setSavingId(assignment.subjectId);
    try {
      await api.deleteClassSubject(assignment.id);
      await assignments.refetch();
      showNotification("Removed", "success");
    } catch (e) {
      showNotification(e.message || "Failed to remove", "error");
    } finally {
      setSavingId(null);
    }
  }

  const initialLoading =
    room.loading || subjects.loading || staff.loading || (assignments.loading && !assignments.data);

  return (
    <>
      <PageHeader
        title={room.data ? `${room.data.name}: subjects & teachers` : "Subjects & teachers"}
        subtitle="Pick the teacher for each subject in this stream"
      />
      <Box sx={{ mb: 2 }}>
        <Button component={Link} href="/settings/classes">
          Back to classes
        </Button>
      </Box>

      <DataState
        loading={initialLoading}
        error={room.error || subjects.error || staff.error || assignments.error}
        data={room.data}
        onRetry={() => {
          room.refetch();
          subjects.refetch();
          staff.refetch();
          assignments.refetch();
        }}
      >
        {() => (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Card>
              <CardContent sx={{ overflowX: "auto" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Subjects offered in {grade}
                </Typography>
                {offered.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No subject is offered in {grade} yet. Open Subjects, edit a subject, and tick{" "}
                    {grade}.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell sx={{ width: 280 }}>Teacher</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {offered.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell>{subject.name}</TableCell>
                          <TableCell>
                            <TextField
                              select
                              size="small"
                              fullWidth
                              value={assignmentBySubject[subject.id]?.teacherId ?? ""}
                              disabled={savingId === subject.id}
                              onChange={(e) => changeTeacher(subject, e.target.value)}
                            >
                              <MenuItem value="">Not assigned</MenuItem>
                              {teachers.map((t) => (
                                <MenuItem key={t.id} value={t.id}>
                                  {t.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {others.length > 0 && (
              <Card>
                <CardContent sx={{ overflowX: "auto" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Other assigned subjects
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    These subjects are not ticked for {grade} on the Subjects page. Tick the grade
                    there to manage them above, or remove them here.
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      {others.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.subjectName}</TableCell>
                          <TableCell>{a.teacherName}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              color="error"
                              disabled={savingId === a.subjectId}
                              onClick={() => removeAssignment(a)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </DataState>
    </>
  );
}
