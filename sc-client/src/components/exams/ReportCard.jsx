"use client";

import {
  Box,
  Card,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export function ReportCard({ card }) {
  if (!card) return null;
  const { student, exam, subjects, totals, comments } = card;

  return (
    <Card sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
      <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          REPORT CARD
        </Typography>
        <Typography variant="subtitle1">{exam.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {exam.term}
        </Typography>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Field label="Student" value={student.name} />
          <Field label="Admission" value={student.admissionNumber} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Field label="Grade" value={student.gradeLevel} />
          <Field label="Class" value={student.className} />
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="center">Grade</TableCell>
              <TableCell align="right">Points</TableCell>
              <TableCell>Teacher's remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((s) => (
              <TableRow key={s.subjectId}>
                <TableCell sx={{ fontWeight: 500 }}>{s.subjectName}</TableCell>
                <TableCell align="right">{s.score ?? "—"}</TableCell>
                <TableCell align="center">
                  {s.grade ? (
                    <Chip
                      size="small"
                      label={s.grade}
                      color={
                        s.grade === "EE"
                          ? "success"
                          : s.grade === "ME"
                            ? "info"
                            : s.grade === "AE"
                              ? "warning"
                              : "error"
                      }
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell align="right">{s.points || "—"}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{s.comment || ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Total points
          </Typography>
          <Typography variant="h6">{totals.totalPoints}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Mean points
          </Typography>
          <Typography variant="h6">{totals.meanPoints}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Mean score
          </Typography>
          <Typography variant="h6">{totals.meanScore}%</Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Class teacher's comment
          </Typography>
          <Typography variant="body2">{comments.classTeacher || "(no comment)"}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Head teacher's comment
          </Typography>
          <Typography variant="body2">{comments.headTeacher || "(no comment)"}</Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function Field({ label, value }) {
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
}
