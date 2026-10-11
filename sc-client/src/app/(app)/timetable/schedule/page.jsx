"use client";

import { useState, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  ListItemText,
  MenuItem,
  OutlinedInput,
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { academicsApi, CBC_GRADES } from "@/lib/academicsApi";

// Starting point for a new schedule. Period numbers always mean the same clock
// time across schedules, so a shorter day should END earlier, not shift.
const STANDARD_DAY = [
  { startTime: "08:00", endTime: "08:40", isBreak: false },
  { startTime: "08:40", endTime: "09:20", isBreak: false },
  { startTime: "09:20", endTime: "10:00", isBreak: false },
  { startTime: "10:00", endTime: "10:30", isBreak: true, breakName: "Tea Break" },
  { startTime: "10:30", endTime: "11:10", isBreak: false },
  { startTime: "11:10", endTime: "11:50", isBreak: false },
  { startTime: "11:50", endTime: "12:30", isBreak: false },
  { startTime: "12:30", endTime: "13:30", isBreak: true, breakName: "Lunch Break" },
  { startTime: "13:30", endTime: "14:10", isBreak: false },
  { startTime: "14:10", endTime: "14:50", isBreak: false },
];

const numbered = (rows) => rows.map((r, i) => ({ ...r, periodNumber: i + 1 }));

const addMinutes = (hhmm, mins) => {
  const [h, m] = hhmm.split(":").map(Number);
  const t = Math.min(h * 60 + m + mins, 23 * 60 + 59);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

const emptyDraft = () => ({
  id: null,
  name: "",
  gradeLevels: [],
  isDefault: false,
  periods: numbered(STANDARD_DAY),
});

export default function BellSchedulesPage() {
  return (
    <>
      <PageGuard permission="timetable.manage">
        <PageHeader
          title="School day"
          subtitle="Set when lessons and breaks happen for each group of grades."
        />
        <BellSchedulesContent />
      </PageGuard>
    </>
  );
}

function BellSchedulesContent() {
  const { data, loading, refetch } = useAsync(() => academicsApi.getBellSchedules(), []);
  const schedules = Array.isArray(data) ? data : [];
  const [editing, setEditing] = useState(null); // draft object or null
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const notify = (message, severity = "success") => setSnack({ open: true, message, severity });

  const hasDefault = schedules.some((s) => s.isDefault);
  const covered = useMemo(() => new Set(schedules.flatMap((s) => s.gradeLevels)), [schedules]);
  const uncovered = CBC_GRADES.filter((g) => !covered.has(g));

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.name}"? Existing timetables are kept.`)) return;
    try {
      await academicsApi.deleteBellSchedule(s.id);
      notify("Deleted.");
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Breaks and period times are shared, so if Pre-Primary has tea at 10:00, so does everyone
        else. A shorter day simply stops earlier (for example PP1 ends after period 9).
      </Alert>

      {!loading && schedules.length > 0 && !hasDefault && uncovered.length > 0 && (
        <Alert severity="warning">
          Not assigned to any schedule yet: {uncovered.join(", ")}. Those classes use the built-in
          default day. Assign them, or mark one schedule as the default.
        </Alert>
      )}

      <Card>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Schedules
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing(emptyDraft())}
          >
            New schedule
          </Button>
        </Stack>

        {loading ? (
          <LinearProgress />
        ) : schedules.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">
              No schedules yet. Create one for each group of grades that shares a school day, for
              example Pre-Primary (PP1, PP2), Lower Primary and Upper Primary.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Grades</TableCell>
                  <TableCell align="right">Lessons/day</TableCell>
                  <TableCell align="right">Day ends</TableCell>
                  <TableCell align="right" sx={{ width: 110 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {s.name}
                      {s.isDefault && <Chip size="small" label="Default" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexwrap="wrap" useFlexGap>
                        {s.gradeLevels.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            None
                          </Typography>
                        ) : (
                          s.gradeLevels.map((g) => (
                            <Chip key={g} size="small" variant="outlined" label={g} />
                          ))
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{s.lessonsPerDay}</TableCell>
                    <TableCell align="right">{s.dayEnds}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => setEditing({ ...s })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => remove(s)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {editing && (
        <ScheduleDialog
          draft={editing}
          schedules={schedules}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            notify("Schedule saved.");
            refetch();
          }}
          notify={notify}
        />
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={snack.severity === "error" ? 9000 : 4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ maxWidth: 520 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

// ============================================================================
// Editor dialog
// ============================================================================

function ScheduleDialog({ draft, schedules, onClose, onSaved, notify }) {
  const [form, setForm] = useState(() => ({
    ...draft,
    periods: numbered(
      draft.periods.map((p) => ({
        startTime: p.startTime,
        endTime: p.endTime,
        isBreak: !!p.isBreak,
        breakName: p.breakName ?? "",
      })),
    ),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Which other schedule already owns a grade (a grade follows one schedule)
  const ownerOf = useMemo(() => {
    const m = {};
    schedules
      .filter((s) => s.id !== form.id)
      .forEach((s) => s.gradeLevels.forEach((g) => (m[g] = s.name)));
    return m;
  }, [schedules, form.id]);

  const setPeriod = (i, patch) =>
    setForm((f) => ({
      ...f,
      periods: f.periods.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));

  const addPeriod = (isBreak) =>
    setForm((f) => {
      const last = f.periods[f.periods.length - 1];
      const start = last ? last.endTime : "08:00";
      return {
        ...f,
        periods: numbered([
          ...f.periods,
          {
            startTime: start,
            endTime: addMinutes(start, isBreak ? 30 : 40),
            isBreak,
            breakName: isBreak ? "Break" : "",
          },
        ]),
      };
    });

  const removePeriod = (i) =>
    setForm((f) => ({ ...f, periods: numbered(f.periods.filter((_, idx) => idx !== i)) }));

  const useStandardDay = () => setForm((f) => ({ ...f, periods: numbered(STANDARD_DAY) }));

  const lessons = form.periods.filter((p) => !p.isBreak).length;
  const dayEnds = form.periods[form.periods.length - 1]?.endTime;

  const save = async () => {
    setError("");
    if (!form.name.trim()) return setError("Give the schedule a name.");
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      gradeLevels: form.gradeLevels,
      isDefault: form.isDefault,
      periods: form.periods.map((p) => ({
        periodNumber: p.periodNumber,
        startTime: p.startTime,
        endTime: p.endTime,
        isBreak: p.isBreak,
        breakName: p.isBreak ? p.breakName : null,
      })),
    };
    try {
      if (form.id) await academicsApi.updateBellSchedule(form.id, payload);
      else await academicsApi.createBellSchedule(payload);
      onSaved();
    } catch (e) {
      // Backend messages explain overlaps, clashing grades and mismatched period times.
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{form.id ? "Edit schedule" : "New schedule"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Name"
              size="small"
              fullWidth
              placeholder="e.g. Pre-Primary"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Grades</InputLabel>
              <Select
                multiple
                value={form.gradeLevels}
                input={<OutlinedInput label="Grades" />}
                onChange={(e) => setForm((f) => ({ ...f, gradeLevels: e.target.value }))}
                renderValue={(sel) => sel.join(", ")}
              >
                {CBC_GRADES.map((g) => (
                  <MenuItem key={g} value={g} disabled={!!ownerOf[g]}>
                    <Checkbox size="small" checked={form.gradeLevels.includes(g)} />
                    <ListItemText
                      primary={g}
                      secondary={ownerOf[g] ? `in ${ownerOf[g]}` : undefined}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
            }
            label="Use for any grade not assigned to a schedule"
          />

          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                {lessons} lessons a day, ending at {dayEnds ?? "—"}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={useStandardDay}>
                  Reset to standard day
                </Button>
                <Button size="small" startIcon={<AddIcon />} onClick={() => addPeriod(false)}>
                  Lesson
                </Button>
                <Button
                  size="small"
                  startIcon={<FreeBreakfastIcon />}
                  onClick={() => addPeriod(true)}
                >
                  Break
                </Button>
              </Stack>
            </Stack>

            <TableContainer sx={{ maxHeight: 380 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 60 }}>No.</TableCell>
                    <TableCell sx={{ width: 140 }}>Start</TableCell>
                    <TableCell sx={{ width: 140 }}>End</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell sx={{ width: 48 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.periods.map((p, i) => (
                    <TableRow key={i} sx={p.isBreak ? { bgcolor: "action.hover" } : undefined}>
                      <TableCell>P{p.periodNumber}</TableCell>
                      <TableCell>
                        <TextField
                          type="time"
                          size="small"
                          value={p.startTime}
                          onChange={(e) => setPeriod(i, { startTime: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="time"
                          size="small"
                          value={p.endTime}
                          onChange={(e) => setPeriod(i, { endTime: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        {p.isBreak ? (
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Break name"
                            value={p.breakName}
                            onChange={(e) => setPeriod(i, { breakName: e.target.value })}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Lesson
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => removePeriod(i)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save schedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
