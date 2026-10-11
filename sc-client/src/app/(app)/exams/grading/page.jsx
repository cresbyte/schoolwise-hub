"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useAsync } from "@/hooks/useAsync";
import { academicsApi } from "@/lib/academicsApi";
import { EXAM_STATUS, examsApi } from "@/lib/examsApi";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  LinearProgress,
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

export default function MyGradingPage() {
  return (
    <PageGuard permission="exams.marks">
      <MyGradingContent />
    </PageGuard>
  );
}

// Subjects arrive ordered by grade, so a Map keeps the grades in order.
function groupByGrade(subjects) {
  const map = new Map();
  subjects.forEach((s) => {
    if (!map.has(s.gradeLevel)) map.set(s.gradeLevel, []);
    map.get(s.gradeLevel).push(s);
  });
  return [...map.entries()];
}

function MyGradingContent() {
  const router = useRouter();

  const { data, loading, error, refetch } = useAsync(async () => {
    const [groups, classes] = await Promise.all([
      examsApi.getMyGrading(),
      academicsApi.getClasses(),
    ]);
    return {
      groups: Array.isArray(groups) ? groups : [],
      classes: Array.isArray(classes) ? classes : [],
    };
  }, []);

  const groups = data?.groups ?? [];
  const classes = data?.classes ?? [];
  const classById = Object.fromEntries(classes.map((c) => [c.id, c]));

  // If the exam is limited to classes, open the marks page on the right one.
  const openMarks = (exam, subject) => {
    const inGrade = (exam.classRooms || []).filter(
      (id) => classById[id]?.gradeLevel === subject.gradeLevel,
    );
    const qs = inGrade.length === 1 ? `?class_room=${inGrade[0]}` : "";
    router.push(`/exams/${exam.id}/grade/${subject.id}${qs}`);
  };

  return (
    <>
      <PageHeader
        title="My grading"
        subtitle="Exams open for marks entry, showing only the subjects you teach."
      />

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => groups.length === 0}
        emptyMessage="No exams are currently open for marks entry."
      >
        {() => (
          <Stack spacing={3}>
            {groups.map((g) => {
              const exam = g.exam;
              const status = EXAM_STATUS[exam.status];
              const scope = (exam.classRooms || [])
                .map((id) => classById[id]?.name)
                .filter(Boolean);

              return (
                <Card key={exam.id} sx={{ p: 3 }}>
                  {/* Which exam is this? */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6">{exam.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {exam.termLabel} · {exam.academicYearName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {exam.start_date} → {exam.end_date}
                      </Typography>
                    </Box>
                    <Chip size="small" label={status?.label} color={status?.color} />
                  </Stack>

                  {/* Who is it for? */}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mt: 2 }}
                    flexwrap="wrap"
                    useFlexGap
                  >
                    <Typography variant="caption" color="text.secondary">
                      Applies to:
                    </Typography>
                    {scope.length > 0 ? (
                      scope.map((name) => (
                        <Chip key={name} size="small" variant="outlined" label={name} />
                      ))
                    ) : (
                      <Chip size="small" variant="outlined" label="Whole grade" />
                    )}
                  </Stack>

                  {/* One table per grade */}
                  {groupByGrade(g.subjects).map(([grade, subjects]) => (
                    <Box key={grade} sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {grade}
                      </Typography>
                      <Divider sx={{ mb: 1 }} />
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Subject</TableCell>
                              <TableCell>Code</TableCell>
                              <TableCell sx={{ width: 180 }}>Marks entered</TableCell>
                              <TableCell align="right" sx={{ width: 140 }} />
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {subjects.map((s) => (
                              <TableRow key={s.id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{s.subjectName}</TableCell>
                                <TableCell>
                                  <Chip size="small" variant="outlined" label={s.subjectCode} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption">{s.markCount}</Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(100, ((s.markCount || 0) / 40) * 100)}
                                    sx={{ height: 5, borderRadius: 3, mt: 0.5 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => openMarks(exam, s)}
                                  >
                                    Enter marks
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ))}
                </Card>
              );
            })}
          </Stack>
        )}
      </DataState>
    </>
  );
}
