"use client";

/**
 * User management: list system users, toggle active state.
 * @module settings/users/page
 */
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { getInitials, timeAgo } from "@/lib/utils";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants";

export default function UsersSettingsPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="settings.users">
        <UsersContent />
      </PageGuard>
    </DashboardLayout>
  );
}

/** User management content. */
function UsersContent() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const { data, loading, error, refetch, setData } = useAsync(() => api.getUsers(), []);
  const list = data ?? [];

  const toggle = async (id: string, active: boolean) => {
    setData(list.map((u: any) => (u.id === id ? { ...u, isActive: active } : u)));
    await api.updateUser(id, { isActive: active });
    showNotification(active ? "User activated" : "User deactivated", active ? "success" : "info");
  };

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle={`${list.length} system users`}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/settings/users/new")}>
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((u: any) => (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: (ROLE_COLORS as any)[u.role] }}>{getInitials(u.name)}</Avatar>
                          <Box>
                            <Box sx={{ fontWeight: 600 }}>{u.name}</Box>
                            <Box sx={{ fontSize: 12, color: "text.secondary" }}>{u.email}</Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Chip size="small" label={(ROLE_LABELS as any)[u.role]} sx={{ bgcolor: `${(ROLE_COLORS as any)[u.role]}19`, color: (ROLE_COLORS as any)[u.role], fontWeight: 600 }} /></TableCell>
                      <TableCell>{u.phone}</TableCell>
                      <TableCell>{u.lastLogin ? timeAgo(u.lastLogin) : "Never"}</TableCell>
                      <TableCell align="center"><Switch checked={u.isActive} onChange={(e) => toggle(u.id, e.target.checked)} /></TableCell>
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
