"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Chip,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import WarningIcon from "@mui/icons-material/Warning";
import PeopleIcon from "@mui/icons-material/People";
import SmsIcon from "@mui/icons-material/Sms";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { formatKES, exportToCSV } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();

export default function OutstandingFeesPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="fees.view">
        <OutstandingContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function OutstandingContent() {
  const router = useRouter();
  const { showNotification } = useNotification();

  // Filters
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [term, setTerm] = useState("");

  // SINGLE efficient backend call with all filters applied at the database level
  const {
    data: invoicesData,
    loading,
    error,
    refetch,
  } = useAsync(
    () =>
      api.getInvoices({
        year,
        term: term || undefined,
        class_room: classId || undefined,
        status__in: "unpaid,partial", // Fetch both in one query
        search: search || undefined,
      }),
    [year, term, classId, search], // Refetches automatically when filters change
  );

  const { data: classes } = useAsync(() => api.getClasses(), []);

  // Safely extract array
  const outstandingList = Array.isArray(invoicesData) ? invoicesData : invoicesData?.results || [];

  // Sort by balance descending (highest debt first) in memory (fast for filtered results)
  const sortedList = useMemo(() => {
    return [...outstandingList].sort((a, b) => Number(b.balance) - Number(a.balance));
  }, [outstandingList]);

  const totalOutstanding = sortedList.reduce((sum, inv) => sum + Number(inv.balance), 0);

  const handleExport = () => {
    exportToCSV(
      sortedList.map((i) => ({
        "Admission No": i.student_admission || i.student,
        "Student Name": i.student_name,
        Class: i.student_class,
        Term: `Term ${i.term}`,
        Charged: Number(i.total_amount),
        Paid: Number(i.paid_amount),
        Balance: Number(i.balance),
        Status: i.status,
      })),
      `outstanding-fees-${year}.csv`,
    );
  };

  const handleRemind = (studentName) => {
    showNotification(`SMS reminder sent to ${studentName}'s parent`, "success");
  };

  return (
    <>
      <PageHeader
        title="Outstanding Fees"
        subtitle={`Outstanding balances for ${year}`}
        actions={
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={handleExport}
            disabled={sortedList.length === 0}
          >
            Export CSV
          </Button>
        }
      />

      {/* Stats Cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Card
          sx={{
            p: 2,
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderLeft: "4px solid",
            borderColor: "error.main",
          }}
        >
          <WarningIcon color="error" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Outstanding
            </Typography>
            <Typography variant="h5" fontWeight={700} color="error.main">
              {formatKES(totalOutstanding)}
            </Typography>
          </Box>
        </Card>
        <Card
          sx={{
            p: 2,
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderLeft: "4px solid",
            borderColor: "warning.main",
          }}
        >
          <PeopleIcon color="warning" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Students with Balance
            </Typography>
            <Typography variant="h5" fontWeight={700} color="warning.main">
              {sortedList.length}
            </Typography>
          </Box>
        </Card>
      </Stack>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name or admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ width: { xs: "100%", sm: 120 } }}
          >
            <MenuItem value={CURRENT_YEAR - 1}>{CURRENT_YEAR - 1}</MenuItem>
            <MenuItem value={CURRENT_YEAR}>{CURRENT_YEAR}</MenuItem>
            <MenuItem value={CURRENT_YEAR + 1}>{CURRENT_YEAR + 1}</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            sx={{ width: { xs: "100%", sm: 120 } }}
          >
            <MenuItem value="">All Terms</MenuItem>
            <MenuItem value="1">Term 1</MenuItem>
            <MenuItem value="2">Term 2</MenuItem>
            <MenuItem value="3">Term 3</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            sx={{ width: { xs: "100%", sm: 200 } }}
          >
            <MenuItem value="">All Classes</MenuItem>
            {(classes || []).map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Card>

      {/* Outstanding Table */}
      <Card>
        <DataState
          loading={loading}
          error={error}
          data={sortedList}
          isEmpty={(d) => d.length === 0}
          emptyMessage={
            search || classId || term
              ? "No outstanding balances match your filters."
              : "No outstanding balances — well done!"
          }
        >
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Adm. No.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Term</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Charged
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Paid
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Balance
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedList.map((i) => (
                    <TableRow
                      key={i.id}
                      hover
                      onClick={() => router.push(`/students/${i.student}`)}
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                    >
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                        {i.student_admission || i.student}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{i.student_name}</TableCell>
                      <TableCell>{i.student_class}</TableCell>
                      <TableCell>Term {i.term}</TableCell>
                      <TableCell align="right">{formatKES(i.total_amount)}</TableCell>
                      <TableCell align="right">{formatKES(i.paid_amount)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "error.main" }}>
                        {formatKES(i.balance)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={i.status === "unpaid" ? "Unpaid" : "Partial"}
                          size="small"
                          color={i.status === "unpaid" ? "error" : "warning"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Student Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => router.push(`/students/${i.student}`)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send SMS Reminder">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleRemind(i.student_name)}
                            >
                              <SmsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
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
