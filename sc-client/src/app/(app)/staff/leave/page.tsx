"use client";

/**
 * Staff leave management: review, approve and reject requests.
 * @module staff/leave/page
 */
import { useState } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { StatusChip } from "@/components/StatusChip";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { formatDate } from "@/lib/utils";
import { LEAVE_TYPES } from "@/lib/constants";
import type { LeaveStatus } from "@/lib/types";

export default function LeavePage() {
  return (
    <DashboardLayout>
      <LeaveContent />
    </DashboardLayout>
  );
}

/** Leave management content. */
function LeaveContent() {
  const { showNotification } = useNotification();
  const [status, setStatus] = useState("all");
  const { data, loading, error, refetch } = useAsync(() => api.getLeaveRequests({ status }), [status]);
  const [busy, setBusy] = useState("");
  const list = data ?? [];

  const review = async (id: string, newStatus: LeaveStatus) => {
    setBusy(id);
    await api.updateLeaveStatus(id, newStatus);
    setBusy("");
    refetch();
    showNotification(`Leave request ${newStatus}`, newStatus === "approved" ? "success" : "info");
  };

  return (
    <>
      <PageHeader title="Leave Management" subtitle="Review and action staff leave requests" />
      <Card sx={{ p: 2, mb: 2 }}>
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 170 }}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
      </Card>
      <Card>
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d) => d.length === 0} emptyMessage="No leave requests">
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Days</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((l: any) => (
                    <TableRow key={l.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{l.staffName}</TableCell>
                      <TableCell><Chip size="small" variant="outlined" label={LEAVE_TYPES.find((t) => t.value === l.leaveType)?.label ?? l.leaveType} /></TableCell>
                      <TableCell>{formatDate(l.startDate)} – {formatDate(l.endDate)}</TableCell>
                      <TableCell align="right">{l.days}</TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>{l.reason}</TableCell>
                      <TableCell><StatusChip status={l.status} /></TableCell>
                      <TableCell align="right">
                        {l.status === "pending" ? (
                          <RoleGuard permission="staff.leave" fallback={<StatusChip status="pending" />}>
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                              <Button size="small" color="success" disabled={busy === l.id} onClick={() => review(l.id, "approved")}>Approve</Button>
                              <Button size="small" color="error" disabled={busy === l.id} onClick={() => review(l.id, "rejected")}>Reject</Button>
                            </Box>
                          </RoleGuard>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      </Card>
    </>
  );
}
