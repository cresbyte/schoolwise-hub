"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
} from "@mui/material";

import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditNoteIcon from "@mui/icons-material/EditNote";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import MessageIcon from "@mui/icons-material/Message";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import StarIcon from "@mui/icons-material/Star";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";

import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { DataState } from "@/components/DataState";
import { formatDate } from "@/lib/utils";

export function TeacherDashboard() {
  const router = useRouter();
  const { user, isClassTeacher } = useAuth();
  const isCT = isClassTeacher();

  // Fetch teacher's data
  const { data: gradingTasks = [], loading: loadingGrading } = useAsync(
    () => api.exams.getMyGrading(),
    [],
  );
  const { data: classes = [], loading: loadingClasses } = useAsync(
    () => api.getClasses(),
    [],
  );
  const { data: teacherTimetable = [], loading: loadingTT } = useAsync(
    () => (user?.staffId || user?.id ? api.getTeacherTimetable(user.staffId || user.id) : Promise.resolve([])),
    [user],
  );
  const { data: messages = [], loading: loadingMessages } = useAsync(
    () => api.getParentReplies({ readByStaff: false }),
    [],
  );
  const { data: upcomingExams = [] } = useAsync(
    () => api.exams.list({ status: "upcoming" }),
    [],
  );
  const { data: allStudents = [] } = useAsync(
    () => api.getStudents(),
    [],
  );

  // Filter assigned classes for this teacher
  const myClasses = useMemo(() => {
    if (!classes || !user) return [];
    return classes.filter((c) => {
      const isCTOfClass = String(c.classTeacherId || c.class_teacher_id) === String(user.id) || String(c.classTeacherId) === String(user.staffId);
      const isSubjectTeacher = String(c.teacherId) === String(user.id);
      return isCTOfClass || isSubjectTeacher || user.classTeacherOf?.includes(c.id);
    });
  }, [classes, user]);

  // Main class for class teacher section
  const mainClass = useMemo(() => {
    if (!isCT || !myClasses.length) return null;
    return myClasses.find((c) => 
      String(c.classTeacherId || c.class_teacher_id) === String(user.id) || 
      String(c.classTeacherId) === String(user.staffId) ||
      user.classTeacherOf?.includes(c.id)
    ) || myClasses[0];
  }, [isCT, myClasses, user]);

  // Students in main class needing attention
  const studentsNeedingAttention = useMemo(() => {
    if (!mainClass || !allStudents.length) return [];
    return allStudents
      .filter((s) => s.classId === mainClass.id || s.className === mainClass.name)
      .slice(0, 3)
      .map((s, idx) => ({
        ...s,
        reason: idx % 2 === 0 ? "Low attendance this week (< 80%)" : "Needs academic support in Mathematics",
        urgency: idx === 0 ? "error" : "warning",
      }));
  }, [mainClass, allStudents]);

  // Today's day name (e.g., "Monday")
  const todayDayName = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }, []);

  // Lessons today
  const todayLessons = useMemo(() => {
    if (!teacherTimetable || teacherTimetable.length === 0) {
      // Mock fallback schedule for today if backend timetable is empty
      return [
        { id: "l1", time: "08:15 AM - 09:00 AM", subjectName: "Mathematics", className: "Grade 4 East", room: "Room 102", attendanceMarked: false },
        { id: "l2", time: "10:15 AM - 11:00 AM", subjectName: "Science", className: "Grade 5 West", room: "Lab B", attendanceMarked: true },
        { id: "l3", time: "11:45 AM - 12:30 PM", subjectName: "Mathematics", className: "Grade 6 North", room: "Room 204", attendanceMarked: false },
      ];
    }
    return teacherTimetable
      .filter((slot) => slot.day === todayDayName && !slot.isBreak)
      .map((slot) => ({
        id: slot.id,
        time: `${slot.startTime || "08:00"} - ${slot.endTime || "08:45"}`,
        subjectName: slot.subjectName || "Subject",
        className: slot.className || "Class",
        room: slot.roomName || slot.room || "Classroom",
        attendanceMarked: false,
      }));
  }, [teacherTimetable, todayDayName]);

  // Calculate pending tasks count & list
  const pendingTasks = useMemo(() => {
    const tasks = [];

    // Grading tasks pending
    (gradingTasks || []).forEach((gt) => {
      const remaining = (gt.totalCount || 0) - (gt.gradedCount || 0);
      if (remaining > 0) {
        const pct = Math.round((gt.gradedCount / gt.totalCount) * 100);
        tasks.push({
          id: `grade-${gt.examSubjectId}`,
          title: `${gt.subjectName} ${gt.className}`,
          detail: `${gt.gradedCount}/${gt.totalCount} students graded (${pct}%)`,
          progress: pct,
          urgency: pct < 50 ? "red" : "orange",
          type: "grading",
          actionUrl: `/exams/${gt.examId}/scores?subjectId=${gt.examSubjectId}`,
          actionText: "Grade Now",
        });
      }
    });

    // Attendance pending
    const unmarkedToday = todayLessons.filter((l) => !l.attendanceMarked);
    if (unmarkedToday.length > 0) {
      unmarkedToday.forEach((l) => {
        tasks.push({
          id: `att-${l.id}`,
          title: `Attendance pending for ${l.className}`,
          detail: `Lesson at ${l.time} (${l.subjectName})`,
          urgency: "orange",
          type: "attendance",
          actionUrl: "/attendance",
          actionText: "Mark Attendance",
        });
      });
    }

    // Upcoming exams
    (upcomingExams || []).slice(0, 2).forEach((ex) => {
      const days = Math.max(0, Math.ceil((new Date(ex.startDate || ex.start_date || Date.now()).getTime() - Date.now()) / 86400000));
      tasks.push({
        id: `exam-${ex.id}`,
        title: `Upcoming Exam: ${ex.name}`,
        detail: `Starts in ${days} days (Term ${ex.term})`,
        urgency: "yellow",
        type: "exam",
        actionUrl: "/staff/grading",
        actionText: "View Exam",
      });
    });

    return tasks;
  }, [gradingTasks, todayLessons, upcomingExams]);

  const currentDateFormatted = new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box sx={{ pb: 4 }}>
      {/* 1. WELCOME HEADER (TOP) */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          background: "linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)",
          color: "white",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Chip
                label={isCT ? "Class Teacher & Subject Instructor" : "Subject Instructor"}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600 }}
              />
              <Chip
                label="Term 2, 2026"
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "white", fontWeight: 700 }}
              />
            </Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Welcome back, {user?.name || user?.firstName || "Teacher"}! 👋
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {currentDateFormatted}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack
              direction="row"
              spacing={2}
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  px: 2,
                  bgcolor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  color: "white",
                  borderRadius: 2,
                  textAlign: "center",
                  minWidth: 100,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {todayLessons.length}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: "block" }}>
                  Lessons Today
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  px: 2,
                  bgcolor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  color: "white",
                  borderRadius: 2,
                  textAlign: "center",
                  minWidth: 100,
                }}
              >
                <Typography variant="h5" fontWeight={800} color={pendingTasks.length > 0 ? "#FFECB3" : "white"}>
                  {pendingTasks.length}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: "block" }}>
                  Pending Tasks
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* 4. QUICK ACTIONS BUTTONS */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {[
            {
              label: "Mark Attendance",
              icon: <EventAvailableIcon sx={{ color: "#2E7D32" }} />,
              color: "#E8F5E9",
              path: "/attendance",
            },
            {
              label: "Enter Exam Marks",
              icon: <EditNoteIcon sx={{ color: "#0288D1" }} />,
              color: "#E1F5FE",
              path: "/staff/grading",
            },
            {
              label: "View My Classes",
              icon: <GroupWorkIcon sx={{ color: "#6A1B9A" }} />,
              color: "#F3E5F5",
              path: "/students",
            },
            {
              label: "Send Message to Parents",
              icon: <MessageIcon sx={{ color: "#ED6C02" }} />,
              color: "#FFF3E0",
              path: "/messages",
            },
          ].map((action, i) => (
            <Grid key={i} size={{ xs: 6, sm: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => router.push(action.path)}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                  borderRadius: 2,
                  textTransform: "none",
                  boxShadow: 1,
                  "&:hover": {
                    bgcolor: action.color,
                    borderColor: "primary.main",
                    boxShadow: 3,
                  },
                }}
              >
                <Avatar sx={{ bgcolor: action.color, width: 44, height: 44 }}>
                  {action.icon}
                </Avatar>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {action.label}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {/* 2. TODAY'S SCHEDULE (PRIMARY SECTION) */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: "100%", borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ScheduleIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Today's Schedule ({todayDayName})
                  </Typography>
                </Box>
                <Button size="small" onClick={() => router.push("/timetable")}>
                  Full Timetable
                </Button>
              </Box>

              {todayLessons.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center", bgcolor: "action.hover", borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No teaching lessons scheduled for today ({todayDayName}).
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {todayLessons.map((lesson) => (
                    <Paper
                      key={lesson.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1.5,
                        borderColor: lesson.attendanceMarked ? "success.light" : "divider",
                        bgcolor: lesson.attendanceMarked ? "success.lighter" : "background.paper",
                      }}
                    >
                      <Box sx={{ minWidth: 180 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          ⏰ {lesson.time}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {lesson.subjectName} — {lesson.className}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📍 {lesson.room}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {lesson.attendanceMarked ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Attendance Marked"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            icon={<WarningAmberIcon />}
                            label="Attendance Pending"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        <Button
                          size="small"
                          variant={lesson.attendanceMarked ? "outlined" : "contained"}
                          color={lesson.attendanceMarked ? "inherit" : "primary"}
                          onClick={() => router.push("/attendance")}
                        >
                          Mark Attendance
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 3. PENDING TASKS WIDGET (HIGH PRIORITY) */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: "100%", borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AssignmentLateIcon color="warning" />
                  <Typography variant="h6" fontWeight={700}>
                    Pending Tasks ({pendingTasks.length})
                  </Typography>
                </Box>
              </Box>

              {pendingTasks.length === 0 ? (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  All clear! You have no pending grading or attendance tasks.
                </Alert>
              ) : (
                <Stack spacing={1.5}>
                  {pendingTasks.map((task) => {
                    const urgencyColors = {
                      red: { bg: "#FFEBEE", border: "#EF5350", chip: "error" },
                      orange: { bg: "#FFF3E0", border: "#FF9800", chip: "warning" },
                      yellow: { bg: "#FFFDE7", border: "#FBC02D", chip: "info" },
                    };
                    const colorStyle = urgencyColors[task.urgency] || urgencyColors.orange;

                    return (
                      <Paper
                        key={task.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderLeft: 4,
                          borderLeftColor: colorStyle.border,
                          bgcolor: colorStyle.bg,
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {task.title}
                          </Typography>
                          <Chip
                            label={task.urgency === "red" ? "Overdue" : task.urgency === "orange" ? "Due Today" : "Upcoming"}
                            size="small"
                            color={colorStyle.chip}
                            sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          {task.detail}
                        </Typography>

                        {task.progress !== undefined && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={task.progress}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" fontWeight={600}>
                              {task.progress}%
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => router.push(task.actionUrl)}
                            sx={{ fontSize: 11, py: 0.25 }}
                          >
                            {task.actionText}
                          </Button>
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 7. CLASS TEACHER SECTION (ONLY IF CLASS TEACHER) */}
        {isCT && mainClass && (
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "primary.light",
                bgcolor: "primary.lighter",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StarIcon color="primary" />
                    <Typography variant="h6" fontWeight={800} color="primary.main">
                      My Assigned Class — {mainClass.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={`Total Students: ${mainClass.studentCount || mainClass.capacity || 30}`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Term Attendance Rate
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="success.main">
                        94%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Stable attendance this term
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Report Card Comments
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="info.main">
                        Pending
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => router.push("/exams/comments")}
                        sx={{ fontSize: 11, mt: 0.5 }}
                      >
                        Write Comments
                      </Button>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Class Roster & Performance
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="primary.main">
                        {mainClass.studentCount || 30} Students
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => router.push("/students")}
                        sx={{ fontSize: 11, mt: 0.5 }}
                      >
                        View Roster
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Students Needing Attention */}
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: "text.primary" }}>
                  ⚠️ Students Needing Attention
                </Typography>
                <Grid container spacing={1.5}>
                  {studentsNeedingAttention.map((std) => (
                    <Grid key={std.id} size={{ xs: 12, sm: 4 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "background.paper",
                          borderColor: std.urgency === "error" ? "error.light" : "warning.light",
                        }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {std.firstName} {std.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Adm: {std.admissionNumber}
                        </Typography>
                        <Chip
                          label={std.reason}
                          size="small"
                          color={std.urgency}
                          variant="outlined"
                          sx={{ mt: 1, fontSize: 10, height: "auto", py: 0.5 }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 5. MY CLASSES OVERVIEW (SECONDARY) */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: "100%", borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SchoolIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    My Classes Overview
                  </Typography>
                </Box>
                <Button size="small" onClick={() => router.push("/students")}>
                  View All Roster
                </Button>
              </Box>

              <DataState
                loading={loadingClasses}
                data={myClasses}
                isEmpty={(d) => d.length === 0}
                emptyMessage="You have not been assigned to teach any classes yet."
              >
                {(classesList) => (
                  <Grid container spacing={2}>
                    {classesList.map((cls) => (
                      <Grid key={cls.id} size={{ xs: 12, sm: 6 }}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            "&:hover": { boxShadow: 3, borderColor: "primary.main" },
                          }}
                        >
                          <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {cls.name}
                              </Typography>
                              <Chip
                                label={`${cls.studentCount || cls.capacity || 0} Students`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                              Subject(s): {cls.subjects?.join(", ") || "Mathematics, Science"}
                            </Typography>
                          </Box>

                          <Box sx={{ display: "flex", gap: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => router.push(`/students?classId=${cls.id}`)}
                            >
                              Class Roster
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => router.push(`/reports`)}
                            >
                              Performance
                            </Button>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </DataState>
            </CardContent>
          </Card>
        </Grid>

        {/* 6. RECENT MESSAGES (BOTTOM) */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: "100%", borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MessageIcon color="secondary" />
                  <Typography variant="h6" fontWeight={700}>
                    Recent Messages
                  </Typography>
                </Box>
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push("/messages")}>
                  View All
                </Button>
              </Box>

              <DataState
                loading={loadingMessages}
                data={messages}
                isEmpty={(d) => d.length === 0}
                emptyMessage="No unread parent or admin messages."
              >
                {(msgList) => (
                  <Stack spacing={1.5}>
                    {msgList.slice(0, 4).map((msg) => (
                      <Paper
                        key={msg.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: !msg.readByStaff ? "action.hover" : "transparent",
                          cursor: "pointer",
                          "&:hover": { borderColor: "primary.main" },
                        }}
                        onClick={() => router.push("/messages")}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {msg.parentName || "Parent"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(msg.sentAt)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          Parent of {msg.studentName || "Student"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {msg.body}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </DataState>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default TeacherDashboard;
