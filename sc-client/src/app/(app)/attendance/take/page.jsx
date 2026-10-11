"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ScheduleIcon from "@mui/icons-material/Schedule";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SaveIcon from "@mui/icons-material/Save";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { academicsApi } from "@/lib/academicsApi";
import { attendanceApi, todayISO, ABSENCE_REASONS } from "@/lib/attendanceApi";

export default function TakeAttendancePage() {
  return (
    <>
      <PageGuard permission="attendance.write">
        <TakeAttendanceContent />
      </PageGuard>
    </>
  );
}

function TakeAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [classId, setClassId] = useState(searchParams.get("class_room") || "");
  const [date, setDate] = useState(searchParams.get("date") || todayISO());
  const [roster, setRoster] = useState(null); // { classRoom, date, canEdit, roster: [...] }
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [reasonDialog, setReasonDialog] = useState(null); // { rowIndex, status }

  // Load the classes the user can take attendance for
  const { data: classesData, loading: classesLoading } = useAsync(async () => {
    const all = await academicsApi.getClasses({ current: 1 });
    const classes = Array.isArray(all) ? all : [];

    // Non-admins only see classes they teach or are class teacher of
    if (["admin", "headteacher", "deputy"].includes(user?.role)) {
      return { classes };
    }
    const mine = classes.filter((c) => c.classTeacherId === user?.id);
    // (Subject teachers: expand with assignments if you want)
    return { classes: mine.length ? mine : classes };
  }, [user?.role, user?.id]);

  const classes = classesData?.classes ?? [];

  // Auto-pick the first class
  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(classes[0].id);
  }, [classes, classId]);

  // Fetch the roster whenever class/date changes
  useEffect(() => {
    if (!classId || !date) return;
    setRoster(null);
    setDirty(false);
    attendanceApi
      .getRoster(classId, date)
      .then((data) => setRoster(data))
      .catch((e) => notify(e.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date]);

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const handleStatusChange = (index, newStatus) => {
    setRoster((r) => {
      const next = [...r.roster];
      next[index] = { ...next[index], status: newStatus };
      // If status is absent/excused and no reason yet, open the reason dialog
      if ((newStatus === "absent" || newStatus === "excused") && !next[index].reason) {
        setReasonDialog({ rowIndex: index, status: newStatus });
      }
      return { ...r, roster: next };
    });
    setDirty(true);
  };

  const handleReasonSave = (reason) => {
    const { rowIndex } = reasonDialog;
    setRoster((r) => {
      const next = [...r.roster];
      next[rowIndex] = { ...next[rowIndex], reason };
      return { ...r, roster: next };
    });
    setReasonDialog(null);
  };

  const handleMarkAllPresent = () => {
    setRoster((r) => ({
      ...r,
      roster: r.roster.map((row) => ({ ...row, status: "present", reason: "" })),
    }));
    setDirty(true);
  };

  const handleClearAll = () => {
    setRoster((r) => ({
      ...r,
      roster: r.roster.map((row) => ({ ...row, status: "", reason: "" })),
    }));
    setDirty(true);
  };

  const counts = useMemo(() => {
    if (!roster) return { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    return roster.roster.reduce(
      (acc, r) => {
        if (r.status) acc[r.status]++;
        else acc.unmarked++;
        return acc;
      },
      { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 },
    );
  }, [roster]);

  const handleSave = async () => {
    if (!roster) return;

    // Validate: every row must have a status; absent/excused must have a reason
    const incomplete = roster.roster.find(
      (r) => !r.status || ((r.status === "absent" || r.status === "excused") && !r.reason),
    );
    if (incomplete) {
      return notify(`${incomplete.studentName} is missing a status or reason.`, "error");
    }

    setSaving(true);
    try {
      await attendanceApi.bulkSave({
        classRoom: roster.classRoom.id,
        date: roster.date,
        records: roster.roster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          reason: r.reason || "",
          notes: r.notes || "",
        })),
      });
      notify(`Attendance saved for ${roster.classRoom.name}`);
      setDirty(false);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Take attendance"
        subtitle="Mark today's register. Save once for the whole class."
        actions={
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!roster || saving || !dirty || !roster.canEdit}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        }
      />

      {/* Selector bar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          flexwrap="wrap"
          useFlexGap
        >
          <FormControl size="small" sx={{ minWidth: 220 }} disabled={classesLoading}>
            <InputLabel>Class</InputLabel>
            <Select value={classId} label="Class" onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} · {c.gradeLevel}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
          />

          <Box sx={{ flex: 1 }} />

          {roster && (
            <Stack direction="row" spacing={1.5} flexwrap="wrap" useFlexGap>
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={`Present: ${counts.present}`}
              />
              <Chip
                size="small"
                color="error"
                variant="outlined"
                label={`Absent: ${counts.absent}`}
              />
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={`Late: ${counts.late}`}
              />
              <Chip
                size="small"
                color="info"
                variant="outlined"
                label={`Excused: ${counts.excused}`}
              />
              {counts.unmarked > 0 && <Chip size="small" label={`Unmarked: ${counts.unmarked}`} />}
            </Stack>
          )}
        </Stack>
      </Card>

      {roster && !roster.canEdit && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You do not have permission to edit attendance for this class on this date. Showing the
          existing record only.
        </Alert>
      )}

      <DataState
        loading={!roster}
        error={null}
        data={roster}
        onRetry={() => setDate(date)}
        isEmpty={() => roster.roster.length === 0}
        emptyMessage="No students on the roster for this class on this date."
      >
        {() => (
          <>
            <Card sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" spacing={2}>
                <Button
                  startIcon={<FlashOnIcon />}
                  onClick={handleMarkAllPresent}
                  disabled={!roster.canEdit}
                >
                  Mark all present
                </Button>
                <Button onClick={handleClearAll} disabled={!roster.canEdit}>
                  Clear all
                </Button>
                <Box sx={{ flex: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
                  {roster.roster.length} students
                </Typography>
              </Stack>
            </Card>

            <Card>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Admission</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roster.roster.map((r, i) => (
                      <TableRow key={r.studentId} hover>
                        <TableCell sx={{ color: "text.secondary", width: 48 }}>{i + 1}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                              {r.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </Avatar>
                            <span style={{ fontWeight: 500 }}>{r.studentName}</span>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                          {r.admissionNumber}
                        </TableCell>
                        <TableCell align="center">
                          <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={r.status || null}
                            onChange={(_, val) => val && handleStatusChange(i, val)}
                            disabled={!roster.canEdit}
                          >
                            <ToggleButton value="present" sx={{ px: 1.5 }}>
                              <Tooltip title="Present">
                                <CheckCircleIcon fontSize="small" color="success" />
                              </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="late" sx={{ px: 1.5 }}>
                              <Tooltip title="Late">
                                <ScheduleIcon fontSize="small" color="warning" />
                              </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="excused" sx={{ px: 1.5 }}>
                              <Tooltip title="Excused">
                                <MedicalServicesIcon fontSize="small" color="info" />
                              </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="absent" sx={{ px: 1.5 }}>
                              <Tooltip title="Absent">
                                <CancelIcon fontSize="small" color="error" />
                              </Tooltip>
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </TableCell>
                        <TableCell align="center">
                          {r.reason ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={
                                ABSENCE_REASONS.find((x) => x.value === r.reason)?.label || r.reason
                              }
                            />
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving || !dirty || !roster.canEdit}
              >
                {saving ? "Saving…" : "Save attendance"}
              </Button>
            </Stack>
          </>
        )}
      </DataState>

      {/* Reason dialog for absent/excused */}
      <Dialog open={!!reasonDialog} onClose={() => setReasonDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {reasonDialog?.status === "excused" ? "Excused reason" : "Absence reason"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {ABSENCE_REASONS.map((r) => (
              <Button
                key={r.value}
                variant="outlined"
                onClick={() => handleReasonSave(r.value)}
                fullWidth
                sx={{ justifyContent: "flex-start" }}
              >
                {r.label}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonDialog(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
