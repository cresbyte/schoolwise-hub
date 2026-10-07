"use client";
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState, useMemo } from "react";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { timetables as MOCK_TIMETABLES } from "@/lib/mockData";

export function TimetableTab({ student }) {
  const mockSlots = useMemo(() => {
    const tt = MOCK_TIMETABLES[student.classId];
    if (tt && tt.length > 0) return tt;
    // Fallback generic timetable
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = [
      ["08:00", "08:40"],
      ["08:40", "09:20"],
      ["09:20", "10:00"],
      ["10:20", "11:00"],
      ["11:00", "11:40"],
      ["11:40", "12:20"],
      ["13:00", "14:00"],
      ["14:00", "14:40"],
      ["14:40", "15:20"],
    ];
    const subs844 = [
      "Mathematics",
      "English",
      "Kiswahili",
      "Physics",
      "Chemistry",
      "Biology",
      "History",
      "Geography",
      "C.R.E",
    ];
    const subsCBC = [
      "Mathematics",
      "English",
      "Kiswahili",
      "Science & Tech",
      "Social Studies",
      "Creative Arts",
      "Agriculture",
      "Religious Education",
      "Mathematics",
    ];
    const subjectList = student.curriculum === "CBC" ? subsCBC : subs844;
    const slots = [];
    days.forEach((day) => {
      periods.forEach(([start, end], idx) => {
        const isBreak = start === "10:00" || start === "13:00";
        slots.push({
          id: `tt-${day}-${idx}`,
          classId: student.classId,
          day,
          periodNumber: idx + 1,
          startTime: start,
          endTime: end,
          isBreak,
          breakName: start === "10:00" ? "Morning Break" : start === "13:00" ? "Lunch Break" : null,
          subjectName: !isBreak
            ? subjectList[(idx + days.indexOf(day)) % subjectList.length]
            : null,
          teacherName: !isBreak ? "Ms. Grace Mwangi" : null,
        });
      });
    });
    return slots;
  }, [student]);

  const { data: slots = [], loading } = useAsync(
    () =>
      api
        .getTimetable(student.classId)
        .then((r) => (r && r.length > 0 ? r : mockSlots))
        .catch(() => mockSlots),
    [student.classId],
  );

  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(today)
      ? today
      : "Monday";
  });

  if (loading) return <DataState loading={true} data={null} children={<Box />} />;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slotList = slots || mockSlots;
  const slotsByDay = days.reduce((acc, d) => {
    acc[d] = slotList.filter((s) => s.day === d).sort((a, b) => a.periodNumber - b.periodNumber);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ mb: 2, display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
        {days.map((d) => (
          <Chip
            key={d}
            label={d.substring(0, 3)}
            onClick={() => setActiveDay(d)}
            color={activeDay === d ? "primary" : "default"}
            sx={{ flexShrink: 0 }}
          />
        ))}
      </Box>

      {/* Mobile / single-day view */}
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {(slotsByDay[activeDay] || []).length > 0 ? (
          (slotsByDay[activeDay] || []).map((s) => (
            <Box
              key={s.id}
              sx={{
                p: 2,
                borderBottom: "1px solid rgba(0,0,0,0.1)",
                bgcolor: s.isBreak ? "action.hover" : "inherit",
                "&:last-child": { borderBottom: 0 },
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {s.startTime} - {s.endTime}
              </Typography>
              {s.isBreak ? (
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {s.breakName}
                </Typography>
              ) : (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {s.subjectName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.teacherName}
                  </Typography>
                </>
              )}
            </Box>
          ))
        ) : (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No lessons today
            </Typography>
          </Box>
        )}
      </Box>

      {/* Desktop table view */}
      <TableContainer
        sx={{
          display: { xs: "none", md: "block" },
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell>Time</TableCell>
              {days.map((d) => (
                <TableCell
                  key={d}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    bgcolor: d === activeDay ? "primary.main" : "inherit",
                    color: d === activeDay ? "white" : "inherit",
                  }}
                >
                  {d}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 9 }).map((_, periodIdx) => {
              const periodNum = periodIdx + 1;
              const anySlot = slotList.find((s) => s.periodNumber === periodNum);
              if (!anySlot) return null;
              return (
                <TableRow key={periodNum}>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>
                    <Typography variant="body2">
                      {anySlot.startTime} - {anySlot.endTime}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Period {periodNum}
                    </Typography>
                  </TableCell>
                  {days.map((d) => {
                    const slot = slotList.find((s) => s.day === d && s.periodNumber === periodNum);
                    if (!slot) return <TableCell key={d} />;
                    if (slot.isBreak)
                      return (
                        <TableCell
                          key={d}
                          sx={{ bgcolor: "action.hover", textAlign: "center", fontWeight: 700 }}
                        >
                          {slot.breakName}
                        </TableCell>
                      );
                    return (
                      <TableCell
                        key={d}
                        align="center"
                        sx={{ bgcolor: d === activeDay ? "primary.main" + "08" : "inherit" }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {slot.subjectName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {slot.teacherName}
                        </Typography>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
