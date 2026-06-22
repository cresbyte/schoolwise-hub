"use client";

/**
 * Students register: search, filters, table, export.
 * @module students/page
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { SearchInput } from "@/components/SearchInput";
import { StatusChip } from "@/components/StatusChip";
import { RoleGuard } from "@/components/RoleGuard";
import { useStudents, useClasses } from "@/hooks/domain";
import { formatKES, getInitials } from "@/lib/utils";
import { exportToCSV } from "@/lib/utils";

export default function StudentsPage() {
  return (
    <DashboardLayout>
      <StudentsContent />
    </DashboardLayout>
  );
}

/** Students list content. */
function StudentsContent() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("all");
  const [boarding, setBoarding] = useState("all");
  const [page, setPage] = useState(0);
  const rowsPerPage = 15;

  const { data, loading, error, refetch } = useStudents({
    search,
    classId: classId || undefined,
    status,
    boardingStatus: boarding,
  });
  const classes = useClasses();
  const list = data ?? [];
  const paged = list.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleExport = () => {
    exportToCSV(
      list.map((s) => ({
        Admission: s.admissionNumber,
        Name: `${s.firstName} ${s.lastName}`,
        Class: s.className,
        Gender: s.gender,
        Boarding: s.boardingStatus,
        Parent: s.parent.primaryContactPhone,
        Balance: s.feeBalance,
        Status: s.status,
      })),
      "students.csv",
    );
  };

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={<Chip size="small" label={`${list.length} students`} />}
        actions={
          <>
            <Button startIcon={<DownloadIcon />} onClick={handleExport} variant="outlined">Export</Button>
            <Button startIcon={<PrintIcon />} onClick={() => window.print()} variant="outlined">Print</Button>
            <RoleGuard roles={["admin", "headteacher"]}>
              <Button startIcon={<AddIcon />} variant="contained" onClick={() => router.push("/students/new")}>
                Add Student
              </Button>
            </RoleGuard>
          </>
        }
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Name, admission no, phone…" />
          <TextField select size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} sx={{ width: 170 }}>
            <MenuItem value="">All Classes</MenuItem>
            {(classes.data ?? []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 150 }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="transferred_out">Transferred</MenuItem>
            <MenuItem value="graduated">Graduated</MenuItem>
          </TextField>
          <TextField select size="small" label="Boarding" value={boarding} onChange={(e) => setBoarding(e.target.value)} sx={{ width: 140 }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="boarding">Boarding</MenuItem>
          </TextField>
        </Box>
      </Card>

      <Card>
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d) => d.length === 0} emptyMessage="No students match your filters">
          {() => (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Adm. No.</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Boarding</TableCell>
                      <TableCell>Parent Phone</TableCell>
                      <TableCell align="right">Fee Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{s.admissionNumber}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: "primary.main" }}>
                              {getInitials(`${s.firstName} ${s.lastName}`)}
                            </Avatar>
                            <Link href={`/students/${s.id}`} style={{ fontWeight: 600, color: "#1565C0", textDecoration: "none" }}>
                              {s.firstName} {s.lastName}
                            </Link>
                          </Box>
                        </TableCell>
                        <TableCell>{s.className}</TableCell>
                        <TableCell>
                          <Chip size="small" label={s.gender === "Male" ? "M" : "F"} sx={{ bgcolor: s.gender === "Male" ? "#1565C019" : "#E91E6319", color: s.gender === "Male" ? "#1565C0" : "#C2185B", fontWeight: 700 }} />
                        </TableCell>
                        <TableCell><Chip size="small" variant="outlined" label={s.boardingStatus === "day" ? "Day" : "Boarding"} /></TableCell>
                        <TableCell>{s.parent.primaryContactPhone}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: s.feeBalance > 0 ? "error.main" : "success.main" }}>
                          {formatKES(s.feeBalance)}
                        </TableCell>
                        <TableCell><StatusChip status={s.status} /></TableCell>
                        <TableCell align="right">
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => router.push(`/students/${s.id}`)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => router.push(`/students/${s.id}/edit`)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={list.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[15]}
              />
            </>
          )}
        </DataState>
      </Card>
    </>
  );
}
