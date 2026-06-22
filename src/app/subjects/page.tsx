"use client";

/**
 * Subjects catalogue with curriculum filter.
 * @module subjects/page
 */
import { useState } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import Button from "@mui/material/Button";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { CURRICULUM_LABELS } from "@/lib/constants";

export default function SubjectsPage() {
  return (
    <DashboardLayout>
      <SubjectsContent />
    </DashboardLayout>
  );
}

/** Subject catalogue content. */
function SubjectsContent() {
  const router = useRouter();
  const [curriculum, setCurriculum] = useState("");
  const { data, loading, error, refetch } = useAsync(
    () => api.getSubjects(curriculum ? { curriculum } : undefined),
    [curriculum],
  );
  const list = data ?? [];
  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle={<Chip size="small" label={`${list.length} subjects`} />}
        actions={
          <RoleGuard permission="classes.*">
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => router.push("/subjects/new")}>
              Add Subject
            </Button>
          </RoleGuard>
        }
      />
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <TextField select size="small" label="Curriculum" value={curriculum} onChange={(e) => setCurriculum(e.target.value)} sx={{ width: 180 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="CBC">CBC</MenuItem>
            <MenuItem value="844">8-4-4</MenuItem>
          </TextField>
        </Box>
      </Card>
      <Card>
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d: any) => d.length === 0}>
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Curriculum</TableCell>
                    <TableCell>Learning Area</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((s: any) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{s.code}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell><Chip size="small" variant="outlined" label={CURRICULUM_LABELS[s.curriculum as keyof typeof CURRICULUM_LABELS]} /></TableCell>
                      <TableCell>{s.learningArea ?? "—"}</TableCell>
                      <TableCell>
                        <Chip size="small" label={s.isCore ? "Core" : "Optional"} color={s.isCore ? "primary" : "default"} variant={s.isCore ? "filled" : "outlined"} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => router.push(`/subjects/${s.id}`)} title="Settings"><EditIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      </Card>
    </>
  );
}
