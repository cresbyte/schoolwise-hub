/**
 * Subjects catalogue with curriculum filter.
 * @module routes/subjects
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { CURRICULUM_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/subjects")({
  head: () => ({ meta: [{ title: "Subjects — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <SubjectsPage />
    </DashboardLayout>
  ),
});

/** Subject catalogue page. */
function SubjectsPage() {
  const [curriculum, setCurriculum] = useState("");
  const { data, loading, error, refetch } = useAsync(
    () => api.getSubjects(curriculum ? { curriculum } : undefined),
    [curriculum],
  );
  const list = data ?? [];
  return (
    <>
      <PageHeader title="Subjects" subtitle={<Chip size="small" label={`${list.length} subjects`} />} />
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
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d) => d.length === 0}>
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{s.code}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell><Chip size="small" variant="outlined" label={CURRICULUM_LABELS[s.curriculum]} /></TableCell>
                      <TableCell>{s.learningArea ?? "—"}</TableCell>
                      <TableCell>
                        <Chip size="small" label={s.isCore ? "Core" : "Optional"} color={s.isCore ? "primary" : "default"} variant={s.isCore ? "filled" : "outlined"} />
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