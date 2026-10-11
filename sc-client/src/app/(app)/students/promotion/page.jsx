"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/hooks/useAsync";
import { PROMOTION_STATUS, promotionApi } from "@/lib/promotionApi";
import { schoolApi } from "@/lib/schoolApi";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import UndoIcon from "@mui/icons-material/Undo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
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
import { useState } from "react";

export default function PromotionPage() {
  return (
    <>
      <PageGuard permission="settings.view">
        <PromotionContent />
      </PageGuard>
    </>
  );
}

function PromotionContent() {
  const [fromYearId, setFromYearId] = useState("");
  const [toYearId, setToYearId] = useState("");
  const [grade, setGrade] = useState("");

  const [mapping, setMapping] = useState(null); // [{fromStream, fromStudentCount, toStream, toClassId}, ...]
  const [targetClasses, setTargetClasses] = useState([]); // target classes for the grade

  const [batch, setBatch] = useState(null); // full batch detail from server
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [busy, setBusy] = useState({
    mapping: false,
    batch: false,
    row: null,
    execute: false,
    undo: null,
  });

  const [confirmExecute, setConfirmExecute] = useState(false);
  const [confirmTypeValue, setConfirmTypeValue] = useState("");
  const [confirmUndo, setConfirmUndo] = useState(null);

  // ─── Load years + grade levels once ───────────────────────────────────
  const {
    data: setupData,
    loading: setupLoading,
    error: setupError,
    refetch: refetchSetup,
  } = useAsync(async () => {
    const [years, grades] = await Promise.all([
      schoolApi.getAcademicYears(),
      schoolApi.getGradeLevels(),
    ]);
    return {
      years: Array.isArray(years) ? years : [],
      grades: Array.isArray(grades) ? grades : [],
    };
  }, []);

  const years = setupData?.years ?? [];
  const grades = setupData?.grades ?? [];

  // Only allow: source must be active, target must be draft
  const sourceYears = years.filter((y) => y.status === "active");
  const targetYears = years.filter((y) => y.status === "draft");

  // ─── Load recent batches ───────────────────────────────────────────────
  const { data: batchesData, refetch: refetchBatches } = useAsync(
    () => promotionApi.listBatches(),
    [],
  );
  const recentBatches = Array.isArray(batchesData) ? batchesData : [];

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const resetFlow = () => {
    setMapping(null);
    setBatch(null);
    setTargetClasses([]);
  };

  // ─── Step 1 → 2: suggest stream mapping ────────────────────────────────
  const handleSuggestMapping = async () => {
    if (!fromYearId || !toYearId || !grade) {
      return notify("Pick source year, target year, and grade.", "error");
    }
    setBusy((b) => ({ ...b, mapping: true }));
    resetFlow();
    try {
      const suggestions = await promotionApi.suggestMapping(
        Number(fromYearId),
        Number(toYearId),
        grade,
      );

      // Load target-year classes for this grade so the dropdown has options
      const targetGrade = grades.find((g) => g.name === grade)?.next_grade_name || null;
      // If your GradeLevel API exposes next_grade, use it; otherwise the
      // suggestions already carry the mapping. We'll derive target classes
      // from the mapping values + a classes lookup.

      // Fetch all classes for the target year and filter by the grade the
      // admin is promoting into. We need the target grade name — the backend
      // gave us `toClassId` per suggestion, but for the "unmapped" case we
      // still need to show all options. Fetch them directly.
      const allTargetClasses = await fetchTargetClasses(toYearId, grade);
      setTargetClasses(allTargetClasses);

      setMapping(
        (suggestions || []).map((s) => ({
          fromStream: s.fromStream,
          fromStudentCount: s.fromStudentCount,
          toStream: s.toStream || "",
          toClassId: s.toClassId || "",
        })),
      );
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy((b) => ({ ...b, mapping: false }));
    }
  };

  // Fetch target classes for the same grade the students are moving into.
  // The backend's suggest-mapping gives us the target grade indirectly via
  // the mapped classes, but for the empty slots we need the full list.
  const fetchTargetClasses = async (targetYearId, fromGradeName) => {
    // First, find the target grade name.
    const fromGrade = grades.find((g) => g.name === fromGradeName);
    if (!fromGrade) return [];

    // next_grade isn't a field on the serializer, so ask the backend
    // indirectly: get all classes for the target year and filter to those
    // whose grade order is immediately above the source grade's order.
    const { academicsApi } = await import("@/lib/academicsApi");
    const all = await academicsApi.getClasses({ academic_year: targetYearId });
    const nextOrder = (fromGrade.order ?? 0) + 1;
    return (all || []).filter((c) => c.gradeLevelOrder === nextOrder);
  };

  const handleMappingChange = (fromStream, toClassId) => {
    setMapping((prev) =>
      prev.map((m) =>
        m.fromStream === fromStream
          ? {
              ...m,
              toClassId,
              toStream: targetClasses.find((c) => c.id === toClassId)?.stream || "",
            }
          : m,
      ),
    );
  };

  // ─── Step 2 → 3: create the batch (preview) ────────────────────────────
  const handleCreateBatch = async () => {
    if (!mapping || mapping.length === 0) return notify("Nothing to preview.", "error");

    // Build the streamMapping dict: { fromStream: toStream }
    const streamMapping = {};
    mapping.forEach((m) => {
      streamMapping[m.fromStream] = m.toStream || null;
    });

    setBusy((b) => ({ ...b, batch: true }));
    try {
      const created = await promotionApi.createBatch({
        fromYear: Number(fromYearId),
        toYear: Number(toYearId),
        fromGrade: grade,
        streamMapping,
      });
      setBatch(created);
      refetchBatches();
      notify(`Preview created for ${grade}: ${created.studentCount} students.`);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy((b) => ({ ...b, batch: false }));
    }
  };

  // ─── Step 3: per-student override ──────────────────────────────────────
  const handleRowOverride = async (rowId, field, value) => {
    setBusy((b) => ({ ...b, row: rowId }));
    try {
      const updated = await promotionApi.updateRow(batch.id, rowId, {
        [field]: value,
      });
      setBatch((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === rowId
            ? {
                ...s,
                outcome: updated.outcome,
                toClass: updated.toClass,
                toClassId: updated.toClassId,
              }
            : s,
        ),
        // Refresh counts from the server
      }));
      // Re-fetch the batch to get recalculated counts
      const fresh = await promotionApi.getBatch(batch.id);
      setBatch(fresh);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy((b) => ({ ...b, row: null }));
    }
  };

  // ─── Step 3 → 4: execute ───────────────────────────────────────────────
  const handleExecute = async () => {
    setBusy((b) => ({ ...b, execute: true }));
    try {
      const result = await promotionApi.execute(batch.id);
      notify(
        `Executed: ${result.promotedCount} promoted, ` +
          `${result.repeatedCount} repeated, ${result.graduatedCount} graduated, ` +
          `${result.skippedCount} skipped.`,
      );
      setConfirmExecute(false);
      setConfirmTypeValue("");
      // Refresh batch + list
      const fresh = await promotionApi.getBatch(batch.id);
      setBatch(fresh);
      refetchBatches();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy((b) => ({ ...b, execute: false }));
    }
  };

  // ─── Undo ──────────────────────────────────────────────────────────────
  const handleUndo = async () => {
    const batchId = confirmUndo?.id;
    setBusy((b) => ({ ...b, undo: batchId }));
    try {
      await promotionApi.undo(batchId);
      notify("Batch undone.");
      setConfirmUndo(null);
      if (batch && batch.id === batchId) {
        const fresh = await promotionApi.getBatch(batchId);
        setBatch(fresh);
      }
      refetchBatches();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy((b) => ({ ...b, undo: null }));
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="Year-end promotion"
        subtitle="Promote one grade at a time. Preview, review, execute. Undo within 24 hours."
      />

      {/* ── Setup card ─────────────────────────────────────────────── */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Pick the transition
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="flex-end"
          flexwrap="wrap"
          useFlexGap
        >
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>From year (active)</InputLabel>
            <Select
              value={fromYearId}
              label="From year (active)"
              onChange={(e) => {
                setFromYearId(e.target.value);
                resetFlow();
              }}
            >
              {sourceYears.length === 0 && (
                <MenuItem value="" disabled>
                  No active year
                </MenuItem>
              )}
              {sourceYears.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>To year (draft)</InputLabel>
            <Select
              value={toYearId}
              label="To year (draft)"
              onChange={(e) => {
                setToYearId(e.target.value);
                resetFlow();
              }}
            >
              {targetYears.length === 0 && (
                <MenuItem value="" disabled>
                  No draft year — create one first
                </MenuItem>
              )}
              {targetYears.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Grade to promote</InputLabel>
            <Select
              value={grade}
              label="Grade to promote"
              onChange={(e) => {
                setGrade(e.target.value);
                resetFlow();
              }}
            >
              {grades.map((g) => (
                <MenuItem key={g.id} value={g.name}>
                  {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={busy.mapping ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleSuggestMapping}
            disabled={busy.mapping || !fromYearId || !toYearId || !grade}
          >
            Continue
          </Button>
        </Stack>

        {sourceYears.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You need one active academic year before you can promote. Activate one in School
            Settings.
          </Alert>
        )}
        {targetYears.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You need a draft academic year to promote into. Create one for next year first.
          </Alert>
        )}
      </Card>

      {/* ── Step 2: Stream mapping ────────────────────────────────── */}
      {mapping && !batch && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            2. Map streams
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The system proposes a default. Change any row that should go elsewhere. Unmapped streams
            will have their students marked “Skipped”.
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Source stream</TableCell>
                  <TableCell align="right">Students</TableCell>
                  <TableCell>→ Target stream</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mapping.map((m) => (
                  <TableRow key={m.fromStream}>
                    <TableCell sx={{ fontWeight: 600 }}>{m.fromStream}</TableCell>
                    <TableCell align="right">{m.fromStudentCount}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <Select
                          value={m.toClassId || ""}
                          displayEmpty
                          onChange={(e) => handleMappingChange(m.fromStream, e.target.value)}
                        >
                          <MenuItem value="">
                            <em>Unmapped (skip students)</em>
                          </MenuItem>
                          {targetClasses.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name} · {c.studentCount}/{c.capacity}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <Button color="inherit" onClick={resetFlow}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateBatch}
              disabled={busy.batch}
              startIcon={busy.batch ? <CircularProgress size={16} /> : null}
            >
              {busy.batch ? "Building preview…" : "Preview students"}
            </Button>
          </Stack>
        </Card>
      )}

      {/* ── Step 3: Student preview ───────────────────────────────── */}
      {batch && batch.status === "previewed" && (
        <PreviewCard
          batch={batch}
          targetClasses={targetClasses}
          busyRow={busy.row}
          onOverride={handleRowOverride}
          onCancel={() => {
            setBatch(null);
            resetFlow();
          }}
          onExecute={() => {
            setConfirmExecute(true);
            setConfirmTypeValue("");
          }}
        />
      )}

      {/* ── Step 4: Executed batch summary ────────────────────────── */}
      {batch && batch.status !== "previewed" && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">
                {batch.fromGrade} → {batch.toGrade || "graduated"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {batch.fromYearName} → {batch.toYearName} ·{" "}
                <BatchStatusChip status={batch.status} />
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              {batch.canUndo && (
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<UndoIcon />}
                  onClick={() => setConfirmUndo(batch)}
                >
                  Undo this batch
                </Button>
              )}
              <Button
                variant="contained"
                onClick={() => {
                  setBatch(null);
                  resetFlow();
                }}
              >
                Promote next grade
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={3} flexwrap="wrap" useFlexGap>
            <SummaryStat label="Promoted" value={batch.promotedCount} color="primary" />
            <SummaryStat label="Repeated" value={batch.repeatedCount} color="warning" />
            <SummaryStat label="Graduated" value={batch.graduatedCount} color="success" />
            <SummaryStat label="Skipped" value={batch.skippedCount} color="default" />
          </Stack>
        </Card>
      )}

      {/* ── Recent batches ────────────────────────────────────────── */}
      <RecentBatches
        batches={recentBatches}
        onUndo={(b) => setConfirmUndo(b)}
        onOpen={(b) => promotionApi.getBatch(b.id).then(setBatch)}
      />

      {/* ── Confirm execute ───────────────────────────────────────── */}
      <Dialog open={confirmExecute} onClose={() => !busy.execute && setConfirmExecute(false)}>
        <DialogTitle>Execute this batch?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography paragraph>
              This will move <strong>{batch?.studentCount}</strong> students from{" "}
              <strong>{batch?.fromGrade}</strong> into <strong>{batch?.toYearName}</strong>.
            </Typography>
            <Typography paragraph>
              Type <strong>{batch?.fromGrade}</strong> to confirm:
            </Typography>
            <TextField
              autoFocus
              fullWidth
              value={confirmTypeValue}
              onChange={(e) => setConfirmTypeValue(e.target.value)}
            />
            <Alert severity="warning" sx={{ mt: 2 }}>
              You can undo this within 24 hours, or until the source year is closed.
            </Alert>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setConfirmExecute(false)} disabled={busy.execute}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExecute}
            disabled={busy.execute || confirmTypeValue.trim() !== batch?.fromGrade}
          >
            {busy.execute ? "Executing…" : "Execute"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirm undo ──────────────────────────────────────────── */}
      <Dialog open={!!confirmUndo} onClose={() => !busy.undo && setConfirmUndo(null)}>
        <DialogTitle>Undo this batch?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will reverse all {confirmUndo?.studentCount} student movements in{" "}
            <strong>
              {confirmUndo?.fromGrade} → {confirmUndo?.toGrade}
            </strong>
            . The source enrollments will be reactivated and the target enrollments deleted. This
            cannot be re-applied; you'll need to create a new preview.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setConfirmUndo(null)} disabled={!!busy.undo}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleUndo} disabled={!!busy.undo}>
            {busy.undo ? "Undoing…" : "Undo batch"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
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

// ─── Sub-components ──────────────────────────────────────────────────────

function PreviewCard({ batch, targetClasses, busyRow, onOverride, onCancel, onExecute }) {
  const counts = {
    promoted: batch.students.filter((s) => s.outcome === "promoted").length,
    repeated: batch.students.filter((s) => s.outcome === "repeated").length,
    graduated: batch.students.filter((s) => s.outcome === "graduated").length,
    skipped: batch.students.filter((s) => s.outcome === "skipped").length,
  };

  return (
    <Card sx={{ mb: 3 }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">3. Review students</Typography>
        <Typography variant="body2" color="text.secondary">
          {batch.studentCount} students from {batch.fromGrade} → {batch.toGrade}. Change any row
          before executing.
        </Typography>
      </Box>
      <Divider />

      <Stack direction="row" spacing={2} sx={{ p: 2 }} flexwrap="wrap" useFlexGap>
        <Chip label={`Promote: ${counts.promoted}`} color="primary" />
        <Chip label={`Repeat: ${counts.repeated}`} color="warning" />
        <Chip label={`Graduate: ${counts.graduated}`} color="success" />
        <Chip label={`Skip: ${counts.skipped}`} variant="outlined" />
      </Stack>

      <TableContainer sx={{ maxHeight: 520 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Outcome</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batch.students.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{s.studentName}</TableCell>
                <TableCell>{s.fromClass}</TableCell>
                <TableCell>{s.toClass || "—"}</TableCell>
                <TableCell>
                  <FormControl size="small" disabled={busyRow === s.id} sx={{ minWidth: 140 }}>
                    <Select
                      value={s.outcome}
                      onChange={(e) => onOverride(s.id, "outcome", e.target.value)}
                    >
                      <MenuItem value="promoted">Promote</MenuItem>
                      <MenuItem value="repeated">Repeat</MenuItem>
                      <MenuItem value="graduated">Graduate</MenuItem>
                      <MenuItem value="skipped">Skip</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {s.reason || ""}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ p: 2 }}>
        <Button color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={onExecute}
          disabled={counts.promoted + counts.repeated + counts.graduated === 0}
        >
          Execute batch
        </Button>
      </Stack>
    </Card>
  );
}

function RecentBatches({ batches, onUndo, onOpen }) {
  if (!batches || batches.length === 0) return null;

  return (
    <Card sx={{ mb: 3 }}>
      <Box sx={{ p: 2.5 }}>
        <Typography variant="h6">Recent batches</Typography>
      </Box>
      <Divider />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Grade</TableCell>
              <TableCell>Transition</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>When</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batches.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{b.fromGrade}</TableCell>
                <TableCell>
                  {b.fromYearName} → {b.toYearName}
                </TableCell>
                <TableCell>{b.studentCount}</TableCell>
                <TableCell>
                  <BatchStatusChip status={b.status} />
                </TableCell>
                <TableCell>
                  {b.executedAt
                    ? `Executed ${new Date(b.executedAt).toLocaleString()}`
                    : b.createdAt
                      ? `Previewed ${new Date(b.createdAt).toLocaleString()}`
                      : "—"}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Open">
                      <IconButton size="small" onClick={() => onOpen(b)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {b.canUndo && (
                      <Tooltip title="Undo">
                        <IconButton size="small" color="error" onClick={() => onUndo(b)}>
                          <UndoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

function SummaryStat({ label, value, color }) {
  return (
    <Box sx={{ minWidth: 100 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" color={`${color}.main`}>
        {value}
      </Typography>
    </Box>
  );
}

function BatchStatusChip({ status }) {
  const meta = PROMOTION_STATUS[status] || { label: status, color: "default" };
  return <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />;
}
