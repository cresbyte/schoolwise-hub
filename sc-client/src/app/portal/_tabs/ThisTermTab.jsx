"use client";

import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { AccessTime, EventAvailable, Payments, Print } from "@mui/icons-material";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatDate, formatKES } from "@/lib/utils";

export function ThisTermTab({ student, onSwitchTab }) {
  // Fetch published exams
  const { data: examEvents = [], loading: examsLoading } = useAsync(async () => {
    try {
      const res = await api.exams.list({ status: "published" });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }, []);

  // Fetch student levies
  const { data: leviesData = [], loading: leviesLoading } = useAsync(async () => {
    try {
      const res = await api.getStudentLevies(student.id);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }, [student.id]);

  // Safely filter unpaid levies (handles null/undefined)
  const unpaidLevies = useMemo(() => {
    const safeLevies = leviesData || [];
    const list = safeLevies.filter((l) => !l.paid && !l.waived);
    return {
      count: list.length,
      total: list.reduce((sum, l) => sum + (l.levy?.amount || l.amount || 0), 0),
    };
  }, [leviesData]);

  // Safely filter upcoming events
  const upcomingEvents = useMemo(() => {
    const safeExams = examEvents || [];
    const today = new Date().toISOString().split("T")[0];
    return safeExams.filter((e) => (e.endDate || e.startDate) >= today);
  }, [examEvents]);

  if (examsLoading || leviesLoading) {
    return <Box sx={{ p: 4, textAlign: "center" }}>Loading term overview...</Box>;
  }

  return (
    <Box>
      {/* Term overview */}
      <Card variant="outlined" sx={{ mb: 3, bgcolor: "primary.main", color: "white" }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "inherit" }}>
                Current Academic Year
              </Typography>
              <Typography variant="body2" sx={{ color: "inherit", opacity: 0.9 }}>
                Welcome to the parent portal. Stay updated with your child's progress.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Exam schedule */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            Recent & Upcoming Exams
          </Typography>
          <Stack spacing={2} sx={{ mb: 4 }}>
            {examEvents.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No published exams for this term yet.
              </Typography>
            )}
            {examEvents.map((examEvent) => {
              const today = new Date().toISOString().split("T")[0];
              const startDate = examEvent.startDate;
              const endDate = examEvent.endDate || examEvent.startDate;
              const isUpcoming = startDate > today;
              const isOngoing = today >= startDate && today <= endDate;

              return (
                <Card key={examEvent.id} variant="outlined">
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "flex-start" },
                        gap: 1.5,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {examEvent.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {startDate !== endDate
                            ? `${formatDate(startDate)} – ${formatDate(endDate)}`
                            : formatDate(startDate)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          textAlign: { xs: "left", sm: "right" },
                          width: { xs: "100%", sm: "auto" },
                        }}
                      >
                        {isUpcoming ? (
                          <Chip
                            label="Upcoming"
                            size="small"
                            color="info"
                            sx={{ fontWeight: 700 }}
                          />
                        ) : isOngoing ? (
                          <Chip
                            label="Ongoing"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Stack
                            spacing={1}
                            direction={{ xs: "row", sm: "column" }}
                            alignItems={{ xs: "center", sm: "flex-end" }}
                          >
                            <Chip
                              label="Results Available"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 700 }}
                            />
                            <Button size="small" onClick={() => onSwitchTab(1)}>
                              View Full Results
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          {/* Quick actions */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: "View Report Card", icon: <Print />, tab: 1 },
              { label: "Pay Fees", icon: <Payments />, tab: 2 },
              { label: "Term Timetable", icon: <AccessTime />, tab: 3 },
            ].map((action) => (
              <Grid size={{ xs: 6 }} key={action.label}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={action.icon}
                  onClick={() => onSwitchTab(action.tab)}
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                >
                  {action.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          {/* Coming up */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            Coming Up
          </Typography>
          <List
            sx={{
              bgcolor: "background.paper",
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
              mb: 3,
            }}
          >
            {upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 3).map((e, idx) => (
                <Box key={e.id}>
                  <ListItem sx={{ py: 1.5 }}>
                    <Box sx={{ minWidth: 60, textAlign: "center" }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          color: "text.secondary",
                          display: "block",
                          lineHeight: 1,
                        }}
                      >
                        {new Date(e.startDate)
                          .toLocaleString("default", { month: "short" })
                          .toUpperCase()}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                        {new Date(e.startDate).getDate()}
                      </Typography>
                    </Box>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {e.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          EXAM
                        </Typography>
                      }
                    />
                  </ListItem>
                  {idx < upcomingEvents.slice(0, 3).length - 1 && <Divider />}
                </Box>
              ))
            ) : (
              <ListItem>
                <ListItemText secondary="No upcoming events scheduled" />
              </ListItem>
            )}
          </List>

          {/* Fees alert */}
          {unpaidLevies.count > 0 && (
            <Alert
              severity="warning"
              sx={{ borderRadius: 2 }}
              action={
                <Button size="small" color="inherit" onClick={() => onSwitchTab(2)}>
                  View
                </Button>
              }
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Unpaid Levies
              </Typography>
              <Typography variant="body2">
                You have {unpaidLevies.count} unpaid special levies totaling{" "}
                {formatKES(unpaidLevies.total)}.
              </Typography>
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
