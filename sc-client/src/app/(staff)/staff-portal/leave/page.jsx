"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TimeToLeaveIcon from "@mui/icons-material/TimeToLeave";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { staffApi, LEAVE_TYPES, ANNUAL_LEAVE_ENTITLEMENT } from "@/lib/staffApi";
import { formatDate } from "@/lib/utils";

export default function StaffLeavePage() {
  const { user } = useAuth();

  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");

  const {
    data: leaveRequests,
    loading,
    error,
    refetch,
  } = useAsync(async () => {
    if (!user) return [];
    return await staffApi.getLeaveRequests({ staffId: user.id });
  }, [user?.id]);

  const list = leaveRequests || [];

  // Calculate days used and remaining
  const daysUtilised = useMemo(() => {
    return list
      .filter((l) => l.status === "approved")
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);
  }, [list]);

  const remainingBalance = Math.max(0, ANNUAL_LEAVE_ENTITLEMENT - daysUtilised);

  const pendingCount = useMemo(() => {
    return list.filter((l) => l.status === "pending").length;
  }, [list]);

  // Compute calculated days between start and end
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate]);

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      toast.error("Please pick start and end dates");
      return;
    }
    if (calculatedDays <= 0) {
      toast.error("End date must be on or after start date");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the leave application");
      return;
    }

    setSubmitting(true);
    try {
      await staffApi.applyLeave({
        staffId: user?.id,
        staffName: user?.name,
        leaveType,
        startDate,
        endDate,
        days: calculatedDays,
        reason,
        handoverNotes,
        status: "pending",
        appliedOn: new Date().toISOString().split("T")[0],
      });

      toast.success("Leave application submitted successfully!");
      setOpenDialog(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      setHandoverNotes("");
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Leave Applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Apply for leave, track approval status, and view your remaining balance
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
          Apply for Leave
        </Button>
      </Stack>

      {/* Metrics Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                ANNUAL ENTITLEMENT
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                {ANNUAL_LEAVE_ENTITLEMENT}{" "}
                <Typography component="span" variant="body2" color="text.secondary">
                  Days
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Standard academic year
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                DAYS UTILISED
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "text.secondary" }}>
                {daysUtilised}{" "}
                <Typography component="span" variant="body2" color="text.secondary">
                  Days
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Approved leave taken
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                REMAINING BALANCE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "success.main" }}>
                {remainingBalance}{" "}
                <Typography component="span" variant="body2" color="text.secondary">
                  Days
                </Typography>
              </Typography>
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                Available to apply
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                PENDING REQUESTS
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mt: 0.5,
                  color: pendingCount > 0 ? "warning.main" : "text.primary",
                }}
              >
                {pendingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Awaiting head review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leave History Table */}
      <Card elevation={1} sx={{ borderRadius: 2 }}>
        <CardHeader
          title="My Leave History"
          subheader="All submitted applications and review outcomes"
        />
        <Divider />
        {loading && <LinearProgress />}

        {list.length === 0 && !loading ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              No leave applications submitted yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Duration
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reason / Notes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Applied On</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((req, index) => {
                  const typeLabel =
                    LEAVE_TYPES.find((t) => t.value === req.leaveType)?.label ||
                    req.type ||
                    req.leaveType ||
                    "Leave";

                  const status = req.status || "pending";

                  return (
                    <TableRow key={req.id || index} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{typeLabel}</TableCell>
                      <TableCell>
                        {formatDate(req.startDate || req.from)} →{" "}
                        {formatDate(req.endDate || req.to)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${req.days} day${req.days === 1 ? "" : "s"}`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="body2" noWrap title={req.reason}>
                          {req.reason || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(req.appliedOn || req.created_at || req.applied_on)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={status.toUpperCase()}
                          size="small"
                          color={
                            status === "approved"
                              ? "success"
                              : status === "pending"
                                ? "warning"
                                : status === "rejected"
                                  ? "error"
                                  : "default"
                          }
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Apply Leave Modal */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Apply for Staff Leave</DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={leaveType}
                label="Leave Type"
                onChange={(e) => setLeaveType(e.target.value)}
              >
                {LEAVE_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {startDate && endDate && (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "grey.50",
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Requested duration: {calculatedDays} day{calculatedDays === 1 ? "" : "s"}
                </Typography>
                {leaveType === "annual" && calculatedDays > remainingBalance && (
                  <Typography variant="caption" color="error.main">
                    Warning: You have only {remainingBalance} annual leave days remaining.
                  </Typography>
                )}
              </Box>
            )}

            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              label="Reason for Leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the purpose and details of your leave request"
            />

            <TextField
              fullWidth
              size="small"
              label="Handover Notes / Relief Teacher (Optional)"
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder="e.g. Tr. Otieno will cover Grade 4 Mathematics lessons"
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
