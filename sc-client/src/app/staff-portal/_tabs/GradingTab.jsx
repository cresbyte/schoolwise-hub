"use client";

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
  LinearProgress,
  Chip,
  Stack,
} from "@mui/material";
import { EditNote, CheckCircle } from "@mui/icons-material";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export function GradingTab({ user }) {
  const router = useRouter();

  const {
    data: tasks = [],
    loading,
    error,
    refetch,
  } = useAsync(async () => {
    try {
      const res = await api.exams.getMyGrading();
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }, []);

  if (loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}>Loading grading tasks...</Box>;
  }

  if (tasks.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          No grading tasks assigned to you at the moment.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
        My Grading Tasks ({tasks.length})
      </Typography>

      <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell>Exam</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell sx={{ minWidth: 200 }}>Progress</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => {
              const pct =
                task.totalCount > 0 ? Math.round((task.gradedCount / task.totalCount) * 100) : 0;
              const isComplete = task.gradedCount === task.totalCount && task.totalCount > 0;
              const isPublished = task.status === "published";

              return (
                <TableRow key={task.examSubjectId} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{task.examName}</TableCell>
                  <TableCell>{task.className}</TableCell>
                  <TableCell>{task.subjectName}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="body2"
                        fontWeight={isComplete ? "bold" : "normal"}
                        color={isComplete ? "success.main" : "text.primary"}
                      >
                        {task.gradedCount}/{task.totalCount}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        color={isComplete ? "success" : "primary"}
                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {pct}%
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {isPublished ? (
                      <Chip size="small" label="Published" color="success" icon={<CheckCircle />} />
                    ) : isComplete ? (
                      <Chip size="small" label="Ready to Publish" color="info" />
                    ) : (
                      <Chip size="small" label="In Progress" color="warning" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditNote />}
                      disabled={isPublished}
                      onClick={() =>
                        router.push(`/exams/${task.examId}/scores?subjectId=${task.examSubjectId}`)
                      }
                    >
                      {isPublished ? "Published" : isComplete ? "View" : "Enter Scores"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
