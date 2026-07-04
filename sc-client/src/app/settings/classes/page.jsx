"use client";

/**
 * Classes & Streams register with capacity utilisation.
 * @module classes/page
 */
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { RoleGuard } from "@/components/RoleGuard";
import { PageGuard } from "@/components/common/PageGuard";
import { useClasses } from "@/hooks/domain";
import { CURRICULUM_LABELS } from "@/lib/constants";

export default function ClassesPage() {
  return (
    <PageGuard permission="classes.view">
      <ClassesContent />
    </PageGuard>
  );
}

/** Lists every class with its teacher and capacity usage. */
function ClassesContent() {
  const router = useRouter();
  const { data, loading, error, refetch } = useClasses();
  const list = data ?? [];
  return (
    <>
      <PageHeader
        title="Classes & Streams"
        subtitle={<Chip size="small" label={`${list.length} classes`} />}
        actions={
          <RoleGuard permission="classes.*">
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => router.push("/settings/classes/new")}>
              Add Class
            </Button>
          </RoleGuard>
        }
      />
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
                    <TableCell align="right">Actions</TableCell>
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
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => router.push(`/settings/classes/${c.id}`)} title="View">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => router.push(`/settings/classes/${c.id}/edit`)} title="Edit">
                            <EditIcon fontSize="small" />
                          </IconButton>
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
