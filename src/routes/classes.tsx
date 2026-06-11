/**
 * Classes & Streams register with capacity utilisation.
 * @module routes/classes
 */
import { createFileRoute } from "@tanstack/react-router";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useClasses } from "@/hooks/domain";
import { CURRICULUM_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "Classes & Streams — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <ClassesPage />
    </DashboardLayout>
  ),
});

/** Lists every class with its teacher and capacity usage. */
function ClassesPage() {
  const { data, loading, error, refetch } = useClasses();
  const list = data ?? [];
  return (
    <>
      <PageHeader title="Classes & Streams" subtitle={<Chip size="small" label={`${list.length} classes`} />} />
      <Card>
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d) => d.length === 0}>
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Class</TableCell>
                    <TableCell>Curriculum</TableCell>
                    <TableCell>Class Teacher</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Capacity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((c) => {
                    const pct = c.capacity ? Math.round((c.studentCount / c.capacity) * 100) : 0;
                    return (
                      <TableRow key={c.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                        <TableCell><Chip size="small" variant="outlined" label={CURRICULUM_LABELS[c.curriculum]} /></TableCell>
                        <TableCell>{c.classTeacherName ?? "—"}</TableCell>
                        <TableCell>{c.room ?? "—"}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <span>{c.studentCount} / {c.capacity}</span>
                            <span>{pct}%</span>
                          </Box>
                          <LinearProgress variant="determinate" value={Math.min(pct, 100)} color={pct >= 100 ? "error" : pct >= 85 ? "warning" : "success"} sx={{ height: 7, borderRadius: 4 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataState>
      </Card>
    </>
  );
}