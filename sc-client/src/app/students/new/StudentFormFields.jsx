"use client";

import { useState } from "react";
import { Alert, Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { api } from "@/lib/api";

const PHONE_FORMAT = /^(07|01)\d{8}$/;
const EMAIL_FORMAT = /^\S+@\S+\.\S+$/;

const twoColumns = { display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } };
const dateProps = { type: "date", slotProps: { inputLabel: { shrink: true } } };


function createEmptyParent() {
  return { name: "", phone: "", email: "", match: null, linkedId: null };
}


export const studentSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  dateOfBirth: z.string().min(1, "Required"),
  homeLocation: z.string().min(2, "Required"),
  classId: z.string().min(1, "Select a class"),
  admissionNumber: z.string().min(1, "Required"),
  admissionDate: z.string().min(1, "Required"),
});

export function createEmptyForm() {
  return {
    photo: "", // "" = no photo, a web address = existing photo, a File = newly chosen photo
    photoPreview: "",
    firstName: "",
    lastName: "",
    otherName: "",
    gender: "Male",
    dateOfBirth: "",
    birthCertNumber: "",
    homeLocation: "",
    classId: "",
    admissionNumber: "", // filled in automatically by the page, but the clerk can change it
    admissionDate: new Date().toISOString().slice(0, 10),
    father: createEmptyParent(),
    mother: createEmptyParent(),
  };
}

// Fills the form with an existing student's details (used when editing).
export function formFromStudent(s) {
  const getParent = (role) => {
    const p = (s.parents || []).find((parent) => parent.relationship === role);
    if (!p) return createEmptyParent();
    return {
      id: p.id,
      name: p.name || "",
      phone: p.phone || "",
      email: p.email || "",
      match: null,
      linkedId: null, // Let them edit the details
    };
  };

  return {
    photo: s.photo || "",
    photoPreview: s.photo || "",
    firstName: s.firstName,
    lastName: s.lastName,
    otherName: s.otherName || "",
    gender: s.gender,
    dateOfBirth: s.dateOfBirth,
    birthCertNumber: s.birthCertNumber || "",
    homeLocation: s.homeLocation || "",
    classId: s.classId,
    admissionNumber: s.admissionNumber || "",
    admissionDate: s.admissionDate,
    father: getParent("father"),
    mother: getParent("mother"),
  };
}


// Checks the form and returns an object of error messages. Empty object = all good.
// isNew = admitting a new student (parents are only entered at admission).
export function validateForm(form, isNew) {
  const errors = {};

  if (form.firstName.trim().length < 2) errors.firstName = "Required";
  if (form.lastName.trim().length < 2) errors.lastName = "Required";
  if (!form.dateOfBirth) errors.dateOfBirth = "Required";
  if (form.homeLocation.trim().length < 2) errors.homeLocation = "Required";
  if (!form.classId) errors.classId = "Select a class";
  if (!form.admissionDate) errors.admissionDate = "Required";
  if (!form.admissionNumber.trim()) errors.admissionNumber = "Required";

  if (form.photo instanceof File) {
    if (form.photo.size > 2000000) errors.photo = "Max image size is 2MB.";
    else if (!["image/jpeg", "image/png"].includes(form.photo.type))
      errors.photo = "Only .jpg and .png formats are supported.";
  }

  // A parent counts as "filled in" once they have a name or a phone.
  const filledParents = ["father", "mother"].filter(
    (role) => form[role].name.trim() || form[role].phone.trim(),
  );

  for (const role of filledParents) {
    const parent = form[role];
    if (parent.name.trim().length < 2) errors[`${role}Name`] = "Required";
    if (!PHONE_FORMAT.test(parent.phone)) errors[`${role}Phone`] = "Use format 07XXXXXXXX";
    if (parent.email.trim() && !EMAIL_FORMAT.test(parent.email.trim()))
      errors[`${role}Email`] = "Enter a valid email";
  }

  if (filledParents.length === 0) {
    errors.parents = "Enter at least one parent's details.";
  } else if (!filledParents.some((role) => form[role].email.trim())) {
    errors.emails = "Enter an email for at least one parent. It is used to reset passwords.";
  }

  return errors;
}

// A TextField connected to one value in the form.
function Field({ form, setForm, errors, name, label, hint, ...props }) {
  return (
    <TextField
      label={label}
      size="small"
      value={form[name]}
      onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
      error={!!errors[name]}
      helperText={errors[name] || hint}
      {...props}
    />
  );
}

function PhotoPicker({ form, setForm, errors }) {
  function choosePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({ ...f, photo: file, photoPreview: URL.createObjectURL(file) }));
  }

  function removePhoto() {
    setForm((f) => ({ ...f, photo: "", photoPreview: "" }));
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
      <Box
        sx={{
          width: 120,
          height: 150, // 4:5 passport size
          bgcolor: "action.hover",
          border: "1px dashed",
          borderColor: errors.photo ? "error.main" : "divider",
          borderRadius: 1,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          "&:hover .photo-overlay": { opacity: 1 },
        }}
      >
        {form.photoPreview ? (
          <img
            src={form.photoPreview}
            alt="Student"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <PhotoCameraIcon color={errors.photo ? "error" : "action"} fontSize="large" />
        )}

        <Box
          className="photo-overlay"
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.2s",
          }}
        >
          <Button component="label" variant="text" sx={{ color: "white" }}>
            Upload
            <input type="file" hidden accept="image/jpeg, image/png" onChange={choosePhoto} />
          </Button>
        </Box>
      </Box>

      <Box>
        <Typography
          variant="body2"
          color={errors.photo ? "error" : "text.secondary"}
          sx={{ mb: 1 }}
        >
          {errors.photo || "Upload passport-sized photo (approx. 4x5)"}
        </Typography>
        {form.photo && (
          <Button size="small" color="error" onClick={removePhoto}>
            Remove Photo
          </Button>
        )}
      </Box>
    </Box>
  );
}

// One parent (role is "father" or "mother").
// The phone number comes first: it is the parent's login, and we use it to find
// out whether this parent already has another child in the school.
function ParentFields({ role, title, form, setForm, errors }) {
  const parent = form[role];
  const [checking, setChecking] = useState(false);

  function updateParent(changes) {
    setForm((f) => ({ ...f, [role]: { ...f[role], ...changes } }));
  }

  async function lookForExistingParent() {
    if (!PHONE_FORMAT.test(parent.phone) || parent.linkedId) return;

    setChecking(true);
    try {
      const match = await api.findParentByPhone(parent.phone);
      updateParent({ match: match || null });
    } catch {
      // If the lookup fails the clerk can still continue. The server checks again when saving.
    }
    setChecking(false);
  }

  function linkToExistingParent() {
    updateParent({
      name: parent.match.name,
      email: parent.match.email || "",
      linkedId: parent.match.id,
    });
  }

  function unlink() {
    updateParent({ name: "", email: "", match: null, linkedId: null });
  }

  const children = parent.match?.children || [];

  return (
    <Box>
      <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
        {title}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Phone (login)"
          size="small"
          placeholder="0712345678"
          value={parent.phone}
          onChange={(e) => updateParent({ phone: e.target.value, match: null, linkedId: null })}
          onBlur={lookForExistingParent}
          error={!!errors[`${role}Phone`]}
          helperText={
            errors[`${role}Phone`] || (checking ? "Checking for an existing parent…" : "")
          }
        />

        {parent.match && !parent.linkedId && (
          <Alert
            severity="info"
            action={
              <Button color="inherit" size="small" onClick={linkToExistingParent}>
                Link
              </Button>
            }
          >
            Existing parent found: {parent.match.name}.
            {children.length > 0 &&
              ` Already has: ${children.map((c) => `${c.name} (${c.className})`).join(", ")}.`}
          </Alert>
        )}

        {parent.linkedId && (
          <Alert
            severity="success"
            action={
              <Button color="inherit" size="small" onClick={unlink}>
                Undo
              </Button>
            }
          >
            Linked to {parent.name}. No new account will be created.
          </Alert>
        )}

        <TextField
          label="Full Name"
          size="small"
          value={parent.name}
          onChange={(e) => updateParent({ name: e.target.value })}
          disabled={!!parent.linkedId}
          error={!!errors[`${role}Name`]}
          helperText={errors[`${role}Name`]}
        />

        <TextField
          label="Email (for password reset)"
          size="small"
          value={parent.email}
          onChange={(e) => updateParent({ email: e.target.value })}
          disabled={!!parent.linkedId && !!parent.match?.email}
          error={!!errors[`${role}Email`]}
          helperText={errors[`${role}Email`]}
        />
      </Box>
    </Box>
  );
}

export function StudentFormFields({ form, setForm, errors, classesData = [], isNew = false }) {
  const fieldProps = { form, setForm, errors };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Bio Data */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Bio Data
        </Typography>
        <Box sx={twoColumns}>
          <Box sx={{ gridColumn: "1 / -1" }}>
            <PhotoPicker {...fieldProps} />
          </Box>
          <Field {...fieldProps} name="firstName" label="First Name" />
          <Field {...fieldProps} name="lastName" label="Last Name" />
          <Field {...fieldProps} name="otherName" label="Other Name" />
          <Field {...fieldProps} name="gender" label="Gender" select>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </Field>
          <Field {...fieldProps} name="dateOfBirth" label="Date of Birth" {...dateProps} />
          <Field {...fieldProps} name="birthCertNumber" label="Birth Cert. Number" />
          <Field {...fieldProps} name="homeLocation" label="Home Location" />
        </Box>
      </Box>

      {/* Class & Boarding */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Class & Admission
        </Typography>
        <Box sx={twoColumns}>
          <Field {...fieldProps} name="classId" label="Class" select>
            {classesData.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Field>
          <Field
            {...fieldProps}
            name="admissionNumber"
            label="Admission Number"
            disabled={!isNew}
            hint={isNew ? "Suggested automatically. You can change it." : "Cannot be changed after admission."}
          />
          <Field {...fieldProps} name="admissionDate" label="Admission Date" {...dateProps} disabled={!isNew} />
        </Box>
      </Box>

      {/* Parents Section */}
      <ParentsSection {...fieldProps} />
    </Box>
  );
}

function ParentsSection({ form, setForm, errors }) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
        Parents
      </Typography>
      <Box sx={twoColumns}>
        <ParentFields role="father" title="Father" form={form} setForm={setForm} errors={errors} />
        <ParentFields role="mother" title="Mother" form={form} setForm={setForm} errors={errors} />
      </Box>

      {errors.parents && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
          {errors.parents}
        </Typography>
      )}

      {errors.emails && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
          {errors.emails}
        </Typography>
      )}
    </Box>
  );
}
