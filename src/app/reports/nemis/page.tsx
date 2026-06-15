"use client";

/**
 * NEMIS export: ministry-format student data with CSV download.
 * @module reports/nemis/page
 */
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import DownloadIcon from "@mui/icons-material/Download";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { exportToCSV, formatDate } from "@/lib/utils";

export default function NemisPage() {
  return (
    <DashboardLayout>
      <NemisContent />
    </DashboardLayout>
  );
}

interface NemisRow {
  admissionNumber: string; nemisNumber?: string; firstName: string; lastName: string;
  gender: string; dateOfBirth: string; class: string; parentName: string; parentPhone: string;
}

/** NEMIS export content. */
function NemisContent() {
  const { showNotification } = useNotification();
  const { data, loading, error, refetch } = useAsync<NemisRow[]>(() => api.getNEMISExport(), []);
  const list = data ?? [];

  const handleExport = () => {
    exportToCSV(list as unknown as Record<string, unknown>[], "nemis-export.csv");
    showNotification("NEMIS file downloaded", "success");
  };

  return (
    <>
      <PageHeader
        title="NEMIS Export"
        subtitle="National Education Management Information System"
        actions={<Button startIcon={<DownloadIcon />} variant="contained" onClick={handleExport} disabled={!list.length}>Download CSV</Button>}
      />
      <Alert severity="info" sx={{ mb: 2 }}>This export matches the Ministry of Education NEMIS upload format. Verify NEMIS numbers before submission.</Alert>
      <Card>
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d: any) => d.length === 0}>
          {() => (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Adm. No.</TableCell>
                    <TableCell>NEMIS No.</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>DOB</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Parent</TableCell>
                    <TableCell>Phone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((r: any) => (
                    <TableRow key={r.admissionNumber} hover>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{r.admissionNumber}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{r.nemisNumber ?? "—"}</TableCell>
                      <TableCell>{r.firstName} {r.lastName}</TableCell>
                      <TableCell>{r.gender}</TableCell>
                      <TableCell>{formatDate(r.dateOfBirth)}</TableCell>
                      <TableCell>{r.class}</TableCell>
                      <TableCell>{r.parentName}</TableCell>
                      <TableCell>{r.parentPhone}</TableCell>
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
