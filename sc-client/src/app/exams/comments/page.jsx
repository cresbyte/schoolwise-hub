"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SaveIcon from "@mui/icons-material/Save";
import InfoIcon from "@mui/icons-material/Info";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function TeacherCommentsPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [term, setTerm] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [comments, setComments] = useState({}); // studentId -> comment string
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // 1. Fetch all classes
  const { data: allClasses, loading: classesLoading } = useAsync(() => api.getClasses(), []);

  // 2. FIX: Use String() to prevent type mismatch (e.g., number 1 vs string "1")
  const myClasses = (allClasses || []).filter(
    (c) => c.classTeacherId && String(c.classTeacherId) === String(user?.id),
  );

  useEffect(() => {
    if (myClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(myClasses[0].id);
    }
  }, [myClasses, selectedClassId]);

  // 3. Fetch class report cards (which includes the existing classTeacherComment for each student)
  const {
    data: classData,
    loading: dataLoading,
    error,
    refetch,
  } = useAsync(
    () =>
      selectedClassId && year && term
        ? api.exams.getClassReportCards(selectedClassId, year, term)
        : Promise.resolve([]),
    [selectedClassId, year, term],
  );

  // 4. Initialize the comments state when data loads
  useEffect(() => {
    if (classData) {
      const initialComments = {};
      classData.forEach((student) => {
        initialComments[student.studentId] = student.classTeacherComment || "";
      });
      setComments(initialComments);
    }
  }, [classData]);

  const handleCommentChange = (studentId, value) => {
    setComments((prev) => ({ ...prev, [studentId]: value }));
  };

const handleSaveAll = async () => {
  if (!classData) return;
  setSaving(true);
  try {
    // Prepare the bulk payload
    const commentsPayload = classData.map((student) => ({
      studentId: student.studentId,
      comment: comments[student.studentId] || "",
    }));

    // Single API call instead of Promise.all()
    await api.exams.saveBulkStudentComments(year, term, commentsPayload);

    setSnackbar({ open: true, message: "All comments saved successfully!", severity: "success" });
    refetch();
  } catch (e) {
    setSnackbar({ open: true, message: e.message || "Failed to save comments", severity: "error" });
  } finally {
    setSaving(false);
  }
};

  return (
    <DashboardLayout>
      <PageHeader
        title="Class Teacher Comments"
        subtitle="Write overall term comments for your students"
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
              <MenuItem value={currentYear - 1}>{currentYear - 1}</MenuItem>
              <MenuItem value={currentYear}>{currentYear}</MenuItem>
              <MenuItem value={currentYear + 1}>{currentYear + 1}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Term</InputLabel>
            <Select value={term} label="Term" onChange={(e) => setTerm(Number(e.target.value))}>
              <MenuItem value={1}>Term 1</MenuItem>
              <MenuItem value={2}>Term 2</MenuItem>
              <MenuItem value={3}>Term 3</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClassId}
              label="Class"
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {myClasses.length === 0 ? (
                <MenuItem disabled>You are not assigned as a class teacher</MenuItem>
              ) : (
                myClasses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Stack>
      </Card>

      {myClasses.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            You are not currently assigned as a class teacher for any class.
            <br />
            <Typography variant="caption" color="text.disabled">
              (Debug: Your User ID is {user?.id}. Checked against classTeacherId)
            </Typography>
          </Typography>
        </Card>
      ) : (
        <Card>
          <DataState
            loading={dataLoading || classesLoading}
            error={error}
            data={classData}
            onRetry={refetch}
            isEmpty={(d) => !d || d.length === 0}
            emptyMessage="No report card data found yet. Ensure scores have been entered for this class and term first."
          >
            {() => (
              <>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "info.light",
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <InfoIcon color="info" fontSize="small" />
                  <Typography variant="body2" color="info.dark">
                    These comments will appear at the bottom of the student's official printed
                    report card.
                  </Typography>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Adm No</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Position</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: "40%" }}>
                          Overall Comment
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classData.map((student) => (
                        <TableRow key={student.studentId} hover>
                          <TableCell>{student.admissionNumber}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{student.studentName}</TableCell>
                          <TableCell>
                            {student.position ? `${student.position} / ${student.classSize}` : "-"}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth

                              value={comments[student.studentId] || ""}
                              onChange={(e) =>
                                handleCommentChange(student.studentId, e.target.value)
                              }
                              placeholder="e.g., A diligent student who has shown great improvement this term..."
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "flex-end",
                    borderTop: "1px solid #eee",
                    bgcolor: "background.paper",
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveAll}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save All Comments"}
                  </Button>
                </Box>
              </>
            )}
          </DataState>
        </Card>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
