"use client";

import { useMemo } from "react";
import {
  Box, Button, Card, CardContent, Chip, Grid, Typography, Stack
} from "@mui/material";
import { People, EventAvailable, Assignment } from "@mui/icons-material";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

export function MyClassesTab({ user, staffProfile, onSwitchTab }) {
  // Fetch teacher's assigned classes
  const { data: assignments = [], loading } = useAsync(
    async () => {
      try {
        const res = await api.getClassSubjects({ teacherId: user.staffId || user.id });
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    [user?.staffId, user?.id]
  );

  // Group by class
  const classesGrouped = useMemo(() => {
    const map = {};
    (assignments || []).forEach((a) => {
      const classId = a.class_room || a.classId || a.class_room_id;
      const className = a.class_room_name || a.className || a.class_name || "Unknown Class";
      if (!map[classId]) {
        map[classId] = {
          id: classId,
          name: className,
          subjects: [],
          studentCount: a.student_count || 0,
        };
      }
      map[classId].subjects.push({
        id: a.subject || a.subjectId || a.subject_id,
        name: a.subject_name || a.subjectName,
        periodsPerWeek: a.periods_per_week || a.periodsPerWeek || 0,
      });
    });
    return Object.values(map);
  }, [assignments]);

  if (loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}>Loading your classes...</Box>;
  }

  if (classesGrouped.length === 0) {
    return (
      <Alert severity="info">
        No classes are currently assigned to you. Please contact the headteacher.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
        My Classes ({classesGrouped.length})
      </Typography>

      <Grid container spacing={2}>
        {classesGrouped.map((cls) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cls.id}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {cls.name}
                  </Typography>
                  <Chip
                    size="small"
                    icon={<People fontSize="small" />}
                    label={cls.studentCount}
                    variant="outlined"
                  />
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  MY SUBJECTS
                </Typography>
                <Stack spacing={0.5} sx={{ mb: 2, mt: 1 }}>
                  {cls.subjects.map((sub) => (
                    <Box key={sub.id} sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {sub.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sub.periodsPerWeek} periods/wk
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Stack spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    startIcon={<EventAvailable />}
                    onClick={() => onSwitchTab(2)}
                  >
                    Mark Attendance
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    startIcon={<Assignment />}
                    onClick={() => onSwitchTab(3)}
                  >
                    View Grades
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
