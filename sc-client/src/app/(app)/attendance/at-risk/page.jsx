"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Snackbar,
} from "@mui/material";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { schoolApi } from "@/lib/schoolApi";
import { attendanceApi } from "@/lib/attendanceApi";

export default function AtRiskPage() {
  return (
    <>
      <PageGuard permission="attendance.view">
        <AtRiskContent />
      </PageGuard>
    </>
  );
}

function AtRiskContent() {
  const router = useRouter();
  const [yearId, setYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [threshold, setThreshold] = useState(0.8);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data: setupData } = useAsync(async () => {
    const [years, terms] = await Promise.all([schoolApi.getAcademicYears(), schoolApi.getTerms()]);
    return {
      years: Array.isArray(years) ? years : [],
      terms: Array.isArray(terms) ? terms : [],
    };
  }, []);

  const years = setupData?.years ?? [];
  const terms = setupData?.terms ?? [];

  const { data, loading, error, refetch } = useAsync(async () => {
    const params = { threshold };
    if (yearId) params.year = yearId;
    if (termId) params.term = termId;
    return attendanceApi.getAtRisk(params);
  }, [yearId, termId, threshold]);

  const students = data?.students ?? [];

  return (
    <>
      <PageHeader
        title="At-risk students"
        subtitle="Students whose attendance falls below the threshold."
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Year</InputLabel>
            <Select value={yearId} label="Year" onChange={(e) => setYearId(e.target.value)}>
              <MenuItem value="">Active year</MenuItem>
              {years.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Term</InputLabel>
            <Select value={termId} label="Term" onChange={(e) => setTermId(e.target.value)}>
              <MenuItem value="">Whole year</MenuItem>
              {terms
                .filter((t) => !yearId || String(t.academic_year) === String(yearId))
                .map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Box sx={{ minWidth: 260 }}>
            <Typography variant="caption" color="text.secondary">
              Threshold: {Math.round(threshold * 100)}%
            </Typography>
            <Slider
              value={threshold}
              onChange={(_, v) => setThreshold(v)}
              min={0.5}
              max={1}
              step={0.05}
              marks={[
                { value: 0.5, label: "50%" },
                { value: 0.75, label: "75%" },
                { value: 0.9, label: "90%" },
                { value: 1, label: "100%" },
              ]}
            />
          </Box>
        </Stack>
      </Card>

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => students.length === 0}
        emptyMessage="No students below the threshold. "
      >
        {() => (
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell align="right">Absences</TableCell>
                    <TableCell align="right">School days</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => {
                    const pct = s.attendanceRate * 100;
                    return (
                      <TableRow key={s.studentId} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{s.studentName}</TableCell>
                        <TableCell>{s.className}</TableCell>
                        <TableCell align="right">{s.absent}</TableCell>
                        <TableCell align="right">{s.schoolDays}</TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            color={pct >= 75 ? "warning" : "error"}
                            label={`${pct.toFixed(1)}%`}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => router.push(`/students/${s.studentId}`)}
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
