"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ScheduleIcon from "@mui/icons-material/Schedule";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

import { ChildSelector } from "@/components/portal/ChildSelector";
import { AttendanceGrid } from "@/components/attendance/AttendanceGrid";
import { useAsync } from "@/hooks/useAsync";
import { portalApi } from "@/lib/portalApi";
import { formatDate } from "@/lib/utils";

export default function PortalAttendancePage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <PortalAttendanceContent />
    </Suspense>
  );
}

function PortalAttendanceContent() {
  const searchParams = useSearchParams();
  const initialChild = searchParams.get("child") || "";

  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState(initialChild);
  const [loadingChildren, setLoadingChildren] = useState(true);

  // Load children once
  useEffect(() => {
    let cancelled = false;
    portalApi
      .getChildren()
      .then((kids) => {
        if (cancelled) return;
        const list = Array.isArray(kids) ? kids : [];
        setChildren(list);
        if (!childId && list.length > 0) setChildId(list[0].id);
      })
      .finally(() => {
        if (!cancelled) setLoadingChildren(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: summary, loading, error } = useAsync(async () => {
    if (!childId) return null;
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return portalApi.getStudentAttendance(
      childId,
      start.toISOString().slice(0, 10),
      today.toISOString().slice(0, 10)
    );
  }, [childId]);

  const child = children.find((c) => c.id === childId);

  if (loadingChildren) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (children.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        No children are linked to your account. Please contact the school office.
      </Alert>
    );
  }

  const rawRate = summary?.summary?.attendance_rate ?? 0;
  const attendanceRate = Math.round(rawRate * 100);
  const presentCount = summary?.summary?.present_days ?? summary?.summary?.present ?? 0;
  const absentCount = summary?.summary?.absent_days ?? summary?.summary?.absent ?? 0;
  const lateCount = summary?.summary?.late_days ?? summary?.summary?.late ?? 0;

  const records = summary?.records || [];

  return (
    <Stack spacing={2.5}>
      {/* Child Switcher */}
      <ChildSelector
        children={children}
        selectedId={childId}
        onSelect={(id) => setChildId(id)}
      />

      {loading ? (
        <LinearProgress sx={{ borderRadius: 1 }} />
      ) : error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : !summary ? (
        <Card sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No attendance records available for the selected period.
          </Typography>
        </Card>
      ) : (
        <>
          {/* Main 30-Day Attendance Card */}
          <Card
            elevation={1}
            sx={{
              borderRadius: 3,
              p: { xs: 2, sm: 2.5 },
              border: 1,
              borderColor: "divider",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", textTransform: "uppercase" }}>
                  30-Day Attendance Rate
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color:
                      attendanceRate >= 90
                        ? "success.main"
                        : attendanceRate >= 75
                        ? "warning.main"
                        : "error.main",
                    mt: 0.25,
                  }}
                >
                  {attendanceRate}%
                </Typography>
              </Box>

              <Chip
                label={
                  attendanceRate >= 90
                    ? "Excellent"
                    : attendanceRate >= 75
                    ? "Satisfactory"
                    : "Action Needed"
                }
                color={attendanceRate >= 90 ? "success" : attendanceRate >= 75 ? "warning" : "error"}
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            {/* Quick Stat Tiles */}
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              <Grid item xs={4}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "success.50",
                    border: 1,
                    borderColor: "success.200",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "success.main" }}>
                    {presentCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Present
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={4}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "warning.50",
                    border: 1,
                    borderColor: "warning.200",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "warning.main" }}>
                    {lateCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Late
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={4}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "error.50",
                    border: 1,
                    borderColor: "error.200",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "error.main" }}>
                    {absentCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Absent
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Visual Attendance Calendar Grid */}
            <Divider sx={{ my: 2 }} />
            <AttendanceGrid records={records} days={30} />
          </Card>

          {/* Daily Roll Call Log */}
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <EventAvailableIcon color="action" /> Recent Daily Register
              </Typography>
            </Box>

            {records.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No attendance records logged in the last 30 days.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={0} divider={<Divider />}>
                {records.slice(-15).reverse().map((r, i) => {
                  const status = (r.status || "present").toLowerCase();
                  const isPresent = status === "present";
                  const isLate = status === "late";
                  const isAbsent = status === "absent";
                  const isExcused = status === "excused";

                  return (
                    <Box key={r.date || i} sx={{ p: 1.75, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatDate(r.date)}
                        </Typography>
                        {r.reason && (
                          <Typography variant="caption" color="text.secondary">
                            Reason: {r.reason}
                          </Typography>
                        )}
                      </Box>

                      <Chip
                        size="small"
                        label={status.toUpperCase()}
                        color={
                          isPresent
                            ? "success"
                            : isLate
                            ? "warning"
                            : isAbsent
                            ? "error"
                            : isExcused
                            ? "info"
                            : "default"
                        }
                        sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Card>
        </>
      )}
    </Stack>
  );
}
