"use client";

import { useMemo } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, Grid,
  List, ListItem, ListItemText, Stack, Typography
} from "@mui/material";
import {
  EventAvailable, Assignment, People, Schedule, EditNote
} from "@mui/icons-material";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export function OverviewTab({ user, staffProfile, onSwitchTab }) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayDate = new Date().toISOString().split("T")[0];

  // Fetch teacher's timetable
  const { data: timetable = [], loading: ttLoading } = useAsync(
    async () => {
      try {
        const res = await api.getTeacherTimetable(user.staffId || user.id);
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    [user?.staffId, user?.id]
  );

  // Fetch pending grading tasks
  const { data: gradingTasks = [], loading: gradingLoading } = useAsync(
    async () => {
      try {
        const res = await api.exams.getMyGrading();
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    []
  );

  // Today's lessons
  const todaysLessons = useMemo(() => {
    return (timetable || [])
      .filter((s) => s.day === today && !s.isBreak)
      .sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));
  }, [timetable, today]);

  // Pending grading (not fully graded)
  const pendingGrading = useMemo(() => {
    return (gradingTasks || []).filter((t) => t.gradedCount < t.totalCount);
  }, [gradingTasks]);

  return (
    <Box>
      {/* Today's Schedule */}
      <Card variant="outlined" sx={{ mb: 3, bgcolor: "primary.main", color: "white" }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            {today}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
            You have {todaysLessons.length} lesson{todaysLessons.length !== 1 ? "s" : ""} today
          </Typography>
          {todaysLessons.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              No lessons scheduled for today.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {todaysLessons.slice(0, 4).map((lesson, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.5,
                    bgcolor: "rgba(255,255,255,0.1)",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {lesson.subjectName || lesson.subject_name}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {lesson.className || lesson.class_name} · {lesson.startTime} - {lesson.endTime}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={`Period ${lesson.periodNumber || idx + 1}`}
                    sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Pending Tasks */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            Pending Tasks
          </Typography>
          <Stack spacing={2}>
            {pendingGrading.length === 0 && todaysLessons.length === 0 && (
              <Alert severity="success">
                You're all caught up! No pending tasks right now.
              </Alert>
            )}

            {pendingGrading.slice(0, 3).map((task) => {
              const pct = task.totalCount > 0 ? Math.round((task.gradedCount / task.totalCount) * 100) : 0;
              return (
                <Card key={task.examSubjectId} variant="outlined">
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {task.examName} — {task.subjectName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {task.className}
                        </Typography>
                      </Box>
                      <Chip size="small" label={`${pct}%`} color={pct === 100 ? "success" : "warning"} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {task.gradedCount} of {task.totalCount} students graded
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            Quick Actions
          </Typography>
          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<EventAvailable />}
              onClick={() => onSwitchTab(2)}
              sx={{ py: 1.5, justifyContent: "flex-start" }}
            >
              Mark Attendance
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<EditNote />}
              onClick={() => onSwitchTab(3)}
              sx={{ py: 1.5, justifyContent: "flex-start" }}
            >
              Enter Exam Marks
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<People />}
              onClick={() => onSwitchTab(1)}
              sx={{ py: 1.5, justifyContent: "flex-start" }}
            >
              View My Classes
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => onSwitchTab(0)}
              sx={{ py: 1.5, justifyContent: "flex-start" }}
            >
              Full Timetable
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
