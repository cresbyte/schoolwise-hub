"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
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
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ScheduleIcon from "@mui/icons-material/Schedule";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { staffApi } from "@/lib/staffApi";
import { attendanceApi, todayISO, ABSENCE_REASONS, ATTENDANCE_STATUS } from "@/lib/attendanceApi";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/utils";

export default function StaffAttendancePage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <StaffAttendanceContent />
    </Suspense>
  );
}

function StaffAttendanceContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [classId, setClassId] = useState(
    searchParams.get("class_room") || searchParams.get("class") || "",
  );
  const [date, setDate] = useState(searchParams.get("date") || todayISO());
  const [roster, setRoster] = useState(null); // { classRoom, date, canEdit, roster: [...] }
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reasonDialog, setReasonDialog] = useState(null); // { rowIndex, status, reason, notes }

  // Load teacher's classes
  const { data: classes, loading: classesLoading } = useAsync(async () => {
    if (!user) return [];
    return await staffApi.getMyClasses(user.id, user.role);
  }, [user?.id, user?.role]);

  const classList = classes || [];

  // Auto-pick first class if none selected
  useEffect(() => {
    if (!classId && classList.length > 0) {
      setClassId(classList[0].id);
    }
  }, [classList, classId]);

  // Fetch roster whenever classId or date changes
  useEffect(() => {
    if (!classId || !date) return;
    setRoster(null);
    setDirty(false);

    Promise.all([
      attendanceApi.getRoster(classId, date),
      api.getStudentsByClass(classId).catch(() => []),
    ])
      .then(([rosterData, studentsData]) => {
        const studentList = Array.isArray(studentsData)
          ? studentsData
          : studentsData?.results || [];

        const studentMap = new Map();
        studentList.forEach((s) => {
          if (s.id) studentMap.set(String(s.id), s);
          if (s.admissionNumber) studentMap.set(String(s.admissionNumber), s);
          if (s.admNo) studentMap.set(String(s.admNo), s);
        });

        if (rosterData?.roster && Array.isArray(rosterData.roster)) {
          rosterData.roster = rosterData.roster.map((r) => {
            const st =
              studentMap.get(String(r.studentId)) || studentMap.get(String(r.admissionNumber));
            const rawGender = r.gender || r.sex || st?.gender || st?.sex || "";
            let formattedGender = rawGender;
            if (rawGender.toLowerCase() === "m" || rawGender.toLowerCase() === "male") {
              formattedGender = "M";
            } else if (rawGender.toLowerCase() === "f" || rawGender.toLowerCase() === "female") {
              formattedGender = "F";
            }
            return {
              ...r,
              gender: formattedGender || "—",
              photo: r.photo || st?.photo || null,
            };
          });
        }

        setRoster(rosterData);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load attendance register");
      });
  }, [classId, date]);

  const handleStatusChange = (index, newStatus) => {
    if (!roster?.canEdit && roster?.canEdit !== undefined) {
      toast.warning("This attendance register is locked for editing.");
      return;
    }

    setRoster((r) => {
      const next = [...(r?.roster || [])];
      const prevRow = next[index];
      next[index] = { ...prevRow, status: newStatus };

      // Prompt for reason if marked absent or excused
      if ((newStatus === "absent" || newStatus === "excused") && !prevRow.reason) {
        setReasonDialog({
          rowIndex: index,
          studentName: prevRow.studentName,
          status: newStatus,
          reason: "sick",
          notes: prevRow.notes || "",
        });
      }

      return { ...r, roster: next };
    });
    setDirty(true);
  };

  const handleSaveReasonDialog = () => {
    if (!reasonDialog) return;
    const { rowIndex, reason, notes } = reasonDialog;
    setRoster((r) => {
      const next = [...(r?.roster || [])];
      next[rowIndex] = { ...next[rowIndex], reason, notes };
      return { ...r, roster: next };
    });
    setReasonDialog(null);
  };

  const handleMarkAllPresent = () => {
    if (!roster) return;
    setRoster((r) => ({
      ...r,
      roster: (r.roster || []).map((row) => ({ ...row, status: "present", reason: "" })),
    }));
    setDirty(true);
    toast.info("Marked all students as Present.");
  };

  const handleClearAll = () => {
    if (!roster) return;
    setRoster((r) => ({
      ...r,
      roster: (r.roster || []).map((row) => ({ ...row, status: "", reason: "", notes: "" })),
    }));
    setDirty(true);
  };

  const counts = useMemo(() => {
    if (!roster?.roster) return { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    return roster.roster.reduce(
      (acc, r) => {
        if (r.status === "present") acc.present++;
        else if (r.status === "absent") acc.absent++;
        else if (r.status === "late") acc.late++;
        else if (r.status === "excused") acc.excused++;
        else acc.unmarked++;
        return acc;
      },
      { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 },
    );
  }, [roster]);

  const handleSave = async () => {
    if (!roster || !roster.roster) return;

    // Validate that every student has a status
    const unmarkedStudent = roster.roster.find((r) => !r.status);
    if (unmarkedStudent) {
      toast.error(`Please mark attendance for ${unmarkedStudent.studentName || "all students"}.`);
      return;
    }

    setSaving(true);
    try {
      await attendanceApi.bulkSave({
        classRoom: roster.classRoom?.id || classId,
        date: roster.date || date,
        records: roster.roster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          reason: r.reason || "",
          notes: r.notes || "",
        })),
      });

      toast.success(`Attendance register saved for ${roster.classRoom?.name || "Class"}!`);
      setDirty(false);
    } catch (err) {
      toast.error(err.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Daily Attendance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Mark roll call for your assigned streams and submit daily registers
        </Typography>
      </Box>

      {/* Selector & Action Bar */}
      <Card elevation={1} sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flex: 1 }}>
              <FormControl size="small" sx={{ minWidth: 220 }} disabled={classesLoading}>
                <InputLabel>Class Stream</InputLabel>
                <Select
                  value={classId}
                  label="Class Stream"
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {classList.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} {c.gradeLevel ? `(${c.gradeLevel})` : ""}{" "}
                      {c.isClassTeacher ? "★" : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                type="date"
                size="small"
                label="Attendance Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 170 }}
              />
            </Stack>

            <Stack direction="row" spacing={1} flexwrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                size="small"
                onClick={handleMarkAllPresent}
                disabled={!roster || saving}
                startIcon={<CheckCircleIcon color="success" />}
              >
                Mark All Present
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={handleClearAll}
                disabled={!roster || saving}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={!roster || saving || (!dirty && !roster?.canEdit)}
              >
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </Stack>
          </Stack>

          {/* Quick Stats Chips */}
          {roster && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Stack direction="row" spacing={1.5} flexwrap="wrap" useFlexGap alignItems="center">
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Summary:
                </Typography>
                <Chip size="small" color="success" label={`Present: ${counts.present}`} />
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
                {counts.unmarked > 0 && (
                  <Chip
                    size="small"
                    color="default"
                    variant="outlined"
                    label={`Unmarked: ${counts.unmarked}`}
                  />
                )}
                {dirty && (
                  <Chip
                    size="small"
                    label="Unsaved Changes"
                    color="warning"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Roster Table */}
      <Card elevation={1} sx={{ borderRadius: 2 }}>
        {!roster ? (
          <Box sx={{ p: 6, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CircularProgress size={36} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading register for selected class and date...
            </Typography>
          </Box>
        ) : !roster.roster || roster.roster.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              No students enrolled in this class stream.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>Adm No</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 90 }}>Gender</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reason / Note</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, width: 220 }}>
                    Roll Call
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roster.roster.map((row, index) => {
                  const status = row.status || "";
                  const config = ATTENDANCE_STATUS[status] || {
                    label: "Unmarked",
                    color: "default",
                  };

                  return (
                    <TableRow key={row.studentId || index} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {row.admissionNumber || row.admNo || "-"}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            src={row.photo}
                            sx={{
                              width: 30,
                              height: 30,
                              fontSize: 13,
                              bgcolor: "primary.light",
                              color: "primary.main",
                            }}
                          >
                            {getInitials(row.studentName)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.studentName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{row.gender || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={config.label}
                          size="small"
                          color={config.color}
                          variant={status ? "filled" : "outlined"}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        {row.reason ? (
                          <Tooltip title={row.notes || row.reason}>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", fontWeight: 500 }}
                            >
                              {ABSENCE_REASONS.find((r) => r.value === row.reason)?.label ||
                                row.reason}
                              {row.notes ? ` (${row.notes})` : ""}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant={status === "present" ? "contained" : "outlined"}
                            color="success"
                            onClick={() => handleStatusChange(index, "present")}
                            sx={{ minWidth: 36, px: 1, py: 0.5, fontWeight: 700 }}
                          >
                            P
                          </Button>
                          <Button
                            size="small"
                            variant={status === "late" ? "contained" : "outlined"}
                            color="warning"
                            onClick={() => handleStatusChange(index, "late")}
                            sx={{ minWidth: 36, px: 1, py: 0.5, fontWeight: 700 }}
                          >
                            L
                          </Button>
                          <Button
                            size="small"
                            variant={status === "absent" ? "contained" : "outlined"}
                            color="error"
                            onClick={() => handleStatusChange(index, "absent")}
                            sx={{ minWidth: 36, px: 1, py: 0.5, fontWeight: 700 }}
                          >
                            A
                          </Button>
                          <Button
                            size="small"
                            variant={status === "excused" ? "contained" : "outlined"}
                            color="info"
                            onClick={() => handleStatusChange(index, "excused")}
                            sx={{ minWidth: 36, px: 1, py: 0.5, fontWeight: 700 }}
                          >
                            E
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Reason Dialog for Absent / Excused */}
      <Dialog open={!!reasonDialog} onClose={() => setReasonDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Reason for {reasonDialog?.status === "absent" ? "Absence" : "Excused Absence"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Record details for <strong>{reasonDialog?.studentName}</strong>:
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Reason Category</InputLabel>
            <Select
              value={reasonDialog?.reason || "sick"}
              label="Reason Category"
              onChange={(e) => setReasonDialog((prev) => ({ ...prev, reason: e.target.value }))}
            >
              {ABSENCE_REASONS.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Additional Notes (Optional)"
            value={reasonDialog?.notes || ""}
            onChange={(e) => setReasonDialog((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReasonDialog(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveReasonDialog}>
            Confirm Reason
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
