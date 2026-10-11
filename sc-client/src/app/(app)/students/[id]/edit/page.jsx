"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  Stack,
  TextField,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Grid,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { studentApi } from "@/lib/studentApi";
import { academicsApi } from "@/lib/academicsApi";

export default function EditStudentPage() {
  return (
   
      <PageGuard permission="students.manage">
        <EditStudentContent />
      </PageGuard>

  );
}

function EditStudentContent() {
  const { id } = useParams();
  const router = useRouter();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { data, loading, error, refetch } = useAsync(async () => {
    const [student, classes, enrollments] = await Promise.all([
      studentApi.getStudent(id),
      academicsApi.getClasses({ current: 1 }),
      studentApi.getStudentEnrollments(id),
    ]);
    return {
      student,
      classes: Array.isArray(classes) ? classes : [],
      enrollments: Array.isArray(enrollments) ? enrollments : [],
    };
  }, [id]);

  const student = data?.student;
  const classes = data?.classes ?? [];
  const enrollments = data?.enrollments ?? [];
  const activeEnrollment = enrollments.find((e) => e.status === "active");

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    otherName: "",
    admissionNumber: "",
    gender: "",
    dateOfBirth: "",
    classId: "",
    nemisNumber: "",
    birthCertNumber: "",
    homeLocation: "",
    healthInfo: "",
  });

  // Parent form state — array of parents (existing + new additions)
  const [parents, setParents] = useState([]);

  // Hydrate once the student loads
  useEffect(() => {
    if (!student || hydrated) return;
    setForm({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      otherName: student.otherName || "",
      admissionNumber: student.admissionNumber || "",
      gender: student.gender || "",
      dateOfBirth: student.dateOfBirth || "",
      classId: student.classId || "",
      nemisNumber: student.nemisNumber || "",
      birthCertNumber: student.birthCertNumber || "",
      homeLocation: student.homeLocation || "",
      healthInfo: student.health_info || "",
    });
    setParents(
      (student.parents || []).map((p) => ({
        id: p.id,
        existingParentId: p.existingParentId ?? p.id ?? null,
        name: p.name || "",
        phone: p.phone || "",
        email: p.email || "",
        relationship: p.relationship || "guardian",
        _new: false,
      })),
    );
    setHydrated(true);
  }, [student, hydrated]);

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleParentChange = (index, field, value) =>
    setParents((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

  const addParent = () =>
    setParents((prev) => [
      ...prev,
      {
        id: null,
        existingParentId: null,
        name: "",
        phone: "",
        email: "",
        relationship: "guardian",
        _new: true,
      },
    ]);

  const removeParent = (index) => setParents((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (!form.admissionNumber.trim()) return "Admission number is required";
    if (!form.gender) return "Gender is required";
    if (!form.dateOfBirth) return "Date of birth is required";

    for (const [i, p] of parents.entries()) {
      const nameOk = p.name.trim().length > 0;
      const phoneOk = p.phone.trim().length > 0;
      if (!nameOk && !phoneOk) {
        return `Parent ${i + 1}: enter a name or a phone number`;
      }
      if (phoneOk && !/^(0|254)?[17]\d{8}$/.test(p.phone.replace(/\s/g, ""))) {
        return `Parent ${i + 1}: phone must be a valid Kenyan number`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) return notify(err, "error");

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        otherName: form.otherName.trim() || null,
        admissionNumber: form.admissionNumber.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        nemisNumber: form.nemisNumber.trim() || null,
        birthCertNumber: form.birthCertNumber.trim() || null,
        homeLocation: form.homeLocation.trim() || null,
        health_info: form.healthInfo.trim() || "",
        // Parents — the serializer expects `parents_data`. We do NOT send
        // classId here; the backend rejects class changes on PATCH by design.
        parents_data: parents.map((p) => ({
          existingParentId: p.existingParentId || undefined,
          name: p.name.trim(),
          phone: p.phone.trim(),
          email: p.email.trim() || "",
          relationship: p.relationship,
        })),
      };

      await studentApi.updateStudent(id, payload);
      notify("Student updated");
      refetch();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === form.classId);

  return (
    <>
      <PageHeader
        title={student ? `Edit ${student.firstName} ${student.lastName}` : "Edit student"}
        subtitle={student ? `Admission ${student.admissionNumber}` : ""}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push(`/students/${id}`)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || loading || !hydrated}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </Stack>
        }
      />

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() => (
          <Stack spacing={3}>
            {/* Class and enrollment — read-only */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Enrollment
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {activeEnrollment ? (
                <Alert severity="info" icon={false}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ sm: "center" }}
                  >
                    <Typography variant="body2">
                      Currently enrolled in <strong>{activeEnrollment.className}</strong> (
                      {activeEnrollment.gradeLevel}) for{" "}
                      <strong>{activeEnrollment.academicYearName}</strong>.
                    </Typography>
                    <Chip
                      size="small"
                      label="Active"
                      color="success"
                      sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    To change this student's class, close the current enrollment and create a new
                    one from the student's profile page.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="warning">
                  No active enrollment found. The student may not be placed in a class yet.
                </Alert>
              )}

              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Class"
                  value={selectedClass?.name || activeEnrollment?.className || ""}
                  fullWidth
                  disabled
                  helperText="Class changes go through the enrollment, not this form."
                />
              </Box>
            </Card>

            {/* Student details */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Student details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="First name"
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Last name"
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Other name (optional)"
                    value={form.otherName}
                    onChange={(e) => handleChange("otherName", e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Admission number"
                    value={form.admissionNumber}
                    onChange={(e) => handleChange("admissionNumber", e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={form.gender}
                      label="Gender"
                      onChange={(e) => handleChange("gender", e.target.value)}
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Date of birth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Home location (optional)"
                    value={form.homeLocation}
                    onChange={(e) => handleChange("homeLocation", e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="NEMIS number (optional)"
                    value={form.nemisNumber}
                    onChange={(e) => handleChange("nemisNumber", e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Birth certificate number (optional)"
                    value={form.birthCertNumber}
                    onChange={(e) => handleChange("birthCertNumber", e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Health information (optional)"
                    value={form.healthInfo}
                    onChange={(e) => handleChange("healthInfo", e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Card>

            {/* Parents */}
            <Card sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6">Parents / guardians</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add or remove parents. Removing a parent unlinks them from this student but does
                    not delete the parent's user account.
                  </Typography>
                </Box>
                <Button size="small" onClick={addParent}>
                  + Add parent
                </Button>
              </Stack>
              <Divider sx={{ my: 3 }} />

              {parents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No parent or guardian linked. Use “Add parent” to link one.
                </Typography>
              ) : (
                <Stack spacing={3}>
                  {parents.map((p, i) => (
                    <Box
                      key={p.id ?? `new-${i}`}
                      sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="subtitle2">
                          {p._new ? "New parent" : p.name || `Parent ${i + 1}`}
                          {p.existingParentId && (
                            <Chip size="small" label="Linked" variant="outlined" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Button size="small" color="error" onClick={() => removeParent(i)}>
                          Remove
                        </Button>
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Name"
                            value={p.name}
                            onChange={(e) => handleParentChange(i, "name", e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Phone"
                            value={p.phone}
                            onChange={(e) => handleParentChange(i, "phone", e.target.value)}
                            fullWidth
                            placeholder="07XXXXXXXX"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Relationship</InputLabel>
                            <Select
                              value={p.relationship}
                              label="Relationship"
                              onChange={(e) =>
                                handleParentChange(i, "relationship", e.target.value)
                              }
                            >
                              <MenuItem value="father">Father</MenuItem>
                              <MenuItem value="mother">Mother</MenuItem>
                              <MenuItem value="guardian">Guardian</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Email (optional)"
                            value={p.email}
                            onChange={(e) => handleParentChange(i, "email", e.target.value)}
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              )}
            </Card>

            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button color="inherit" onClick={() => router.push(`/students/${id}`)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving || !hydrated}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </Stack>
          </Stack>
        )}
      </DataState>

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
