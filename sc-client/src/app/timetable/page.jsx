"use client";

import { useState, useEffect } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { ClassSelect } from "@/components/ClassSelect";
import { useAsync } from "@/hooks/useAsync";
import { useClasses } from "@/hooks/domain";
import { api } from "@/lib/api";
import { DAYS_OF_WEEK } from "@/lib/constants";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Stack from "@mui/material/Stack";
import { useAuth } from "@/context/AuthContext";

export default function TimetablePage() {
  return (
    <DashboardLayout>
      <TimetableContent />
    </DashboardLayout>
  );
}

function TimetableContent() {
  const { user } = useAuth();
  const { data: classes = [] } = useClasses();
  const [viewMode, setViewMode] = useState("personal"); // "personal" | "class"
  const [classId, setClassId] = useState("");

  useEffect(() => {
    if (!classId && classes?.length > 0) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  const tt = useAsync(
    () =>
      viewMode === "personal"
        ? api.getTeacherTimetable(user?.staffId || user?.id || "")
        : classId
          ? api.getTimetable(classId)
          : Promise.resolve([]),
    [viewMode, classId, user],
  );

  const slots = tt.data ?? [];
  const periods = Array.from(new Set(slots.map((s) => s.periodNumber))).sort((a, b) => a - b);

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle={viewMode === "personal" ? "My Personal Teaching Schedule (Read-Only)" : "Class Timetable (Read-Only)"}
      />
      <Card sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" sx={{ px: 2, pt: 1 }}>
          <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)}>
            <Tab label="My Personal Schedule" value="personal" />
            <Tab label="Class Timetables" value="class" />
          </Tabs>

          {viewMode === "class" && (
            <Box sx={{ pb: 1, pt: { xs: 1, sm: 0 } }}>
              <ClassSelect value={classId} onChange={setClassId} allOption={false} label="Select Class" />
            </Box>
          )}
        </Stack>
      </Card>

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <DataState
            loading={tt.loading}
            error={tt.error}
            data={slots}
            onRetry={tt.refetch}
            isEmpty={(d) => d.length === 0}
            emptyMessage={viewMode === "personal" ? "No lessons assigned to your timetable schedule." : "No slots defined for this class."}
          >
            {() => (
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                    {DAYS_OF_WEEK.map((d) => (
                      <TableCell key={d} sx={{ fontWeight: 700 }}>
                        {d}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periods.map((p) => {
                    const sample = slots.find((s) => s.periodNumber === p);
                    return (
                      <TableRow key={p}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                            P{p}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sample?.startTime}–{sample?.endTime}
                          </Typography>
                        </TableCell>
                        {DAYS_OF_WEEK.map((d) => {
                          const slot = slots.find((s) => s.day === d && s.periodNumber === p);
                          if (!slot) return <TableCell key={d}>—</TableCell>;
                          if (slot.isBreak)
                            return (
                              <TableCell key={d}>
                                <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 0.75, textAlign: "center" }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {slot.breakName ?? "Break"}
                                  </Typography>
                                </Box>
                              </TableCell>
                            );
                          return (
                            <TableCell key={d}>
                              <Box sx={{ bgcolor: "primary.main", color: "#fff", borderRadius: 1, p: 0.75 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                                  {slot.subjectName}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.85, display: "block" }}>
                                  {viewMode === "personal" ? slot.className : slot.teacherName}
                                </Typography>
                                {slot.roomName && (
                                  <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 10 }}>
                                    📍 {slot.roomName}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </DataState>
        </CardContent>
      </Card>
    </>
  );
}
