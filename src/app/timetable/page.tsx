"use client";

/**
 * Class timetable grid (days × periods).
 * @module timetable/page
 */
import { useState } from "react";
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
import * as api from "@/lib/mockApi";
import { DAYS_OF_WEEK } from "@/lib/constants";

export default function TimetablePage() {
  return (
    <DashboardLayout>
      <TimetableContent />
    </DashboardLayout>
  );
}

/** Class timetable content. */
function TimetableContent() {
  const [classId, setClassId] = useState("cls-7");
  const tt = useAsync(() => api.getTimetable(classId), [classId]);
  const slots = tt.data ?? [];
  const periods = Array.from(new Set(slots.map((s: any) => s.periodNumber))).sort((a: any, b: any) => a - b);

  return (
    <>
      <PageHeader title="Timetable" subtitle="Weekly class timetable" />
      <Card sx={{ p: 2, mb: 2 }}>
        <ClassSelect value={classId} onChange={setClassId} allOption={false} label="Select Class" />
      </Card>
      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <DataState loading={tt.loading} error={tt.error} data={slots} onRetry={tt.refetch} isEmpty={(d: any) => d.length === 0}>
            {() => (
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                    {DAYS_OF_WEEK.map((d) => <TableCell key={d} sx={{ fontWeight: 700 }}>{d}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periods.map((p: any) => {
                    const sample = slots.find((s: any) => s.periodNumber === p);
                    return (
                      <TableRow key={p}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>P{p}</Typography>
                          <Typography variant="caption" color="text.secondary">{sample?.startTime}–{sample?.endTime}</Typography>
                        </TableCell>
                        {DAYS_OF_WEEK.map((d) => {
                          const slot = slots.find((s: any) => s.day === d && s.periodNumber === p);
                          if (!slot) return <TableCell key={d}>—</TableCell>;
                          if (slot.isBreak) return <TableCell key={d}><Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 0.75, textAlign: "center" }}><Typography variant="caption" sx={{ fontWeight: 600 }}>{slot.breakName ?? "Break"}</Typography></Box></TableCell>;
                          return (
                            <TableCell key={d}>
                              <Box sx={{ bgcolor: "primary.main", color: "#fff", borderRadius: 1, p: 0.75 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>{slot.subjectName}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.85 }}>{slot.teacherName}</Typography>
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
