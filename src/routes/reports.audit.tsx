/**
 * Audit trail of system actions.
 * @module routes/reports.audit
 */
import { createFileRoute } from "@tanstack/react-router";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
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
import { formatDateTime } from "@/lib/utils";

export const Route = createFileRoute("/reports/audit")({
  head: () => ({ meta: [{ title: "Audit Trail — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <AuditPage />
    </DashboardLayout>
  ),
});

/** Audit trail page. */
function AuditPage() {
  const { data, loading, error, refetch } = useAsync(() => api.getAuditLogs(), []);
  const list = data ?? [];
  return (
    <>
      <PageHeader title="Audit Trail" subtitle="System activity log" />
      <Card>
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d) => d.length === 0}>
          {() => (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>IP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(a.timestamp)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{a.userName}</TableCell>
                      <TableCell><Chip size="small" variant="outlined" label={a.action} /></TableCell>
                      <TableCell>{a.module}</TableCell>
                      <TableCell>{a.details}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{a.ipAddress}</TableCell>
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