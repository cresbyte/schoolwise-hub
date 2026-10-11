"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert, Box, Button, Card, Stack, TextField, Typography, Divider,
  FormControl, InputLabel, Select, MenuItem, Snackbar, Grid,
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

export default function NewStudentPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="students.manage">
        <NewStudentContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function NewStudentContent() {
  const router = useRouter();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useAsync(async () => {
    const classes = await academicsApi.getClasses({ current: 1 });
    return { classes: Array.isArray(classes) ? classes : [] };
  }, []);

  const classes = data?.classes ?? [];

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

  const [parentForm, setParentForm] = useState({
    name: "",
    phone: "",
    relationship: "guardian",
    email: "",
  });

  const [addParent, setAddParent] = useState(false);

  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleParentChange = (field, value) =>
    setParentForm((prev) => ({ ...prev, [field]: value }));

  const selectedClass = classes.find((c) => c.id === form.classId);

  const validate = () => {
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (!form.admissionNumber.trim()) return "Admission number is required";
    if (!form.gender) return "Gender is required";
    if (!form.dateOfBirth) return "Date of birth is required";
    if (!form.classId) return "Class is required to admit a student";
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
        classId: form.classId,
        nemisNumber: form.nemisNumber.trim() || null,
        birthCertNumber: form.birthCertNumber.trim() || null,
        homeLocation: form.homeLocation.trim() || null,
        health_info: form.healthInfo.trim() || "",
        parents_data: addParent && parentForm.name.trim()
          ? [{
              name: parentForm.name.trim(),
              phone: parentForm.phone.trim(),
              relationship: parentForm.relationship,
              email: parentForm.email.trim(),
            }]
          : [],
      };

      const student = await studentApi.createStudent(payload);
      notify("Student admitted and enrolled");
      router.push(`/students/${student.id}`);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Admit a student"
        subtitle="The student will be enrolled in the current academic year automatically."
        actions={
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/students")}
          >
            Cancel
          </Button>
        }
      />

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() => (
          <>
            {classes.length === 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                No classes exist in the current academic year. Create a class first,
                then come back to admit students.
              </Alert>
            )}

            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Student details</Typography>
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
                    helperText="The school's own admission number for this student."
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
                  <FormControl fullWidth required>
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={form.classId}
                      label="Class"
                      onChange={(e) => handleChange("classId", e.target.value)}
                    >
                      {classes.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} ({c.gradeLevel} · {c.academicYearName})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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

              {selectedClass && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  This student will be enrolled in{" "}
                  <strong>{selectedClass.name}</strong> for{" "}
                  <strong>{selectedClass.academicYearName}</strong>.
                </Alert>
              )}
            </Card>

            <Card sx={{ p: 3, mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Parent / guardian</Typography>
                <Button
                  size="small"
                  onClick={() => setAddParent((v) => !v)}
                >
                  {addParent ? "Remove parent" : "Add parent"}
                </Button>
              </Stack>
              <Divider sx={{ my: 2 }} />

              {!addParent ? (
                <Typography variant="body2" color="text.secondary">
                  No parent added. You can add one now or later from the student profile.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Parent name"
                      value={parentForm.name}
                      onChange={(e) => handleParentChange("name", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone number"
                      value={parentForm.phone}
                      onChange={(e) => handleParentChange("phone", e.target.value)}
                      fullWidth
                      placeholder="07XXXXXXXX"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Relationship</InputLabel>
                      <Select
                        value={parentForm.relationship}
                        label="Relationship"
                        onChange={(e) => handleParentChange("relationship", e.target.value)}
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
                      value={parentForm.email}
                      onChange={(e) => handleParentChange("email", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              )}
            </Card>

            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button color="inherit" onClick={() => router.push("/students")}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving || classes.length === 0}
              >
                {saving ? "Saving…" : "Admit student"}
              </Button>
            </Stack>
          </>
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
