"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  TextField,
  InputAdornment,
  Avatar,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { studentApi } from "@/lib/studentApi";
import { academicsApi } from "@/lib/academicsApi";

export default function StudentsPage() {
  return (
    <PageGuard permission="students.view">
      <StudentsContent />
    </PageGuard>
  );
}

function StudentsContent() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: "",
    class_room: "",
    grade_level: "",
    status: "active",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [menu, setMenu] = useState({ anchor: null, student: null });

  const { data, loading, error, refetch } = useAsync(async () => {
    const [students, classes] = await Promise.all([
      studentApi.getStudents(filters),
      academicsApi.getClasses({ current: 1 }),
    ]);
    return {
      students: Array.isArray(students) ? students : [],
      classes: Array.isArray(classes) ? classes : [],
    };
  }, [filters]);

  const students = data?.students ?? [];
  const classes = data?.classes ?? [];

  // Distinct grade names for the grade filter
  const grades = useMemo(() => {
    const set = new Set(classes.map((c) => c.gradeLevel));
    return Array.from(set).sort();
  }, [classes]);

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const closeMenu = () => setMenu({ anchor: null, student: null });

  const handleFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

  const handleDelete = async () => {
    try {
      await studentApi.deleteStudent(menu.student.id);
      notify(`${menu.student.firstName} ${menu.student.lastName} removed`);
      closeMenu();
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Every learner enrolled in the current academic year."
        actions={
          <RoleGuard permission="students.manage">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push("/students/new")}
            >
              Admit student
            </Button>
          </RoleGuard>
        }
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} flexwrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder="Search name or admission number"
            value={filters.search}
            onChange={(e) => handleFilter("search", e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Grade</InputLabel>
            <Select
              value={filters.grade_level}
              label="Grade"
              onChange={(e) => handleFilter("grade_level", e.target.value)}
            >
              <MenuItem value="">All grades</MenuItem>
              {grades.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={filters.class_room}
              label="Class"
              onChange={(e) => handleFilter("class_room", e.target.value)}
            >
              <MenuItem value="">All classes</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilter("status", e.target.value)}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="graduated">Graduated</MenuItem>
              <MenuItem value="transferred_out">Transferred</MenuItem>
              <MenuItem value="all">All</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

      <DataState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={() => students.length === 0}
        emptyMessage="No students match the current filters."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Name</TableCell>
                    <TableCell>Admission #</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell padding="checkbox" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => (
                    <TableRow
                      key={s.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => router.push(`/students/${s.id}`)}
                    >
                      <TableCell padding="checkbox">
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
                          {(s.firstName?.[0] || "") + (s.lastName?.[0] || "")}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {s.firstName} {s.lastName}
                      </TableCell>
                      <TableCell>{s.admissionNumber}</TableCell>
                      <TableCell>{s.gradeLevel || "—"}</TableCell>
                      <TableCell>{s.className || "—"}</TableCell>
                      <TableCell>{s.gender || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={s.status}
                          color={s.status === "active" ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={(e) => setMenu({ anchor: e.currentTarget, student: s })}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </DataState>

      <Menu anchorEl={menu.anchor} open={!!menu.anchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            router.push(`/students/${menu.student.id}`);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View profile</ListItemText>
        </MenuItem>
        <RoleGuard permission="students.manage">
          <MenuItem
            onClick={() => {
              router.push(`/students/${menu.student.id}/edit`);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem sx={{ color: "error.main" }} onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </RoleGuard>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
