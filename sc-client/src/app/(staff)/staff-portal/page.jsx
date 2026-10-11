"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CampaignIcon from "@mui/icons-material/Campaign";
import ClassIcon from "@mui/icons-material/Class";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ScheduleIcon from "@mui/icons-material/Schedule";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { schoolApi } from "@/lib/schoolApi";
import { staffApi } from "@/lib/staffApi";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data, loading, error, refetch } = useAsync(async () => {
    if (!user) return null;

    const [period, myClasses, timetableSlots, gradingTasks, notices] = await Promise.all([
      schoolApi.getCurrentPeriod().catch(() => ({ term: null, academic_year: null })),
      staffApi.getMyClasses(user.id, user.role),
      staffApi.getMyTimetable(user.id),
      staffApi.getMyGrading(),
      staffApi.getNotices(),
    ]);

    return {
      period,
      myClasses: myClasses || [],
      timetableSlots: timetableSlots || [],
      gradingTasks: gradingTasks || [],
      notices: notices || [],
    };
  }, [user?.id, user?.role]);

  const classes = data?.myClasses || [];
  const timetableSlots = data?.timetableSlots || [];
  const gradingTasks = data?.gradingTasks || [];
  const notices = data?.notices || [];
  const period = data?.period;

  // Compute real student enrollment sum
  const totalStudents = useMemo(() => {
    return classes.reduce((sum, c) => {
      const count = Number(c.studentCount ?? c.student_count ?? c.enrolledCount ?? 0);
      return sum + (isNaN(count) ? 0 : count);
    }, 0);
  }, [classes]);

  // Pending grading count
  const pendingGradingCount = useMemo(() => {
    return gradingTasks.reduce((count, g) => {
      const openSubs = (g.subjects || []).filter((s) => !s.completed);
      return count + (openSubs.length || 1);
    }, 0);
  }, [gradingTasks]);

  // Today's timetable slots
  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const todayDayName = DAYS_OF_WEEK[todayIndex];

  // Match day: timetable slot day might be 0-4 or string "Monday"
  const todaySlots = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return timetableSlots
      .filter((slot) => {
        if (slot.day === todayDayName || slot.day_of_week === todayDayName) return true;
        // In some schemas, day is 0 for Monday (0-4 or 0-5)
        if (typeof slot.day === "number") {
          return slot.day === todayIndex - 1;
        }
        return false;
      })
      .map((slot) => {
        let status = "upcoming";
        if (slot.startTime && slot.endTime) {
          const [sh, sm] = slot.startTime.split(":").map(Number);
          const [eh, em] = slot.endTime.split(":").map(Number);
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;
          if (currentMinutes >= endMin) status = "completed";
          else if (currentMinutes >= startMin && currentMinutes < endMin) status = "current";
        }
        return { ...slot, status };
      });
  }, [timetableSlots, todayDayName, todayIndex]);

  const completedToday = todaySlots.filter((s) => s.status === "completed").length;
  const remainingToday = todaySlots.length - completedToday;

  const termLabel = period?.term?.name || "Term 2";
  const yearLabel = period?.academic_year?.year || "2026";

  return (
    <Box>
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: 2,
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item size={{ sm: 12, md: 8 }}>
            <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 1.2 }}>
              {termLabel} • Academic Year {yearLabel}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, mb: 1 }}>
              Welcome back, {user?.name || "Teacher"}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              You have {todaySlots.length} scheduled class{todaySlots.length === 1 ? "" : "es"}{" "}
              today and {pendingGradingCount} pending grading task
              {pendingGradingCount === 1 ? "" : "s"}.
            </Typography>
          </Grid>
          <Grid
            item
            size={{ sm: 12, md: 4 }}
            sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, gap: 1 }}
          >
            <Button
              variant="contained"
              component={Link}
              href="/staff-portal/attendance"
              startIcon={<EventAvailableIcon />}
              sx={{}}
            >
              Take Attendance
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    MY CLASSES
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {classes.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {totalStudents > 0
                      ? `${totalStudents} Student${totalStudents === 1 ? "" : "s"} enrolled`
                      : "0 Students enrolled"}
                  </Typography>
                </Box>
                <Avatar
                  sx={{ bgcolor: "primary.light", color: "primary.main", width: 48, height: 48 }}
                >
                  <ClassIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    TODAY'S LESSONS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {todaySlots.length}
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                    {completedToday} Completed • {Math.max(0, remainingToday)} Left
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "info.light", color: "info.main", width: 48, height: 48 }}>
                  <ScheduleIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    PENDING GRADING
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mt: 0.5,
                      color: pendingGradingCount > 0 ? "warning.main" : "text.primary",
                    }}
                  >
                    {pendingGradingCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Across {gradingTasks.length} active exam{gradingTasks.length === 1 ? "" : "s"}
                  </Typography>
                </Box>
                <Avatar
                  sx={{ bgcolor: "warning.light", color: "warning.main", width: 48, height: 48 }}
                >
                  <EditNoteIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    STAFF NOTICES
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {notices.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active announcements
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: "secondary.light",
                    color: "secondary.main",
                    width: 48,
                    height: 48,
                  }}
                >
                  <CampaignIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Sections: Schedule & Quick Notices */}
      <Grid container spacing={3}>
        {/* Today's Schedule */}
        <Grid item size={{ xs: 12, md: 8 }} sx={{ height: "100%" }}>
          <Card elevation={1} sx={{ borderRadius: 2, height: "100%" }}>
            <CardHeader
              title="Today's Teaching Schedule"
              subheader={`${todayDayName} timetable and assigned periods`}
              action={
                <Button
                  component={Link}
                  href="/staff-portal/timetable"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                >
                  Full Timetable
                </Button>
              }
            />
            <Divider />
            {todaySlots.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Class / Stream</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todaySlots.map((row, i) => (
                      <TableRow
                        key={i}
                        sx={{
                          bgcolor: row.status === "current" ? "action.hover" : "inherit",
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>
                          {row.time || `${row.startTime || ""} - ${row.endTime || ""}`}
                        </TableCell>
                        <TableCell>{row.subjectName || row.subject || "Lesson"}</TableCell>
                        <TableCell>
                          {row.className || row.classRoomName || row.classRoom || "-"}
                        </TableCell>
                        <TableCell>{row.room || row.venue || "Classroom"}</TableCell>
                        <TableCell>
                          {row.status === "completed" && (
                            <Chip
                              label="Completed"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {row.status === "current" && (
                            <Chip label="Happening Now" size="small" color="primary" />
                          )}
                          {row.status === "upcoming" && (
                            <Chip label="Upcoming" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant={row.status === "current" ? "contained" : "outlined"}
                            component={Link}
                            href={`/staff-portal/attendance${
                              row.classRoomId || row.classId
                                ? `?class_room=${row.classRoomId || row.classId}`
                                : ""
                            }`}
                            sx={{ textTransform: "none", fontSize: "0.8rem" }}
                          >
                            Attendance
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                  No teaching periods scheduled for {todayDayName}.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  component={Link}
                  href="/staff-portal/timetable"
                  startIcon={<CalendarMonthIcon />}
                >
                  View Weekly Timetable
                </Button>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Notices & Quick Actions */}
        <Grid item size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* Quick Links Card */}
            <Card elevation={1} sx={{ borderRadius: 2 }}>
              <CardHeader title="Quick Actions" />
              <Divider />
              <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/staff-portal/attendance"
                  startIcon={<EventAvailableIcon />}
                  sx={{ py: 1.5, flexDirection: "column", gap: 0.5, textTransform: "none" }}
                >
                  Mark Attendance
                </Button>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/staff-portal/grading"
                  startIcon={<EditNoteIcon />}
                  sx={{ py: 1.5, flexDirection: "column", gap: 0.5, textTransform: "none" }}
                >
                  Enter Marks
                </Button>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/staff-portal/timetable"
                  startIcon={<CalendarMonthIcon />}
                  sx={{ py: 1.5, flexDirection: "column", gap: 0.5, textTransform: "none" }}
                >
                  My Timetable
                </Button>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/staff-portal/classes"
                  startIcon={<ClassIcon />}
                  sx={{ py: 1.5, flexDirection: "column", gap: 0.5, textTransform: "none" }}
                >
                  My Classes
                </Button>
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Announcements */}
      <Card elevation={1} sx={{ borderRadius: 2, mt:3 }}>
        <CardHeader
          title="Staff Notices & Events"
          action={
            <IconButton component={Link} href="/staff-portal/notices" size="small">
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          }
        />
        <Divider />
        {notices.length > 0 ? (
          <List disablePadding>
            {notices.slice(0, 4).map((notice, i) => (
              <ListItem
                key={notice.id || i}
                divider={i < Math.min(notices.length, 4) - 1}
                sx={{ py: 1.5 }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: notice.priority === "urgent" ? "error.light" : "grey.200",
                      color: notice.priority === "urgent" ? "error.main" : "text.secondary",
                      width: 36,
                      height: 36,
                    }}
                  >
                    <CampaignIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {notice.title}
                    </Typography>
                  }
                  secondary={`${notice.date || "Upcoming"} • ${notice.author || "Administration"}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No new announcements at this time.
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}
