"use client";

/**
 * Students register: search, filters, table, export.
 * @module students/page
 */
import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { RoleGuard } from "@/components/RoleGuard";
import { SearchInput } from "@/components/SearchInput";
import { useClasses, useStudents } from "@/hooks/domain";
import { exportToCSV, formatKES } from "@/lib/utils";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PrintIcon from "@mui/icons-material/Print";
import {
  Box, Button, Card, Chip, IconButton, ListItemIcon, ListItemText, Menu, MenuItem,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TextField, Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ROWS_PER_PAGE = 50;
const EMPTY = "--";

/** Label and MUI palette colour for each status. Shown as text, never colour alone. */
const STATUS = {
  active: { label: "Active", color: "success" },
  transferred_out: { label: "Transferred", color: "warning" },
  graduated: { label: "Graduated", color: "info" },
  withdrawn: { label: "Withdrawn", color: "error" },
  suspended: { label: "Suspended", color: "warning" },
};

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "transferred_out", label: "Transferred" },
  { value: "graduated", label: "Graduated" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "suspended", label: "Suspended" },
];

/** Returns a number, or null when the value is missing or not calculable. */
function toAmount(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Formats money, or "--" when the amount can't be calculated. */
function formatBalance(value) {
  const n = toAmount(value);
  if (n === null) return EMPTY;
  const text = formatKES(n);
  return typeof text === "string" && !/nan/i.test(text) ? text : EMPTY;
}

export default function StudentsPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="students.view">
        <StudentsContent />
      </PageGuard>
    </DashboardLayout>
  );
}

/*
 * Action hierarchy:
 *  - Header:  "Add student" is the only filled button. Export and Print live in a "more" menu.
 *  - Filters: search, class, status, plus a quiet "Clear filters" when any are active.
 *  - Rows:    the whole row opens the student, so there are no per-row buttons.
 */
function StudentsContent() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);

  const { data, loading, error, refetch } = useStudents({
    search,
    classId: classId || undefined,
    status,
  });
  const classes = useClasses();
  const list = data ?? [];
  const paged = list.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);
  const filtersActive = !!search || !!classId || status !== "all";

  const updateFilter = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch("");
    setClassId("");
    setStatus("all");
    setPage(0);
  };

  const handleExport = () => {
    exportToCSV(
      list.map((s) => ({
        Admission: s.admissionNumber,
        Name: `${s.firstName} ${s.lastName}`,
        Class: s.className,
        Gender: s.gender,
        Boarding: s.boardingStatus,
        Balance: toAmount(s.feeBalance) ?? EMPTY,
        Status: STATUS[s.status]?.label ?? s.status,
      })),
      "students.csv",
    );
  };

  const countLabel = `${list.length} ${list.length === 1 ? "student" : "students"}${filtersActive ? " match your filters" : ""}`;

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={countLabel}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <RoleGuard roles={["admin", "headteacher"]}>
              <Button startIcon={<AddIcon />} variant="contained" onClick={() => router.push("/students/new")}>
                Add student
              </Button>
            </RoleGuard>
            <MoreMenu onExport={handleExport} onPrint={() => window.print()} disabled={list.length === 0} />
          </Stack>
        }
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <SearchInput
            value={search}
            onChange={updateFilter(setSearch)}
            placeholder="Search by name, admission no. or phone"
          />
          <TextField
            select
            size="small"
            label="Class"
            value={classId}
            onChange={(e) => updateFilter(setClassId)(e.target.value)}
            sx={{ width: 170 }}
          >
            <MenuItem value="">All classes</MenuItem>
            {(classes.data ?? []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(e) => updateFilter(setStatus)(e.target.value)}
            sx={{ width: 170 }}
          >
            {STATUS_FILTERS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          {filtersActive && (
            <Button color="inherit" onClick={clearFilters}>Clear filters</Button>
          )}
        </Box>
      </Card>

      <Card>
        <DataState
          loading={loading}
          error={error}
          data={list}
          onRetry={refetch}
          isEmpty={(d) => d.length === 0}
          emptyMessage={filtersActive ? "No students match your filters. Try clearing them." : "No students yet."}
        >
          {() => (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Adm. no.</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Fee balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.map((s) => {
                      const st = STATUS[s.status];
                      const balance = toAmount(s.feeBalance);
                      return (
                        <TableRow
                          key={s.id}
                          hover
                          tabIndex={0}
                          onClick={() => router.push(`/students/${s.id}`)}
                          onKeyDown={(e) => e.key === "Enter" && router.push(`/students/${s.id}`)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                            {s.admissionNumber || EMPTY}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {s.firstName} {s.lastName}
                          </TableCell>
                          <TableCell>{s.className || EMPTY}</TableCell>
                          <TableCell>{s.gender || EMPTY}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={st?.label ?? s.status ?? EMPTY}
                              color={st?.color ?? "default"}
                            />
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: balance !== null && balance > 0 ? 700 : 400,
                              color: balance !== null && balance > 0 ? "error.main" : "text.primary",
                            }}
                          >
                            {formatBalance(s.feeBalance)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {list.length > ROWS_PER_PAGE && (
                <TablePagination
                  component="div"
                  count={list.length}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={ROWS_PER_PAGE}
                  rowsPerPageOptions={[ROWS_PER_PAGE]}
                />
              )}
            </>
          )}
        </DataState>
      </Card>
    </>
  );
}

function MoreMenu({ onExport, onPrint, disabled }) {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);
  return (
    <>
      <IconButton aria-label="More actions" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={close}>
        <MenuItem disabled={disabled} onClick={() => { close(); onExport(); }}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Export to CSV</ListItemText>
        </MenuItem>
        <MenuItem disabled={disabled} onClick={() => { close(); onPrint(); }}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Print list</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
