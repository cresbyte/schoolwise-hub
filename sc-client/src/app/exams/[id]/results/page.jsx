"use client";

import { useState, useEffect } from "react";
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Chip, FormControl, InputLabel, Select, MenuItem,
  Stack, useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { ViewReportCardButton } from "../../../../components/exams/ReportCardDialog";

export default function ExamResultsPage() {
  const params = useParams();
    const examId = params.examId || params.id;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


  if (!examId) {
    return (
      <DashboardLayout>
        <Typography color="error" sx={{ p: 4 }}>
          Invalid exam ID in URL.
        </Typography>
      </DashboardLayout>
    );
  }

  // 1. Fetch exam details to get year, term, and available classes
  const { data: exam, loading: examLoading } = useAsync(() => api.exams.get(examId), [examId]);

  // 2. State for selected class
  const [selectedClassId, setSelectedClassId] = useState("");

  // 3. Fetch the class results summary when a class is selected
  const { data: classResults, loading: resultsLoading, error, refetch } = useAsync(
    () => selectedClassId && exam
      ? api.exams.getClassReportCards(selectedClassId, exam.year, exam.term)
      : Promise.resolve([]),
    [selectedClassId, exam]
  );

  useEffect(() => {
    if (exam?.classRooms?.length > 0 && !selectedClassId) {
      setSelectedClassId(exam.classRooms[0].id);
    }
  }, [exam, selectedClassId]);

  if (examLoading) {
    return <DashboardLayout><Typography sx={{ p: 4 }}>Loading exam details...</Typography></DashboardLayout>;
  }

  if (!exam) {
    return <DashboardLayout><Typography color="error" sx={{ p: 4 }}>Exam not found.</Typography></DashboardLayout>;
  }

  const results = classResults || [];

  // Dynamically get all unique subject names from the results to build table columns
  const allSubjects = results.length > 0
    ? [...new Set(results.flatMap(r => r.subjects.map(s => s.subjectName)))]
    : [];

  return (
    <DashboardLayout>
      <PageHeader
        title={`${exam.name} - Results`}
        subtitle={`Term ${exam.term}, ${exam.year}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              href={`/exams/${examId}/scores`}
              startIcon={<ArrowBackIcon />}
              variant="outlined"
            >
              Back to Score Entry
            </Button>
            {results.length > 0 && (
              <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
                Print Mark Sheet
              </Button>
            )}
          </Stack>
        }
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClassId}
            label="Select Class"
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {exam.classRooms?.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      <Card sx={{ overflowX: "auto" }}>
        <DataState
          loading={resultsLoading}
          error={error}
          data={results}
          onRetry={refetch}
          isEmpty={(d) => d.length === 0}
          emptyMessage="No results available for this class yet. Ensure scores have been entered."
        >
          {() => (
            <TableContainer sx={{ minWidth: 800 }}>
              {" "}
              {/* Force horizontal scroll on mobile */}
              <Table size="small" sx={{ whiteSpace: "nowrap" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        position: "sticky",
                        left: 0,
                        bgcolor: "background.paper",
                        zIndex: 1,
                      }}
                    >
                      Pos
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        position: "sticky",
                        left: 60,
                        bgcolor: "background.paper",
                        zIndex: 1,
                      }}
                    >
                      Adm No
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        position: "sticky",
                        left: 130,
                        bgcolor: "background.paper",
                        zIndex: 1,
                      }}
                    >
                      Student Name
                    </TableCell>
                    {allSubjects.map((sub) => (
                      <TableCell key={sub} align="center" sx={{ fontWeight: 700, minWidth: 80 }}>
                        {sub}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "action.hover" }}>
                      Total
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "action.hover" }}>
                      Avg %
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "action.hover" }}>
                      Mean Grade
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "action.hover" }}>
                      Report
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((row, index) => (
                    <TableRow
                      key={row.studentId}
                      hover
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          position: "sticky",
                          left: 0,
                          bgcolor: "background.paper",
                        }}
                      >
                        {row.position || "-"}
                      </TableCell>
                      <TableCell sx={{ position: "sticky", left: 60, bgcolor: "background.paper" }}>
                        {row.admissionNumber}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          position: "sticky",
                          left: 130,
                          bgcolor: "background.paper",
                        }}
                      >
                        {row.studentName}
                      </TableCell>

                      {/* Dynamic Subject Columns */}
                      {allSubjects.map((subName) => {
                        const subjectData = row.subjects.find((s) => s.subjectName === subName);
                        return (
                          <TableCell key={subName} align="center">
                            {subjectData ? (
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {subjectData.grade || "-"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {subjectData.marks}/{subjectData.outOf}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                -
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}

                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        {row.totalMarks}/{row.totalPossible}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        {row.average}%
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.meanGrade || "-"}
                          size="small"
                          color={
                            row.meanGrade === "EE"
                              ? "success"
                              : row.meanGrade === "ME"
                                ? "primary"
                                : "default"
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <ViewReportCardButton
                          studentId={row.studentId}
                          year={row.year}
                          term={row.term}
                          label="View Card"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      </Card>
    </DashboardLayout>
  );
}
