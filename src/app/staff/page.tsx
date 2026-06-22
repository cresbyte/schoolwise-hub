"use client";

/**
 * Staff register with search, department filter and export.
 * @module staff/page
 */
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
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { SearchInput } from "@/components/SearchInput";
import { StatusChip } from "@/components/StatusChip";
import { RoleGuard } from "@/components/RoleGuard";
import { useStaff } from "@/hooks/domain";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { formatKES, getInitials, exportToCSV } from "@/lib/utils";
import { CONTRACT_TYPES } from "@/lib/constants";
import type { Staff } from "@/lib/types";

export default function StaffPage() {
  return (
    <DashboardLayout>
      <StaffContent />
    </DashboardLayout>
  );
}

/** Staff list content. */
function StaffContent() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { data, loading, error, refetch } = useStaff({ search, status });
  const list = data ?? [];

  const handleExport = () =>
    exportToCSV(
      list.map((s) => ({ StaffNo: s.staffNumber, Name: `${s.firstName} ${s.lastName}`, Designation: s.designation, Department: s.department ?? "", Contract: s.contractType, Phone: s.phone, Status: s.status })),
      "staff.csv",
    );

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
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{s.staffNumber}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: "secondary.main" }}>{getInitials(`${s.firstName} ${s.lastName}`)}</Avatar>
                          <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
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
                      <TableCell align="right">{formatKES(s.basicSalary)}</TableCell>
                      <TableCell><StatusChip status={s.status} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => router.push(`/staff/${s.id}`)}><VisibilityIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => router.push(`/staff/${s.id}/edit`)}><EditIcon fontSize="small" /></IconButton>
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

function StaffSubjectChips({ staff }: { staff: Staff }) {
  const subjects = useAsync(() => api.getSubjects(), []);
  const allSubs = subjects.data || [];
  const teaching = staff.subjectsTeaching || [];
  
  if (teaching.length === 0) return <Typography variant="caption" color="text.secondary">No specializations</Typography>;
  
  return (
    <>
      {teaching.slice(0, 3).map((subId) => {
        const sub = allSubs.find(s => s.id === subId);
        return <Chip key={subId} size="small" label={sub?.name || subId} sx={{ fontSize: 10, height: 20 }} color="primary" variant="outlined" />;
      })}
      {teaching.length > 3 && (
        <Chip size="small" label={`+${teaching.length - 3}`} sx={{ fontSize: 10, height: 20 }} />
      )}
    </>
  );
}
