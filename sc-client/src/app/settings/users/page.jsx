"use client";

import {
  Avatar, Box, Card, Chip, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from "@mui/material";
import { Add, Edit, Delete, Lock } from "@mui/icons-material";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants";
import { getInitials, timeAgo } from "@/lib/utils";
import api from "@/services/axios";

export default function UsersSettingsPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="settings.users">
        <UsersContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function UsersContent() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const { data, loading, error, refetch, setData } = useAsync(
    async () => {
      const res = await api.get("auth/users/");
      // DRF returns paginated { count, results: [...] } or a plain array
      return Array.isArray(res.data) ? res.data : (res.data.results ?? []);
    },
    []
  );
  const list = data ?? [];

  const [resetDialog, setResetDialog] = useState(null); // { id, name }
  const [deleteDialog, setDeleteDialog] = useState(null);

  const handleToggle = async (id, active) => {
    // Optimistic update
    setData(list.map((u) => (u.id === id ? { ...u, isActive: active } : u)));
    try {
      await api.patch(`auth/users/${id}/`, { is_active: active });
      showNotification(active ? "User activated" : "User deactivated", active ? "success" : "info");
    } catch {
      // Revert on error
      setData(list.map((u) => (u.id === id ? { ...u, isActive: !active } : u)));
      showNotification("Failed to update user status", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`auth/users/${id}/`);
      setData(list.filter((u) => u.id !== id));
      showNotification("User deleted", "success");
    } catch {
      showNotification("Failed to delete user", "error");
    }
    setDeleteDialog(null);
  };

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle={`${list.length} system user${list.length !== 1 ? "s" : ""}`}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => router.push("/settings/users/new")}>
            Add User
          </Button>
        }
      />
      <Card>
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d) => d.length === 0}>
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell align="center">Active</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            src={u.photo}
                            sx={{ width: 36, height: 36, fontSize: 13, bgcolor: ROLE_COLORS[u.role] }}
                          >
                            {getInitials(u.name)}
                          </Avatar>
                          <Box>
                            <Box sx={{ fontWeight: 600, lineHeight: 1.2 }}>{u.name}</Box>
                            <Box sx={{ fontSize: 12, color: "text.secondary" }}>{u.email || u.phone}</Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={ROLE_LABELS[u.role] ?? u.role}
                          sx={{
                            bgcolor: `${ROLE_COLORS[u.role] ?? "#666"}22`,
                            color: ROLE_COLORS[u.role] ?? "text.primary",
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell>{u.phone}</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                        {u.last_login ? timeAgo(u.last_login) : "Never"}
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={u.isActive ?? u.is_active ?? true}
                          size="small"
                          onChange={(e) => handleToggle(u.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                          <Tooltip title="Reset Password">
                            <IconButton size="small" onClick={() => setResetDialog({ id: u.id, name: u.name })}>
                              <Lock fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ id: u.id, name: u.name })}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
      <ResetPasswordDialog
        open={!!resetDialog}
        user={resetDialog}
        onClose={() => setResetDialog(null)}
        onSuccess={() => showNotification("Password reset successfully", "success")}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteDialog?.id)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function ResetPasswordDialog({ open, user, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleReset = async () => {
    if (password.length < 6) {
      showNotification("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await api.patch(`auth/users/${user.id}/`, { password });
      onSuccess();
      setPassword("");
      onClose();
    } catch {
      showNotification("Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reset Password — {user?.name}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          label="New Password"
          type="password"
          fullWidth
          size="small"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Minimum 6 characters"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleReset} disabled={loading}>
          {loading ? "Saving…" : "Reset Password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
