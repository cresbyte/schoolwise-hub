"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SaveIcon from "@mui/icons-material/Save";
import TuneIcon from "@mui/icons-material/Tune";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { GRADE_LEVELS } from "@/lib/constants";

const CURRICULUM_OPTIONS = [
  { value: "CBC", label: "CBC (Competency Based)" },
  { value: "844", label: "8-4-4 (Legacy)" },
];

// Default grading templates per curriculum
const DEFAULT_GRADING = {
  CBC: [
    { grade: "EE", min: 76, max: 100, color: "#2e7d32", comment: "Exceeds Expectations — excellent mastery of the learning outcomes." },
    { grade: "ME", min: 51, max: 75, color: "#8bc34a", comment: "Meets Expectations — good understanding with minor gaps." },
    { grade: "AE", min: 26, max: 50, color: "#ff9800", comment: "Approaching Expectations — progressing but needs more support." },
    { grade: "BE", min: 0, max: 25, color: "#c62828", comment: "Below Expectations — requires intensive intervention." },
  ],
  "844": [
    { grade: "A", min: 80, max: 100, color: "#2e7d32", comment: "Excellent performance." },
    { grade: "B", min: 60, max: 79, color: "#8bc34a", comment: "Good performance." },
    { grade: "C", min: 50, max: 59, color: "#ff9800", comment: "Average performance, needs improvement." },
    { grade: "D", min: 40, max: 49, color: "#e64a19", comment: "Below average, requires support." },
    { grade: "E", min: 0, max: 39, color: "#c62828", comment: "Poor performance, needs urgent intervention." },
  ],
};

export default function GradeSubjectSetupPage() {
  return (
    <DashboardLayout>
      <SetupContent />
    </DashboardLayout>
  );
}

function SetupContent() {
  const { showNotification } = useNotification();
  const [curriculum, setCurriculum] = useState("CBC");
  const [gradeLevel, setGradeLevel] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjectStates, setSubjectStates] = useState({}); // { subjectId: { enabled, gradingSystem, expanded } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null); // subjectId being saved

  // Load subjects whenever curriculum changes
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getSubjects({ curriculum }).then((res) => {
      if (!active) return;
      const subjects = res.results || res || [];
      setAllSubjects(subjects);
      // Build initial state from existing grade_levels and grading_system
      const init = {};
      subjects.forEach((s) => {
        const enabled = gradeLevel ? (s.gradeLevels || s.grade_levels || []).includes(gradeLevel) : false;
        init[s.id] = {
          enabled,
          gradingSystem: s.gradingSystem || s.grading_system || [],
          expanded: false,
        };
      });
      setSubjectStates(init);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [curriculum]);

  // When grade level changes, update enabled flags from each subject's grade_levels
  useEffect(() => {
    if (!gradeLevel || allSubjects.length === 0) return;
    setSubjectStates((prev) => {
      const next = { ...prev };
      allSubjects.forEach((s) => {
        const enabled = (s.gradeLevels || s.grade_levels || []).includes(gradeLevel);
        if (next[s.id]) {
          next[s.id] = { ...next[s.id], enabled };
        }
      });
      return next;
    });
  }, [gradeLevel, allSubjects]);

  const toggleSubject = (subjectId) => {
    setSubjectStates((prev) => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], enabled: !prev[subjectId].enabled },
    }));
  };

  const toggleExpanded = (subjectId) => {
    setSubjectStates((prev) => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], expanded: !prev[subjectId].expanded },
    }));
  };

  const applyDefaultGrading = (subjectId) => {
    setSubjectStates((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        gradingSystem: DEFAULT_GRADING[curriculum].map((r) => ({ ...r })),
      },
    }));
  };

  const updateRule = (subjectId, index, field, value) => {
    setSubjectStates((prev) => {
      const rules = [...(prev[subjectId].gradingSystem || [])];
      rules[index] = { ...rules[index], [field]: value };
      return { ...prev, [subjectId]: { ...prev[subjectId], gradingSystem: rules } };
    });
  };

  const addRule = (subjectId) => {
    setSubjectStates((prev) => {
      const rules = [...(prev[subjectId].gradingSystem || [])];
      rules.push({ grade: "", min: 0, max: 0, color: "#757575", comment: "" });
      return { ...prev, [subjectId]: { ...prev[subjectId], gradingSystem: rules } };
    });
  };

  const removeRule = (subjectId, index) => {
    setSubjectStates((prev) => {
      const rules = (prev[subjectId].gradingSystem || []).filter((_, i) => i !== index);
      return { ...prev, [subjectId]: { ...prev[subjectId], gradingSystem: rules } };
    });
  };

  const saveSubject = async (subject) => {
    if (!gradeLevel) {
      showNotification("Select a grade level before saving", "warning");
      return;
    }
    const state = subjectStates[subject.id];
    setSaving(subject.id);

    try {
      // Compute updated grade_levels list
      const currentLevels = subject.gradeLevels || subject.grade_levels || [];
      let newLevels;
      if (state.enabled) {
        newLevels = currentLevels.includes(gradeLevel) ? currentLevels : [...currentLevels, gradeLevel];
      } else {
        newLevels = currentLevels.filter((l) => l !== gradeLevel);
      }

      await api.updateSubject(subject.id, {
        gradeLevels: newLevels,
        gradingSystem: state.gradingSystem,
      });

      // Update local subject cache
      setAllSubjects((prev) =>
        prev.map((s) =>
          s.id === subject.id
            ? { ...s, gradeLevels: newLevels, gradingSystem: state.gradingSystem }
            : s
        )
      );

      showNotification(`${subject.name} saved successfully`, "success");
    } catch (err) {
      showNotification(err.message || `Failed to save ${subject.name}`, "error");
    } finally {
      setSaving(null);
    }
  };

  const saveAll = async () => {
    if (!gradeLevel) {
      showNotification("Select a grade level before saving", "warning");
      return;
    }
    setSaving("all");
    let successCount = 0;
    let errorCount = 0;

    for (const subject of allSubjects) {
      const state = subjectStates[subject.id];
      if (!state) continue;
      try {
        const currentLevels = subject.gradeLevels || subject.grade_levels || [];
        let newLevels;
        if (state.enabled) {
          newLevels = currentLevels.includes(gradeLevel) ? currentLevels : [...currentLevels, gradeLevel];
        } else {
          newLevels = currentLevels.filter((l) => l !== gradeLevel);
        }
        await api.updateSubject(subject.id, {
          gradeLevels: newLevels,
          gradingSystem: state.gradingSystem,
        });
        setAllSubjects((prev) =>
          prev.map((s) =>
            s.id === subject.id ? { ...s, gradeLevels: newLevels, gradingSystem: state.gradingSystem } : s
          )
        );
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setSaving(null);
    if (errorCount === 0) {
      showNotification(`All ${successCount} subjects saved successfully`, "success");
    } else {
      showNotification(`Saved ${successCount}, failed ${errorCount}`, "warning");
    }
  };

  const enabledCount = Object.values(subjectStates).filter((s) => s.enabled).length;

  return (
    <>
      <PageHeader
        title="Grade Subject Setup"
        subtitle="Configure which subjects apply to each grade level and set their grading systems"
        actions={
          gradeLevel && allSubjects.length > 0 ? (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveAll}
              disabled={saving === "all"}
            >
              {saving === "all" ? "Saving all…" : "Save All Changes"}
            </Button>
          ) : null
        }
      />

      {/* Step 1: Pick curriculum & grade */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>
            Step 1 — Select Curriculum &amp; Grade Level
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              select
              size="small"
              label="Curriculum"
              value={curriculum}
              onChange={(e) => { setCurriculum(e.target.value); setGradeLevel(""); }}
              sx={{ minWidth: 220 }}
            >
              {CURRICULUM_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Grade Level"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              {(GRADE_LEVELS || []).map((g) => (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Step 2: Subject list */}
      {!gradeLevel ? (
        <Alert severity="info" icon={<InfoOutlinedIcon />}>
          Select a curriculum and grade level above to configure its subjects and grading.
        </Alert>
      ) : loading ? (
        <Typography color="text.secondary">Loading subjects…</Typography>
      ) : allSubjects.length === 0 ? (
        <Alert severity="warning">
          No subjects found for <strong>{curriculum}</strong> curriculum. Add subjects first from the Subjects page.
        </Alert>
      ) : (
        <>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{enabledCount}</strong> of <strong>{allSubjects.length}</strong> subjects enabled for <strong>{gradeLevel}</strong>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {allSubjects.map((subject) => {
              const state = subjectStates[subject.id] || { enabled: false, gradingSystem: [], expanded: false };
              return (
                <Card
                  key={subject.id}
                  variant="outlined"
                  sx={{
                    borderColor: state.enabled ? "primary.main" : "divider",
                    transition: "border-color 0.2s",
                    opacity: state.enabled ? 1 : 0.65,
                  }}
                >
                  {/* Subject header row */}
                  <Box sx={{ display: "flex", alignItems: "center", p: 2, gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={state.enabled}
                          onChange={() => toggleSubject(subject.id)}
                          color="primary"
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {subject.name}
                        <Chip size="small" label={subject.code} sx={{ ml: 1, fontFamily: "monospace", fontSize: 11 }} />
                        {subject.isCore && <Chip size="small" label="Core" color="primary" sx={{ ml: 0.5 }} />}
                      </Typography>
                      {subject.learningArea && (
                        <Typography variant="caption" color="text.secondary">{subject.learningArea}</Typography>
                      )}
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        size="small"
                        icon={<TuneIcon sx={{ fontSize: 14 }} />}
                        label={`${state.gradingSystem?.length || 0} grade bands`}
                        variant="outlined"
                        color={state.gradingSystem?.length > 0 ? "success" : "default"}
                      />
                      <Tooltip title={state.expanded ? "Hide grading setup" : "Configure grading"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => toggleExpanded(subject.id)}
                            disabled={!state.enabled}
                          >
                            {state.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => saveSubject(subject)}
                        disabled={saving === subject.id || saving === "all"}
                      >
                        {saving === subject.id ? "Saving…" : "Save"}
                      </Button>
                    </Box>
                  </Box>

                  {/* Expandable grading system editor */}
                  <Collapse in={state.expanded && state.enabled}>
                    <Divider />
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Grading System for {subject.name}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => applyDefaultGrading(subject.id)}
                        >
                          Apply {curriculum} Default
                        </Button>
                      </Box>

                      {state.gradingSystem?.length === 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          No grading bands set. Click &quot;Apply {curriculum} Default&quot; or add bands manually.
                        </Alert>
                      )}

                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Min</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Max</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Preset Comment</TableCell>
                            <TableCell />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(state.gradingSystem || []).map((rule, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={rule.grade}
                                  onChange={(e) => updateRule(subject.id, idx, "grade", e.target.value)}
                                  placeholder="e.g. A"
                                  sx={{ width: 70 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={rule.min}
                                  onChange={(e) => updateRule(subject.id, idx, "min", Number(e.target.value))}
                                  sx={{ width: 70 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={rule.max}
                                  onChange={(e) => updateRule(subject.id, idx, "max", Number(e.target.value))}
                                  sx={{ width: 70 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <input
                                    type="color"
                                    value={rule.color || "#757575"}
                                    onChange={(e) => updateRule(subject.id, idx, "color", e.target.value)}
                                    style={{ width: 32, height: 32, border: "none", padding: 0, cursor: "pointer", borderRadius: 4 }}
                                  />
                                  <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: rule.color || "#757575", border: "1px solid rgba(0,0,0,0.15)" }} />
                                </Box>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  placeholder="Comment shown on report card…"
                                  value={rule.comment || ""}
                                  onChange={(e) => updateRule(subject.id, idx, "comment", e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton size="small" color="error" onClick={() => removeRule(subject.id, idx)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addRule(subject.id)}
                        sx={{ mt: 1.5 }}
                      >
                        Add Grade Band
                      </Button>
                    </CardContent>
                  </Collapse>
                </Card>
              );
            })}
          </Box>

          {allSubjects.length > 0 && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={saveAll}
                disabled={saving === "all"}
              >
                {saving === "all" ? "Saving all subjects…" : "Save All Changes"}
              </Button>
            </Box>
          )}
        </>
      )}
    </>
  );
}
