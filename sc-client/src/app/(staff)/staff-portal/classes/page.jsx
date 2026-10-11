"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ClassIcon from "@mui/icons-material/Class";
import PeopleIcon from "@mui/icons-material/People";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditNoteIcon from "@mui/icons-material/EditNote";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { staffApi } from "@/lib/staffApi";
import { academicsApi } from "@/lib/academicsApi";
import { api } from "@/lib/api";

export default function StaffClassesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  // Roster modal state
  const [selectedClassForRoster, setSelectedClassForRoster] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterStudents, setRosterStudents] = useState([]);

  const {
    data: classes,
    loading,
    error,
    refetch,
  } = useAsync(async () => {
    if (!user) return [];
    return await staffApi.getMyClasses(user.id, user.role);
  }, [user?.id, user?.role]);

  const classList = classes || [];

  const filteredClasses = classList.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.gradeLevel || "").toLowerCase().includes(q) ||
      (c.stream || "").toLowerCase().includes(q)
    );
  });

  const handleOpenRoster = async (cls) => {
    setSelectedClassForRoster(cls);
    setRosterLoading(true);
    setRosterStudents([]);
    try {
      // Try academicsApi roster first, then api.getStudentsByClass
      let students = await academicsApi.getClassRoster(cls.id).catch(() => null);
      if (!students || !Array.isArray(students)) {
        students = await api.getStudentsByClass(cls.id).catch(() => []);
      }
      setRosterStudents(Array.isArray(students) ? students : []);
    } catch {
      setRosterStudents([]);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleCloseRoster = () => {
    setSelectedClassForRoster(null);
    setRosterStudents([]);
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            My Assigned Classes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Streams where you teach subjects or serve as Class Teacher
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Filter classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: "100%", sm: 260 } }}
        />
      </Stack>

      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      {filteredClasses.length === 0 && !loading ? (
        <Card sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No classes found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search ? "No classes match your search query." : "No classes assigned yet."}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredClasses.map((c) => {
            const studentCount =
              c.studentCount ?? c.studentsCount ?? c.enrolledCount ?? c.enrolled_count ?? 0;

            return (
              <Grid item xs={12} md={4} key={c.id}>
                <Card
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: 4 },
                  }}
                >
                  <CardContent sx={{ p: 2.5, flex: 1 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      sx={{ mb: 2 }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: c.isClassTeacher ? "primary.main" : "primary.light",
                          color: c.isClassTeacher ? "white" : "primary.main",
                          width: 44,
                          height: 44,
                        }}
                      >
                        <ClassIcon />
                      </Avatar>
                      <Stack direction="row" spacing={0.5}>
                        {c.isClassTeacher && (
                          <Chip
                            label="Class Teacher"
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        <Chip label={c.gradeLevel || "Grade"} variant="outlined" size="small" />
                      </Stack>
                    </Stack>

                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {c.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {c.stream ? `Stream: ${c.stream}` : ""}{" "}
                      {c.roomNumber || c.room ? `• Room ${c.roomNumber || c.room}` : ""}
                    </Typography>

                    {/* Assigned subjects */}
                    {c.assignedSubjects && c.assignedSubjects.length > 0 && (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        flexwrap="wrap"
                        useFlexGap
                        sx={{ mb: 2 }}
                      >
                        {c.assignedSubjects.map((sub, idx) => (
                          <Chip
                            key={idx}
                            icon={<MenuBookIcon sx={{ fontSize: "14px !important" }} />}
                            label={sub.subjectName || sub.subject || "Subject"}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.75rem" }}
                          />
                        ))}
                      </Stack>
                    )}

                    <Divider sx={{ my: 1.5 }} />

                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {studentCount > 0 ? `${studentCount} Students` : "Enrolled students"}
                        </Typography>
                      </Stack>

                      <Button
                        size="small"
                        variant="text"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenRoster(c)}
                        sx={{ textTransform: "none", fontSize: "0.8rem" }}
                      >
                        View Roster
                      </Button>
                    </Stack>
                  </CardContent>

                  <Divider />
                  <Box sx={{ p: 1.5, display: "flex", gap: 1, bgcolor: "grey.50" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      component={Link}
                      href={`/staff-portal/attendance?class_room=${c.id}`}
                      startIcon={<EventAvailableIcon />}
                      sx={{ flex: 1, textTransform: "none" }}
                    >
                      Attendance
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      component={Link}
                      href={`/staff-portal/grading?class_room=${c.id}`}
                      startIcon={<EditNoteIcon />}
                      sx={{ flex: 1, textTransform: "none" }}
                    >
                      Grade Class
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Class Roster Dialog */}
      <Dialog open={!!selectedClassForRoster} onClose={handleCloseRoster} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {selectedClassForRoster?.name} — Student Roster
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {rosterStudents.length} enrolled student{rosterStudents.length === 1 ? "" : "s"}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseRoster} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {rosterLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : rosterStudents.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No student records found in this class.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Adm No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Parent / Emergency</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rosterStudents.map((st) => (
                    <TableRow key={st.id || st.admissionNumber} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {st.admissionNumber || st.admNo || "-"}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {st.name || `${st.firstName || ""} ${st.lastName || ""}`.trim()}
                        </Typography>
                      </TableCell>
                      <TableCell>{st.gender || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={st.status || "Active"}
                          size="small"
                          color={st.status === "suspended" ? "error" : "success"}
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        {st.emergencyContactPhone || st.parentPhone || st.phone || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 1.5, justifyContent: "space-between" }}>
          <Button
            size="small"
            variant="outlined"
            component={Link}
            href={`/staff-portal/attendance?class_room=${selectedClassForRoster?.id}`}
            startIcon={<EventAvailableIcon />}
          >
            Take Attendance
          </Button>
          <Button onClick={handleCloseRoster} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
