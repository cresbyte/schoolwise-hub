"use client";

import { useState } from "react";
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
  Chip,
  LinearProgress,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

const EXAM_TYPE_LABELS = {
  cat: "CAT",
  midterm: "Mid-Term",
  endterm: "End of Term",
  opener: "Opener",
  mock: "Mock",
  assignment: "Assignment",
};

const STATUS_COLORS = {
  upcoming: "info",
  in_progress: "warning",
  completed: "default",
  published: "success",
};

export default function StaffGradingPage() {
  const [yearFilter, setYearFilter] = useState("");
  const [termFilter, setTermFilter] = useState("");

  const { data: tasks, loading, error, refetch } = useAsync(() => api.exams.getMyGrading(), []);

  const allTasks = tasks || [];

  // Apply filters
  const filteredTasks = allTasks.filter((t) => {
    if (yearFilter && t.year !== Number(yearFilter)) return false;
    if (termFilter && t.term !== Number(termFilter)) return false;
    return true;
  });

  // Group by exam for cleaner display
  const groupedByExam = filteredTasks.reduce((acc, task) => {
    const key = `${task.examId}-${task.examName}`;
    if (!acc[key]) {
      acc[key] = {
        examId: task.examId,
        examName: task.examName,
        examType: task.examType,
        year: task.year,
        term: task.term,
        status: task.status,
        subjects: [],
      };
    }
    acc[key].subjects.push(task);
    return acc;
  }, {});

  const examGroups = Object.values(groupedByExam);

  // Calculate overall stats
  const totalSubjects = allTasks.length;
  const completedSubjects = allTasks.filter(
    (t) => t.gradedCount === t.totalCount && t.totalCount > 0,
  ).length;
  const totalStudents = allTasks.reduce((sum, t) => sum + t.totalCount, 0);
  const gradedStudents = allTasks.reduce((sum, t) => sum + t.gradedCount, 0);

  return (
    <DashboardLayout>
      <PageGuard permission="exams.view">
        <PageHeader
          title="My Grading"
          subtitle="Enter scores for your assigned classes and subjects"
        />

        {/* Stats Overview */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <Card sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              My Subjects
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {totalSubjects}
            </Typography>
          </Card>
          <Card sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {completedSubjects} / {totalSubjects}
            </Typography>
          </Card>
          <Card sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Students Graded
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {gradedStudents} / {totalStudents}
            </Typography>
          </Card>
        </Stack>

        {/* Filters */}
        <Card sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              size="small"
              label="Year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              sx={{ width: 120 }}
            >
              <MenuItem value="">All Years</MenuItem>
              <MenuItem value="2025">2025</MenuItem>
              <MenuItem value="2026">2026</MenuItem>
              <MenuItem value="2027">2027</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Term"
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              sx={{ width: 120 }}
            >
              <MenuItem value="">All Terms</MenuItem>
              <MenuItem value="1">Term 1</MenuItem>
              <MenuItem value="2">Term 2</MenuItem>
              <MenuItem value="3">Term 3</MenuItem>
            </TextField>
          </Stack>
        </Card>

        {/* Grading Tasks */}
        <DataState
          loading={loading}
          error={error}
          data={examGroups}
          onRetry={refetch}
          isEmpty={(d) => d.length === 0}
          emptyMessage="You are not currently assigned to grade any subjects."
        >
          {() => (
            <Stack spacing={2}>
              {examGroups.map((group) => (
                <Card key={group.examId}>
                  {/* Exam Header */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "action.hover",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {group.examName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Term {group.term}, {group.year} ·{" "}
                          {EXAM_TYPE_LABELS[group.examType] || group.examType}
                        </Typography>
                      </Box>
                      <Chip
                        label={group.status.replace("_", " ").toUpperCase()}
                        color={STATUS_COLORS[group.status] || "default"}
                        size="small"
                      />
                    </Stack>
                  </Box>

                  {/* Subjects Table */}
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Class</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell sx={{ minWidth: 200 }}>Progress</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.subjects.map((task) => {
                          const pct =
                            task.totalCount > 0
                              ? Math.round((task.gradedCount / task.totalCount) * 100)
                              : 0;
                          const isComplete =
                            task.gradedCount === task.totalCount && task.totalCount > 0;
                          const isLocked = task.status === "published";

                          return (
                            <TableRow key={task.examSubjectId} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{task.className}</TableCell>
                              <TableCell>{task.subjectName}</TableCell>
                              <TableCell>
                                <Box
                                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
                                >
                                  <Typography
                                    variant="body2"
                                    fontWeight={isComplete ? "bold" : "normal"}
                                    color={isComplete ? "success.main" : "text.primary"}
                                  >
                                    {task.gradedCount} / {task.totalCount}
                                  </Typography>
                                  {isComplete && (
                                    <Chip
                                      label="Complete"
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={pct}
                                  color={isComplete ? "success" : "primary"}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                {isLocked ? (
                                  <Chip label="Locked" size="small" color="default" />
                                ) : (
                                  <Button
                                    component={Link}
                                    href={`/exams/${task.examId}/scores?subjectId=${task.examSubjectId}`}
                                    variant="contained"
                                    size="small"
                                    startIcon={<EditNoteIcon />}
                                  >
                                    Enter Scores
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              ))}
            </Stack>
          )}
        </DataState>
      </PageGuard>
    </DashboardLayout>
  );
}
