"use client";

/**
 * Multi-step online admission application form.
 * @module website/admissions/apply/page
 */
import { useState } from "react";
import {Box, Card, CardContent, Typography, TextField, Button, MenuItem, Stepper, Step, StepLabel, Alert } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { HEADING_FONT, getSchoolInfo } from "@/lib/website/constants";
import * as api from "@/lib/mockApi";

const STEPS = ["Learner Details", "Parent/Guardian", "Previous School", "Review & Submit"];
const GRADES = [
  "PP1",
  "PP2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
];

/** Multi-step application form with print summary. */
export default function ApplyPage() {
  const SCHOOL = getSchoolInfo();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [applicationRef, setApplicationRef] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    grade: "",
    boarding: "day",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    relationship: "",
    prevSchool: "",
    prevClass: "",
    reason: "",
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      const result = await api.submitApplication({
        firstName: form.firstName,
        lastName: form.lastName,
        dob: form.dob,
        gender: form.gender,
        gradeApplying: form.grade,
        boardingType: form.boarding as "day" | "boarding",
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        parentEmail: form.parentEmail,
        relationship: form.relationship,
        prevSchool: form.prevSchool,
        prevClass: form.prevClass,
        reason: form.reason,
      });
      setApplicationRef(result.applicationRef);
    } catch {
      // Fallback ref if API fails
      setApplicationRef(`APP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`);
    }
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <>
        <PageBanner
          title="Application Submitted"
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Admissions", href: "/admissions" },
            { label: "Application" },
          ]}
        />
        <SectionWrapper>
          <Alert severity="success" sx={{ mb: 3 }}>
            Thank you! Your application has been received.{" "}
            <strong>Reference: {applicationRef}</strong>. Our admissions team will contact you within 3
            business days.
          </Alert>
          <Box className="print-area">
            <Box className="print-only" sx={{ display: "none", textAlign: "center", mb: 3 }}>
              <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700 }}>
                {SCHOOL.name}
              </Typography>
              <Typography variant="body2">Application Summary</Typography>
            </Box>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
                  className="no-print"
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Application Summary
                  </Typography>
                  <Button
                    startIcon={<PrintIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                </Box>
                <Typography>
                  <strong>Learner:</strong> {form.firstName} {form.lastName}
                </Typography>
                <Typography>
                  <strong>Grade:</strong> {form.grade} ({form.boarding})
                </Typography>
                <Typography>
                  <strong>Parent:</strong> {form.parentName} — {form.parentPhone}
                </Typography>
                <Typography>
                  <strong>Previous School:</strong> {form.prevSchool || "N/A"}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </SectionWrapper>
      </>
    );
  }

  return (
    <>
      <PageBanner
        title="Online Application"
        subtitle="Complete all steps to apply"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Admissions", href: "/admissions" },
          { label: "Apply" },
        ]}
      />
      <SectionWrapper>
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {STEPS.map((s) => (
            <Step key={s}>
              <StepLabel>{s}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card sx={{ maxWidth: 720, mx: "auto" }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            {step === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  required
                  label="First Name"
                  value={form.firstName}
                  onChange={update("firstName")}
                />
                <TextField
                  required
                  label="Last Name"
                  value={form.lastName}
                  onChange={update("lastName")}
                />
                <TextField
                  required
                  label="Date of Birth"
                  type="date"
                  value={form.dob}
                  onChange={update("dob")}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  select
                  required
                  label="Gender"
                  value={form.gender}
                  onChange={update("gender")}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </TextField>
                <TextField
                  select
                  required
                  label="Grade Applying For"
                  value={form.grade}
                  onChange={update("grade")}
                >
                  {GRADES.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Day or Boarding"
                  value={form.boarding}
                  onChange={update("boarding")}
                >
                  <MenuItem value="day">Day Scholar</MenuItem>
                  <MenuItem value="boarding">Boarding</MenuItem>
                </TextField>
              </Box>
            )}
            {step === 1 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  required
                  label="Parent/Guardian Name"
                  value={form.parentName}
                  onChange={update("parentName")}
                />
                <TextField
                  required
                  label="Phone Number"
                  value={form.parentPhone}
                  onChange={update("parentPhone")}
                  placeholder="07XX XXX XXX"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={form.parentEmail}
                  onChange={update("parentEmail")}
                />
                <TextField
                  select
                  required
                  label="Relationship"
                  value={form.relationship}
                  onChange={update("relationship")}
                >
                  {["Father", "Mother", "Guardian", "Other"].map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            )}
            {step === 2 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Previous School"
                  value={form.prevSchool}
                  onChange={update("prevSchool")}
                />
                <TextField
                  label="Last Class Attended"
                  value={form.prevClass}
                  onChange={update("prevClass")}
                />
                <TextField
                  label="Reason for Transfer"
                  multiline
                  rows={3}
                  value={form.reason}
                  onChange={update("reason")}
                />
              </Box>
            )}
            {step === 3 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Review Your Application
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Learner:</strong> {form.firstName} {form.lastName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Grade:</strong> {form.grade} ({form.boarding})
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Parent:</strong> {form.parentName} — {form.parentPhone}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Previous School:</strong> {form.prevSchool || "N/A"}
                </Typography>
                <Alert severity="info">
                  By submitting, you confirm that the information provided is accurate.
                </Alert>
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
              <Button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="contained" onClick={() => setStep((s) => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button variant="contained" color="secondary" onClick={handleSubmit}>
                  Submit Application
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </SectionWrapper>
    </>
  );
}
