"use client";

import { DataState } from "@/components/DataState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { useNotification } from "@/context/NotificationContext";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { format } from "date-fns";
import { useState } from "react";

export default function ApplicationsCmsPage() {
  const [tab, setTab] = useState(0);
  const statusFilter = tab === 0 ? "pending" : tab === 1 ? "approved" : "rejected";
  const { data: apps, loading, refetch } = useAsync(() => api.getApplications(statusFilter as any), [tab]);
  const { showNotification } = useNotification();
  const [viewApp, setViewApp] = useState<any>(null);

  const handleStatus = async (id: string, status: string) => {
    await api.updateApplicationStatus(id, status as any);
    showNotification(`Application ${status}`, "success");
    setViewApp(null);
    refetch();
  };

  const getStatusColor = (s: string) => {
    if (s === "approved") return "success";
    if (s === "rejected") return "error";
    return "warning";
  };

  return (
    <DashboardLayout>
      <RoleGuard permission="settings.view">
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Admission Applications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Review and manage online admission submissions.
          </Typography>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Pending" />
            <Tab label="Approved" />
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
                    <TableCell>Date Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apps && apps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{app.firstName} {app.lastName}</TableCell>
                      <TableCell>{app.gradeApplying} ({app.boardingType})</TableCell>
                      <TableCell>{app.parentName}</TableCell>
                      <TableCell>{format(new Date(app.submittedAt), "MMM dd, yyyy")}</TableCell>
                      <TableCell><Chip label={app.status} color={getStatusColor(app.status)} size="small" /></TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => setViewApp(app)} size="small" color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DataState>
        </Box>

        <Dialog open={!!viewApp} onClose={() => setViewApp(null)} fullWidth maxWidth="md">
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            Application Details — {viewApp?.applicationRef}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="overline" color="text.secondary">Learner Details</Typography>
                <Typography variant="body1"><strong>Name:</strong> {viewApp?.firstName} {viewApp?.lastName}</Typography>
                <Typography variant="body1"><strong>DOB:</strong> {viewApp?.dob}</Typography>
                <Typography variant="body1"><strong>Gender:</strong> {viewApp?.gender}</Typography>
                <Typography variant="body1"><strong>Grade Applying:</strong> {viewApp?.gradeApplying}</Typography>
                <Typography variant="body1"><strong>Boarding:</strong> {viewApp?.boardingType}</Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="overline" color="text.secondary">Previous School</Typography>
                  <Typography variant="body1"><strong>School:</strong> {viewApp?.prevSchool || "N/A"}</Typography>
                  <Typography variant="body1"><strong>Last Class:</strong> {viewApp?.prevClass || "N/A"}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="overline" color="text.secondary">Parent/Guardian</Typography>
                <Typography variant="body1"><strong>Name:</strong> {viewApp?.parentName}</Typography>
                <Typography variant="body1"><strong>Phone:</strong> {viewApp?.parentPhone}</Typography>
                <Typography variant="body1"><strong>Email:</strong> {viewApp?.parentEmail || "N/A"}</Typography>
                <Typography variant="body1"><strong>Relation:</strong> {viewApp?.relationship}</Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="overline" color="text.secondary">System Status</Typography>
                  <Box><Chip label={viewApp?.status} color={getStatusColor(viewApp?.status || "")} /></Box>
                  {viewApp && (
                    <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                      Submitted on {format(new Date(viewApp.submittedAt), "MMM dd, yyyy HH:mm")}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: "action.hover" }}>
            <Button onClick={() => setViewApp(null)} color="inherit">Close</Button>
            {viewApp?.status === "pending" && (
              <>
                <Button startIcon={<CancelIcon />} color="error" onClick={() => handleStatus(viewApp.id, "rejected")}>Reject</Button>
                <Button startIcon={<CheckCircleIcon />} variant="contained" color="success" onClick={() => handleStatus(viewApp.id, "approved")}>Approve</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </RoleGuard>
    </DashboardLayout>
  );
}
