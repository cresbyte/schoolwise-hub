"use client";

/**
 * Subjects: add and edit subjects, choose which grades offer them, and define the grading scale.
 * @module subjects/page
 */
import { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
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
import { GRADE_LEVELS, gradeRank } from "@/lib/grades";

export default function SubjectsPage() {
  return (
    <DashboardLayout>
      <SubjectsContent />
    </DashboardLayout>
  );
}

function sortGrades(grades) {
  return [...grades].sort((a, b) => gradeRank(a) - gradeRank(b) || a.localeCompare(b));
}

const DEFAULT_GRADING_SCALE = [
  { grade: "EE", min: 80.0, max: 100.0, points: 4, comment: "Well above expected standard." },
  { grade: "ME", min: 50.0, max: 79.99, points: 3, comment: "At expected standard level." },
  { grade: "AE", min: 40.0, max: 49.99, points: 2, comment: "On track, needs support." },
  { grade: "BE", min: 0.0, max: 39.99, points: 1, comment: "Below expected standard level." },
];

function SubjectsContent() {
  const { data, loading, error, refetch } = useAsync(() => api.getSubjects(), []);
  const [dialog, setDialog] = useState(null);
  const [gradeFilter, setGradeFilter] = useState("all");

  const subjects = Array.isArray(data) ? data : [];
  const visible = subjects.filter(
    (s) => gradeFilter === "all" || (s.gradeLevels || []).includes(gradeFilter),
  );

  return (
    <>
      <PageHeader title="Subjects" subtitle="Add subjects, choose grades, and define grading scales" />
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          select
          size="small"
          label="Show subjects for"
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">All grades</MenuItem>
          {GRADE_LEVELS.map((g) => (
            <MenuItem key={g} value={g}>
              {g}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={() => setDialog({ mode: "create" })}>
          Add subject
        </Button>
      </Box>

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() => (
          <Card>
            <CardContent sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Learning area</TableCell>
                    <TableCell>Offered in</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.code}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.learningArea || "-"}</TableCell>
                      <TableCell>
                        {(s.gradeLevels || []).length === 0 ? (
                          <Chip size="small" color="warning" label="No grade selected" />
                        ) : (
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            {sortGrades(s.gradeLevels).map((g) => (
                              <Chip key={g} size="small" label={g} />
                            ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{s.isCore ? "Core" : "Optional"}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => setDialog({ mode: "edit", subject: s })}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visible.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">
                          No subjects yet. Use "Add subject" to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </DataState>

      {dialog && (
        <SubjectDialog
          dialog={dialog}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

function SubjectDialog({ dialog, onClose, onSaved }) {
  const { showNotification } = useNotification();
  const editing = dialog.mode === "edit";
  const existing = dialog.subject;

  const [form, setForm] = useState({
    name: editing ? existing.name : "",
    code: editing ? existing.code : "",
    description: editing ? existing.description || "" : "",
    learningArea: editing ? existing.learningArea || "" : "",
    isCore: editing ? existing.isCore : true,
    gradeLevels: editing ? existing.gradeLevels || [] : [],
    gradingScale: editing ? (existing.gradingScale || DEFAULT_GRADING_SCALE) : [...DEFAULT_GRADING_SCALE],
  });
  const [saving, setSaving] = useState(false);

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function toggleGrade(grade) {
    const has = form.gradeLevels.includes(grade);
    setForm({
      ...form,
      gradeLevels: has ? form.gradeLevels.filter((g) => g !== grade) : [...form.gradeLevels, grade],
    });
  }

  function updateGradingScale(index, field, value) {
    const newScale = [...form.gradingScale];
    newScale[index] = { ...newScale[index], [field]: value };
    setForm({ ...form, gradingScale: newScale });
  }

  const gradeOptions = [
    ...GRADE_LEVELS,
    ...form.gradeLevels.filter((g) => !GRADE_LEVELS.includes(g)),
  ];

  async function save() {
    if (!form.name.trim() || !form.code.trim()) {
      showNotification("Subject name and code are required", "error");
      return;
    }
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      learningArea: form.learningArea.trim() || null,
      isCore: form.isCore,
      gradeLevels: form.gradeLevels,
      gradingScale: form.gradingScale,
    };

    setSaving(true);
    try {
      if (editing) {
        await api.updateSubject(existing.id, payload);
      } else {
        await api.createSubject(payload);
      }
      showNotification(editing ? "Subject updated" : "Subject added", "success");
      onSaved();
    } catch (e) {
      showNotification(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{editing ? `Edit ${existing.name}` : "Add subject"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, pt: 1 }}>
          <TextField label="Subject name" size="small" value={form.name} onChange={setField("name")} />
          <TextField label="Code" size="small" value={form.code} onChange={setField("code")} helperText="Must be unique, for example MATH" />
          <TextField label="Learning area" size="small" value={form.learningArea} onChange={setField("learningArea")} />
          <FormControlLabel
            control={<Checkbox checked={form.isCore} onChange={(e) => setForm({ ...form, isCore: e.target.checked })} />}
            label="Core subject"
          />
          <TextField
            label="Description"
            size="small"
            multiline
            rows={2}
            value={form.description}
            onChange={setField("description")}
            sx={{ gridColumn: { sm: "1 / -1" } }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 3, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Offered in these grades</Typography>
          <Button size="small" onClick={() => setForm({ ...form, gradeLevels: gradeOptions })}>Select all</Button>
          <Button size="small" onClick={() => setForm({ ...form, gradeLevels: [] })}>Clear</Button>
        </Box>
        <FormGroup row>
          {gradeOptions.map((g) => (
            <FormControlLabel
              key={g}
              control={<Checkbox size="small" checked={form.gradeLevels.includes(g)} onChange={() => toggleGrade(g)} />}
              label={g}
            />
          ))}
        </FormGroup>

        {/* Grading Scale Editor */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Grading Scale</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Grade</TableCell>
                <TableCell align="right">Min %</TableCell>
                <TableCell align="right">Max %</TableCell>
                <TableCell align="right">Points</TableCell>
                <TableCell>Default Comment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {form.gradingScale.map((row, index) => (
                <TableRow key={row.grade}>
                  <TableCell>
                    <TextField size="small" value={row.grade} onChange={(e) => updateGradingScale(index, "grade", e.target.value)} sx={{ width: 60 }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" type="number" value={row.min} onChange={(e) => updateGradingScale(index, "min", Number(e.target.value))} sx={{ width: 80 }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" type="number" value={row.max} onChange={(e) => updateGradingScale(index, "max", Number(e.target.value))} sx={{ width: 80 }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" type="number" value={row.points} onChange={(e) => updateGradingScale(index, "points", Number(e.target.value))} sx={{ width: 60 }} />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.comment}
                      onChange={(e) => updateGradingScale(index, "comment", e.target.value)}
                      fullWidth
                      placeholder="e.g., Well above expected standard."
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
