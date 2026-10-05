"use client";

import { useNotification } from "@/context/NotificationContext";
import { useClasses } from "@/hooks/domain";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  StudentFormFields,
  createEmptyForm,
  formFromStudent,
  validateForm,
} from "./StudentFormFields";

// Temporary: replace this with a call to the backend when it can give the next number.
function suggestAdmissionNumber() {
  return (1 + Math.floor(Math.random() * 100000)).toString().padStart(5, "0");
}

/**
 * One form for admitting a new student and for editing an existing one.
 *  - No `student`: admitting a new student (parents are filled in, admission number is suggested).
 *  - `student` given: editing that student.
 * `onSave` receives the data, ready to send to the API.
 */
export function StudentForm({ student, onSave, submitLabel, cancelPath }) {
  const router = useRouter();
  const { showNotification } = useNotification();
  const classes = useClasses();
  const isNew = !student;

  // New student: an empty form with a suggested admission number (the clerk can change it).
  // Existing student: the form filled with their details.
  const [form, setForm] = useState(() =>
    student
      ? formFromStudent(student)
      : { ...createEmptyForm(), admissionNumber: suggestAdmissionNumber() },
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Confirmation dialog: list of role strings ("father"/"mother") whose phone matched an
  // existing parent but were not explicitly linked before the clerk clicked Save.
  const [pendingConfirm, setPendingConfirm] = useState(null); // null | { conflicts, currentForm }

  function buildData(currentForm) {
    const selectedClass = (classes.data ?? []).find((c) => c.id === currentForm.classId);

    const data = {
      firstName: currentForm.firstName,
      lastName: currentForm.lastName,
      otherName: currentForm.otherName,
      gender: currentForm.gender,
      dateOfBirth: currentForm.dateOfBirth,
      birthCertNumber: currentForm.birthCertNumber,
      homeLocation: currentForm.homeLocation,
      classId: currentForm.classId,
      className: selectedClass?.name ?? student?.className,
      gradeLevel: selectedClass?.gradeLevel ?? student?.gradeLevel,
      admissionNumber: currentForm.admissionNumber.trim(),
      admissionDate: currentForm.admissionDate,
      photo: currentForm.photo,
    };

    // Only send the parents that were filled in.
    data.parents = ["father", "mother"]
      .filter((role) => currentForm[role].name.trim() || currentForm[role].phone.trim())
      .map((role) => ({
        id: currentForm[role].id,
        relationship: role,
        existingParentId: currentForm[role].linkedId, // null = create a new parent account
        name: currentForm[role].name.trim(),
        phone: currentForm[role].phone,
        email: currentForm[role].email.trim(),
      }));

    return data;
  }

  async function doSave(currentForm) {
    setSaving(true);
    try {
      await onSave(buildData(currentForm));
    } catch (error) {
      showNotification(error.message || "Could not save. Please try again.", "error");
    }
    setSaving(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const foundErrors = validateForm(form, isNew);
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) return;

    // Find parents whose phone matched an existing record on blur but were never explicitly linked.
    // We pause here and ask the clerk whether it's actually the same person.
    const conflicts = ["father", "mother"].filter(
      (role) =>
        form[role].match !== null &&    // a match was returned by the server
        form[role].linkedId === null &&  // but the clerk did not click "Link"
        (form[role].name.trim() || form[role].phone.trim()), // parent section is filled in
    );

    if (conflicts.length > 0) {
      setPendingConfirm({ conflicts, currentForm: form });
      return;
    }

    await doSave(form);
  }

  // User confirmed that the matched parent IS the same person → auto-link and save.
  async function handleConfirmLink() {
    const { conflicts, currentForm } = pendingConfirm;
    setPendingConfirm(null);

    let resolvedForm = { ...currentForm };
    for (const role of conflicts) {
      const match = resolvedForm[role].match;
      resolvedForm = {
        ...resolvedForm,
        [role]: {
          ...resolvedForm[role],
          name: match.name,
          email: match.email || resolvedForm[role].email,
          linkedId: match.id,
        },
      };
    }
    setForm(resolvedForm);
    await doSave(resolvedForm);
  }

  // User said the matched parent is NOT the same person → block save, ask for a different number.
  function handleDenyLink() {
    const { conflicts } = pendingConfirm;
    setPendingConfirm(null);
    const labels = conflicts.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(" and ");
    showNotification(
      `The phone number for ${labels} is already registered to a different parent. Please use a different number.`,
      "error",
    );
  }

  const conflicts = pendingConfirm?.conflicts ?? [];

  return (
    <>
      <Card>
        <CardContent>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <StudentFormFields
              form={form}
              setForm={setForm}
              errors={errors}
              classesData={classes.data ?? []}
              isNew={isNew}
            />

            <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
              <Button onClick={() => router.push(cancelPath)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving…" : submitLabel}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation dialog shown when a parent phone matches an existing account */}
      <Dialog
        open={!!pendingConfirm}
        onClose={() => setPendingConfirm(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Existing account found</DialogTitle>
        <DialogContent dividers>
          {conflicts.map((role) => {
            const match = pendingConfirm?.currentForm[role]?.match;
            const enteredName = pendingConfirm?.currentForm[role]?.name?.trim();
            const phone = pendingConfirm?.currentForm[role]?.phone;
            const children = match?.children ?? [];
            const isStaff = match?.role && match.role !== "parent";
            return (
              <Box key={role} sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>
                    {role.charAt(0).toUpperCase() + role.slice(1)} ({phone}):
                  </strong>{" "}
                  {isStaff ? (
                    <>
                      A <strong>staff member</strong> named <strong>{match?.name}</strong> (
                      {match.role}) is already registered with this phone number.
                    </>
                  ) : (
                    <>
                      A parent named <strong>{match?.name}</strong> is already registered with this
                      phone number.
                    </>
                  )}
                  {children.length > 0 &&
                    ` They are linked to: ${children.map((c) => `${c.name} (${c.className})`).join(", ")}.`}
                </Typography>
                {isStaff && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    Linking will connect their existing staff account to this student. Their role will remain unchanged.
                  </Typography>
                )}
                {enteredName && enteredName.toLowerCase() !== match?.name?.toLowerCase() && (
                  <Typography variant="caption" color="text.secondary">
                    You entered "{enteredName}" but the registered name is "{match?.name}".
                  </Typography>
                )}
              </Box>
            );
          })}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Is this the same person?
            <br />
            • <strong>Yes, link</strong> — connects the existing account to this student (no new
            account created).
            <br />
            • <strong>No</strong> — cancels saving so you can correct the phone number.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDenyLink} color="error">
            No — use a different number
          </Button>
          <Button onClick={handleConfirmLink} variant="contained">
            Yes, link
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
