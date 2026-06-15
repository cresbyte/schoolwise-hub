"use client";

/**
 * Daily attendance register per class.
 * @module attendance/page
 */
import { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { ClassSelect } from "@/components/ClassSelect";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";

export default function AttendancePage() {
  return (
    <DashboardLayout>
      <AttendanceContent />
    </DashboardLayout>
  );
}

const STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "Present", color: "#2E7D32" },
  { value: "absent", label: "Absent", color: "#C62828" },
  { value: "late", label: "Late", color: "#EF6C00" },
  { value: "excused", label: "Excused", color: "#1565C0" },
];

/** Attendance register content. */
function AttendanceContent() {
  const { showNotification } = useNotification();
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const students = useAsync(() => (classId ? api.getStudentsByClass(classId) : Promise.resolve([])), [classId]);
  const list = students.data ?? [];

  useEffect(() => {
    setRecords(Object.fromEntries(list.map((s) => [s.id, "present" as AttendanceStatus])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students.data, date]);

  const setStatus = (id: string, status: AttendanceStatus) => setRecords((p) => ({ ...p, [id]: status }));
  const counts = STATUSES.map((s) => ({ ...s, count: Object.values(records).filter((v) => v === s.value).length }));

  const save = async () => {
    if (!classId) return;
    setSaving(true);
    const payload: AttendanceRecord[] = list.map((s) => ({
      id: `att-${s.id}-${date}`, studentId: s.id, studentName: `${s.firstName} ${s.lastName}`, classId,
      date, status: records[s.id] ?? "present", recordedBy: "Class Teacher", recordedAt: new Date().toISOString(),
      parentNotified: records[s.id] === "absent",
    }));
    await api.saveAttendance(classId, date, payload);
    setSaving(false);
    showNotification(`Attendance saved for ${list.length} students`, "success");
  };

  return (
    <>
      <PageHeader title="Attendance" subtitle="Mark daily class attendance" />
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <ClassSelect value={classId} onChange={setClassId} allOption={false} label="Select Class" />
          <TextField type="date" size="small" label="Date" value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          {classId && counts.map((c) => <Chip key={c.value} size="small" label={`${c.label}: ${c.count}`} sx={{ bgcolor: `${c.color}19`, color: c.color, fontWeight: 600 }} />)}
        </Box>
      </Card>
      {!classId ? (
        <Card><CardContent><Typography variant="body2" color="text.secondary">Select a class to take attendance.</Typography></CardContent></Card>
      ) : (
        <Card>
          <CardContent>
            <Table size="small">
              <TableHead><TableRow><TableCell>Adm.</TableCell><TableCell>Student</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {list.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{s.admissionNumber}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</TableCell>
                    <TableCell>
                      <ToggleButtonGroup size="small" exclusive value={records[s.id] ?? "present"} onChange={(_, v) => v && setStatus(s.id, v)}>
                        {STATUSES.map((st) => (
                          <ToggleButton key={st.value} value={st.value} sx={{ "&.Mui-selected": { bgcolor: `${st.color}22`, color: st.color, fontWeight: 700 } }}>
                            {st.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Attendance"}</Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </>
  );
}
