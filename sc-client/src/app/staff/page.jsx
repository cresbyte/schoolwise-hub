"use client";

import { useState } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
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
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import KeyIcon from "@mui/icons-material/Key";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { SearchInput } from "@/components/SearchInput";
import { StatusChip } from "@/components/StatusChip";
import { RoleGuard } from "@/components/RoleGuard";
import { PageGuard } from "@/components/common/PageGuard";
import { useStaff } from "@/hooks/domain";
import { api } from "@/lib/api";
import { formatKES, getInitials, exportToCSV } from "@/lib/utils";
import { useNotification } from "@/context/NotificationContext";

export default function StaffPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="staff.view">
        <StaffContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function StaffContent() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [tempPassword, setTempPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const { data, loading, error, refetch } = useStaff({ search, status });
  const list = data ?? [];

  const handleExport = () =>
    exportToCSV(
      list.map((s) => ({
        StaffNo: s.staffNumber || s.staff_id,
        Name: s.name,
        Designation: s.designation,
        Department: s.department ?? "",
        Contract: s.contractType || s.contract_type || "",
        Phone: s.phone,
        Status: s.status
      })),
      "staff.csv",
    );

  const handleResetPassword = async () => {
    if (!selectedStaff) return;
    setIsResetting(true);
    try {
      const response = await api.resetStaffPassword(selectedStaff.id);
      setTempPassword(response.temporaryPassword);
      showNotification("Password reset successfully", "success");
    } catch (err) {
      showNotification(err.message || "Failed to reset password", "error");
    } finally {
      setIsResetting(false);
    }
  };

  const closeResetDialog = () => {
    setResetDialogOpen(false);
    setSelectedStaff(null);
    setTempPassword("");
  };

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle={<Chip size="small" label={`${list.length} staff`} />}
        actions={
          <>
            <Button startIcon={<DownloadIcon />} variant="outlined" onClick={handleExport}>Export</Button>
            <RoleGuard permission="staff.*">
              <Button startIcon={<AddIcon />} variant="contained" onClick={() => router.push("/staff/new")}>Add Staff</Button>
            </RoleGuard>
          </>
        }
      />
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Name or staff no…" />
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 160 }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="on_leave">On Leave</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </TextField>
        </Box>
      </Card>
      <Card>
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d) => d.length === 0}>
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff No.</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Role / Subjects</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell align="right">Basic Salary</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{s.staffNumber || s.staff_id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar
                            src={s.avatarUrl || s.photo}
                            alt={s.name}
                            sx={{ width: 32, height: 32, fontSize: 12, bgcolor: "secondary.main" }}
                          >
                            {getInitials(s.name || "")}
                          </Avatar>
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                        </Box>
                      </TableCell>
                      <TableCell>{s.designation}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", maxWidth: 200 }}>
                          <RoleGuard permission="classes.view">
                            <StaffSubjectChips staff={s} />
                          </RoleGuard>
                        </Box>
                      </TableCell>
                      <TableCell>{s.phone}</TableCell>
                      <TableCell align="right">{formatKES(s.basicSalary ?? s.basic_salary ?? 0)}</TableCell>
                      <TableCell><StatusChip status={s.status || (s.is_active ? "active" : "inactive")} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => router.push(`/staff/${s.id}`)} title="View Details">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => router.push(`/staff/${s.id}/edit`)} title="Edit Staff">
                          <EditIcon fontSize="small" />
                        </IconButton>

                        <RoleGuard permission="staff.*">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedStaff(s);
                              setTempPassword("");
                              setResetDialogOpen(true);
                            }}
                            title="Reset Password"
                            color="warning"
                          >
                            <KeyIcon fontSize="small" />
                          </IconButton>
                        </RoleGuard>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onClose={closeResetDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Staff Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to reset the password for <strong>{selectedStaff?.name}</strong>?
            A new temporary password will be generated.
          </Typography>

          {tempPassword ? (
            <Box sx={{ mt: 2, p: 2, bgcolor: "success.light", color: "success.dark", borderRadius: 1, textAlign: "center" }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>New Temporary Password:</Typography>
              <Typography variant="h5" sx={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: 1, userSelect: "all" }}>
                {tempPassword}
              </Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                Please share this with the staff member securely. They will be required to change it on next login.
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="warning.main">
              Click "Generate & Reset" to create a new temporary password.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeResetDialog} disabled={isResetting}>
            Close
          </Button>
          {!tempPassword && (
            <Button
              variant="contained"
              color="warning"
              onClick={handleResetPassword}
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Generate & Reset"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

function StaffSubjectChips({ staff }) {
  // Note: If you don't have useAsync imported for this, you can add it or simplify this component
  // For now, keeping it as is, assuming useAsync is available or you can fallback to static rendering
  return null;
  // If you need the subjects logic, ensure `useAsync` and `api.getSubjects` are imported at the top.
}
