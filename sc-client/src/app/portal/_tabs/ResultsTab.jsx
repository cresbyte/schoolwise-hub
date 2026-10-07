"use client";

import { useState } from "react";
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { ReportCardDialog } from "@/components/exams/ReportCardDialog";

export function ResultsTab({ student }) {
  const [preview, setPreview] = useState(null);

  const {
    data: terms,
    loading,
    error,
    refetch,
  } = useAsync(() => api.exams.getStudentReportCardsList(student.id), [student.id]);

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Available Report Cards
      </Typography>

      <DataState
        loading={loading}
        error={error}
        data={terms || []}
        isEmpty={(d) => d.length === 0}
        emptyMessage="No published results available yet."
      >
        {(availableTerms) => (
          <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell>Term & Year</TableCell>
                  <TableCell align="center">Mean Grade</TableCell>
                  <TableCell align="center">Position</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {availableTerms.map((t, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Term {t.term}, {t.year}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={t.mean_grade}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center">{t.position_in_class || "—"}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() =>
                          setPreview({ studentId: student.id, year: t.year, term: t.term })
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataState>

      {preview && (
        <ReportCardDialog
          studentId={preview.studentId}
          year={preview.year}
          term={preview.term}
          open={!!preview}
          onClose={() => setPreview(null)}
        />
      )}
    </Box>
  );
}
