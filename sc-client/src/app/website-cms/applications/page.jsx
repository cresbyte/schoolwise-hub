"use client";

import { DataState } from "@/components/DataState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { useNotification } from "@/context/NotificationContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import ApplicationForm from "./ApplicationForm";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema } from "@/components/forms/StudentFormFields";
import { z } from "zod";

import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  IconButton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { useState } from "react";

// Tab index -> backend status value
const TAB_STATUS = ["pending", "offered", "enrolled", "rejected"];

const STATUS_COLORS = {
  pending: "warning",
  interview_scheduled: "info",
  offered: "success",
  enrolled: "success",
  rejected: "error",
  withdrawn: "default",
};

const applicationSchema = studentSchema.extend({
  prevSchool: z.string().optional(),
  prevClass: z.string().optional(),
  curriculum: z.string().optional(),
  nemisNumber: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export default function ApplicationsCmsPage() {
  const [tab, setTab] = useState(0);
  const statusFilter = TAB_STATUS[tab];
  const { data: apps, loading, refetch } = useAsync(() => api.getApplications(statusFilter), [tab]);
  const { data: classes } = useAsync(() => api.getClasses(), []);
  const { showNotification } = useNotification();
  const [viewApp, setViewApp] = useState(null);
  const [busy, setBusy] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isOffering, setIsOffering] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const methods = useForm({
    resolver: zodResolver(applicationSchema),
    mode: "onTouched",
  });

  const openApp = (app) => {
    setViewApp(app);
    setIsEditing(false);
    setIsOffering(false);
    setIsConverting(false);

    // Map application fields to unified student fields and format them safely
    methods.reset({
      photo: app.photo || "",
      firstName: app.firstName || "",
      lastName: app.lastName || "",
      otherName: app.otherName || "",
      gender: app.gender || "Male",
      dateOfBirth: app.dob || app.dateOfBirth || "",
      birthCertNumber: app.birthCertNumber || "",
      homeLocation: app.homeLocation || "",
      classId: app.classId || "",
      boardingStatus: app.boardingType === "boarding" ? "boarding" : "day",
      admissionDate: new Date().toISOString().slice(0, 10),
      fatherName: app.parent?.fatherName || "",
      motherName: app.parent?.motherName || "",
      primaryContactName: app.parentName || app.parent?.primaryContactName || "",
      primaryContactPhone: app.parentPhone || app.parent?.primaryContactPhone || "",
      prevSchool: app.prevSchool || "",
      prevClass: app.prevClass || "",
      curriculum: app.curriculum || "CBC",
      nemisNumber: app.nemisNumber || "",
      reason: app.reason || "",
      notes: app.notes || "",
    });
  };

  const handleFormSubmit = async (data) => {
    setBusy(true);
    try {
      if (isConverting) {
        // Update application first
        const updated = await api.updateApplication(viewApp.id, data);
        // Convert to student
        await api.convertApplication(updated.id, data.classId);
        showNotification("Application details updated and learner converted to student successfully.", "success");
      } else if (isOffering) {
        // Save & Offer
        await api.updateApplication(viewApp.id, data);
        await api.updateApplicationStatus(viewApp.id, "offered");
        showNotification("Application details validated and position offered successfully.", "success");
      } else {
        // Just save edit
        const updated = await api.updateApplication(viewApp.id, data);
        showNotification("Application details updated successfully.", "success");
        setViewApp(updated); // Update view local cache
      }

      setIsEditing(false);
      setIsOffering(false);
      setIsConverting(false);
      if (isConverting || isOffering) {
        setViewApp(null);
      }
      refetch();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = async (id, status) => {
    setBusy(true);
    try {
      await api.updateApplicationStatus(id, status);
      showNotification(`Application marked as ${status.replace("_", " ")}`, "success");
      setViewApp(null);
      refetch();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const classList = Array.isArray(classes) ? classes : [];

  return (
    <DashboardLayout>
      <RoleGuard permission="settings.view">
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Admission Applications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Review online admission submissions, make offers, and enrol accepted learners.
          </Typography>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Pending" />
            <Tab label="Offered" />
            <Tab label="Enrolled" />
            <Tab label="Rejected" />
          </Tabs>

          <DataState loading={loading} data={apps}>
            <TableContainer component={Card}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Learner Name</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Parent</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apps && apps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {app.firstName} {app.lastName}
                      </TableCell>
                      <TableCell>
                        {app.gradeApplying} ({app.boardingType})
                      </TableCell>
                      <TableCell>{app.parentName}</TableCell>
                      <TableCell>{format(new Date(app.submittedAt), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Chip
                          label={app.status.replace("_", " ")}
                          color={STATUS_COLORS[app.status] || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => openApp(app)} size="small" color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {apps && apps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                          No applications in this status.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DataState>
        </Box>

        <Dialog open={!!viewApp} onClose={() => setViewApp(null)} fullWidth maxWidth="md">
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            {isConverting
              ? `Convert Application to Student — ${viewApp?.applicationRef}`
              : isOffering
                ? `Validate Details & Offer Position — ${viewApp?.applicationRef}`
                : `Application Details — ${viewApp?.applicationRef}`}
          </DialogTitle>
          
          <FormProvider {...methods}>
            <form id="application-unified-form" onSubmit={methods.handleSubmit(handleFormSubmit)}>
              <DialogContent sx={{ pt: 3 }}>
                <ApplicationForm
                  viewApp={viewApp}
                  isEditing={isEditing}
                  isOffering={isOffering}
                  isConverting={isConverting}
                  classList={classList}
                />
              </DialogContent>
              <DialogActions sx={{ p: 2, bgcolor: "action.hover" }}>
                {isEditing || isOffering || isConverting ? (
                  <>
                    <Button
                      onClick={() => { setIsEditing(false); setIsOffering(false); setIsConverting(false); }}
                      color="inherit"
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                    {isConverting ? (
                      <Button type="submit" form="application-unified-form" startIcon={<HowToRegIcon />} variant="contained" color="success" disabled={busy || methods.formState.isSubmitting}>
                        Save & Convert to Student
                      </Button>
                    ) : isOffering ? (
                      <Button type="submit" form="application-unified-form" startIcon={<CheckCircleIcon />} variant="contained" color="success" disabled={busy || methods.formState.isSubmitting}>
                        Save & Offer Place
                      </Button>
                    ) : (
                      <Button type="submit" form="application-unified-form" startIcon={<SaveIcon />} variant="contained" color="primary" disabled={busy || methods.formState.isSubmitting}>
                        Save Changes
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button onClick={() => setViewApp(null)} color="inherit" disabled={busy}>
                      Close
                    </Button>
                    {viewApp?.status === "pending" && (
                      <>
                        <Button startIcon={<EditIcon />} color="primary" disabled={busy} onClick={() => setIsEditing(true)}>
                          Edit Details
                        </Button>
                        <Button startIcon={<EventAvailableIcon />} color="info" disabled={busy} onClick={() => handleStatus(viewApp.id, "interview_scheduled")}>
                          Schedule Interview
                        </Button>
                        <Button startIcon={<CancelIcon />} color="error" disabled={busy} onClick={() => handleStatus(viewApp.id, "rejected")}>
                          Reject
                        </Button>
                        <Button startIcon={<CheckCircleIcon />} variant="contained" color="success" disabled={busy} onClick={() => setIsOffering(true)}>
                          Offer Place
                        </Button>
                      </>
                    )}
                    {viewApp?.status === "interview_scheduled" && (
                      <>
                        <Button startIcon={<CancelIcon />} color="error" disabled={busy} onClick={() => handleStatus(viewApp.id, "rejected")}>
                          Reject
                        </Button>
                        <Button startIcon={<CheckCircleIcon />} variant="contained" color="success" disabled={busy} onClick={() => setIsOffering(true)}>
                          Offer Place
                        </Button>
                      </>
                    )}
                    {viewApp?.status === "offered" && (
                      <>
                        <Button startIcon={<EditIcon />} color="primary" disabled={busy} onClick={() => setIsEditing(true)}>
                          Edit Details
                        </Button>
                        <Button startIcon={<HowToRegIcon />} variant="contained" color="success" disabled={busy} onClick={() => setIsConverting(true)}>
                          Convert to Student
                        </Button>
                      </>
                    )}
                  </>
                )}
              </DialogActions>
            </form>
          </FormProvider>
        </Dialog>
      </RoleGuard>
    </DashboardLayout>
  );
}
