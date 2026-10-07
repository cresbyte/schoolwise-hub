"use client";

/**
 * Classes: grouped by grade (PP1, Grade 9 ...) with the streams listed under each grade.
 * @module classes/page
 */
import { useState } from "react";
import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { GRADE_LEVELS, getTeachers, gradeRank } from "@/lib/grades";

export default function ClassesPage() {
  return (
    <DashboardLayout>
      <ClassesContent />
    </DashboardLayout>
  );
}

/** Group classrooms by grade level, in curriculum order. */
function groupByGrade(classes) {
  const groups = {};
  classes.forEach((c) => {
    if (!groups[c.gradeLevel]) groups[c.gradeLevel] = [];
    groups[c.gradeLevel].push(c);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => gradeRank(a) - gradeRank(b) || a.localeCompare(b))
    .map(([grade, streams]) => [
      grade,
      [...streams].sort((x, y) => (x.stream || "").localeCompare(y.stream || "")),
    ]);
}

/** The backend needs an id for a new class. Same style as the model's own generator. */
function makeId(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 30);
  return `cls-${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

function ClassesContent() {
  const { data, loading, error, refetch } = useAsync(() => api.getClasses(), []);
  const staff = useAsync(() => api.getStaff(), []);
  const [dialog, setDialog] = useState(null);

  const classes = Array.isArray(data) ? data : [];
  const teachers = getTeachers(staff.data);

  return (
    <>
      <PageHeader
        title="Classes & Streams"
        subtitle="Each grade has one or more streams, and each stream has a class teacher"
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" onClick={() => setDialog({ mode: "create", gradeLevel: "" })}>
          Add class or stream
        </Button>
      </Box>

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() => (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {groupByGrade(classes).map(([grade, streams]) => (
              <Card key={grade}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {grade}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${streams.length} ${streams.length === 1 ? "stream" : "streams"}`}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      size="small"
                      onClick={() => setDialog({ mode: "create", gradeLevel: grade })}
                    >
                      Add stream
                    </Button>
                  </Box>
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Stream</TableCell>
                          <TableCell>Class teacher</TableCell>
                          <TableCell>Room</TableCell>
                          <TableCell align="right">Students</TableCell>
                          <TableCell align="right">Capacity</TableCell>
                          <TableCell align="right" />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {streams.map((room) => (
                          <TableRow key={room.id}>
                            <TableCell>{room.name}</TableCell>
                            <TableCell>{room.classTeacherName || "Not assigned"}</TableCell>
                            <TableCell>{room.room || "-"}</TableCell>
                            <TableCell align="right">{room.studentCount ?? 0}</TableCell>
                            <TableCell align="right">{room.capacity}</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                              <Button
                                size="small"
                                component={Link}
                                href={`/settings/classes/${room.id}/subjects`}
                              >
                                Subjects & teachers
                              </Button>
                              <Button
                                size="small"
                                onClick={() => setDialog({ mode: "edit", room })}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DataState>

      {dialog && (
        <StreamDialog
          dialog={dialog}
          classes={classes}
          teachers={teachers}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

/** Add or edit one stream. The grade cannot change on edit, because subjects are assigned per grade. */
function StreamDialog({ dialog, classes, teachers, onClose, onSaved }) {
  const { showNotification } = useNotification();
  const editing = dialog.mode === "edit";
  const existing = dialog.room;

  const [form, setForm] = useState({
    gradeLevel: editing ? existing.gradeLevel : dialog.gradeLevel,
    stream: editing ? existing.stream || "" : "",
    capacity: editing ? existing.capacity : 40,
    room: editing ? existing.room || "" : "",
    classTeacherId: editing ? (existing.classTeacherId ?? "") : "",
  });
  const [saving, setSaving] = useState(false);

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // If an old class uses a spelling that is not in the list, still show it so the form is not blank.
  const gradeOptions =
    form.gradeLevel && !GRADE_LEVELS.includes(form.gradeLevel)
      ? [form.gradeLevel, ...GRADE_LEVELS]
      : GRADE_LEVELS;

  async function save() {
    const stream = form.stream.trim();
    if (!form.gradeLevel || !stream) {
      showNotification("Choose a grade and enter a stream name", "error");
      return;
    }
    const duplicate = classes.some(
      (c) =>
        c.id !== existing?.id &&
        c.gradeLevel === form.gradeLevel &&
        (c.stream || "").toLowerCase() === stream.toLowerCase(),
    );
    if (duplicate) {
      showNotification(`${form.gradeLevel} ${stream} already exists`, "error");
      return;
    }

    const name = `${form.gradeLevel} ${stream}`;
    const payload = {
      name,
      gradeLevel: form.gradeLevel,
      stream,
      capacity: Number(form.capacity) || 40,
      room: form.room.trim() || null,
      classTeacherId: form.classTeacherId || null,
    };

    setSaving(true);
    try {
      if (editing) {
        await api.updateClass(existing.id, payload);
      } else {
        await api.createClass({
          ...payload,
          id: makeId(name),
          academicYear: new Date().getFullYear(),
        });
      }
      showNotification(editing ? "Stream updated" : "Stream added", "success");
      onSaved();
    } catch (e) {
      showNotification(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? `Edit ${existing.name}` : "Add class or stream"}</DialogTitle>
      <DialogContent>
        <Box
          sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, pt: 1 }}
        >
          <TextField
            select
            label="Grade"
            size="small"
            value={form.gradeLevel}
            onChange={setField("gradeLevel")}
            disabled={editing}
          >
            {gradeOptions.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Stream"
            size="small"
            value={form.stream}
            onChange={setField("stream")}
            helperText="For example West, North, or A"
          />
          <TextField
            select
            label="Class teacher"
            size="small"
            value={form.classTeacherId}
            onChange={setField("classTeacherId")}
          >
            <MenuItem value="">Not assigned</MenuItem>
            {teachers.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Room" size="small" value={form.room} onChange={setField("room")} />
          <TextField
            label="Capacity"
            size="small"
            type="number"
            value={form.capacity}
            onChange={setField("capacity")}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
