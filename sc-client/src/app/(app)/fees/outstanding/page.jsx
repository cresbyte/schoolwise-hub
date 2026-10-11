"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/hooks/useAsync";
import { academicsApi } from "@/lib/academicsApi";
import { feesApi, formatKES } from "@/lib/feesApi";
import { schoolApi } from "@/lib/schoolApi";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Alert,
  Button,
  Card,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OutstandingPage() {
  return (
    <>
      <PageGuard permission="fees.view">
        <OutstandingContent />
      </PageGuard>
    </>
  );
}

export function OutstandingContent() {
  const router = useRouter();
  const [filters, setFilters] = useState({ year: "", class_room: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data, loading, error, refetch } = useAsync(async () => {
    const [rows, years, classes] = await Promise.all([
      feesApi.getOutstanding(filters),
      schoolApi.getAcademicYears(),
      academicsApi.getClasses({ academic_year: null }),
    ]);
    return {
      rows: Array.isArray(rows) ? rows : [],
      years: Array.isArray(years) ? years : [],
      classes: Array.isArray(classes) ? classes : [],
    };
  }, [filters]);

  const rows = data?.rows ?? [];
  const years = data?.years ?? [];
  const classes = data?.classes ?? [];

  const totalOwed = rows.reduce((s, r) => s + Number(r.balance || 0), 0);
  const overdue90 = rows.filter((r) => r.daysOverdue > 90);

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const handleFilter = (field, value) => setFilters((p) => ({ ...p, [field]: value }));

  const exportCsv = () => {
    const rowsCsv = [
      ["Student", "Admission #", "Class", "Balance", "Days overdue"],
      ...rows.map((r) => [r.studentName, r.admissionNumber, r.className, r.balance, r.daysOverdue]),
    ];
    const csv = rowsCsv.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outstanding-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Outstanding balances"
        subtitle="Students who owe fees, with aging."
        actions={
          <Button
            color="inherit"
            startIcon={<DownloadIcon />}
            onClick={exportCsv}
            disabled={rows.length === 0}
          >
            Export CSV
          </Button>
        }
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} flexwrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={filters.year}
              label="Year"
              onChange={(e) => handleFilter("year", e.target.value)}
            >
              <MenuItem value="">Active year</MenuItem>
              {years.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={filters.class_room}
              label="Class"
              onChange={(e) => handleFilter("class_room", e.target.value)}
            >
              <MenuItem value="">All classes</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={4} flexwrap="wrap" useFlexGap>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Students owing
            </Typography>
            <Typography variant="h5">{rows.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total outstanding
            </Typography>
            <Typography variant="h5" color="error.main">
              {formatKES(totalOwed)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Over 90 days overdue
            </Typography>
            <Typography variant="h5" color="error.main">
              {overdue90.length}
            </Typography>
          </Box>
        </Stack>
      </Card>

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => rows.length === 0}
        emptyMessage="No students with outstanding balances."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Admission</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Overdue</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => {
                    const aging =
                      r.daysOverdue >= 90
                        ? "error"
                        : r.daysOverdue >= 60
                          ? "warning"
                          : r.daysOverdue >= 30
                            ? "info"
                            : "default";
                    return (
                      <TableRow key={r.studentId} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{r.studentName}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                          {r.admissionNumber}
                        </TableCell>
                        <TableCell>{r.className || "—"}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "error.main" }}>
                          {formatKES(r.balance)}
                        </TableCell>
                        <TableCell>
                          {r.daysOverdue > 0 ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              color={aging}
                              label={`${r.daysOverdue} days`}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Current
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => router.push(`/students/${r.studentId}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </DataState>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// Small local component
function Box({ children, ...rest }) {
  return <div {...rest}>{children}</div>;
}
