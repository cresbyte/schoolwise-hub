"use client";

/**
 * Outstanding fees: students with balances, ranked, with reminders.
 * @module fees/outstanding/page
 */
import { useState } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import SmsIcon from "@mui/icons-material/Sms";
import DownloadIcon from "@mui/icons-material/Download";
import WarningIcon from "@mui/icons-material/Warning";
import PeopleIcon from "@mui/icons-material/People";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { StatCard } from "@/components/StatCard";
import { ClassSelect } from "@/components/ClassSelect";
import { StatusChip } from "@/components/StatusChip";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import * as api from "@/lib/mockApi";
import { formatKES, exportToCSV } from "@/lib/utils";

export default function OutstandingFeesPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="fees.view">
        <OutstandingContent />
      </PageGuard>
    </DashboardLayout>
  );
}

/** Outstanding balances content. */
function OutstandingContent() {
  const [classId, setClassId] = useState("");
  const { showNotification } = useNotification();
  const { data, loading, error, refetch } = useAsync(
    () => api.getOutstandingFees(classId ? { classId } : undefined),
    [classId],
  );
  const list = data ?? [];
  const total = list.reduce((s, i) => s + i.balance, 0);

  const handleExport = () =>
    exportToCSV(
      list.map((i) => ({ Admission: i.admissionNumber, Name: i.studentName, Class: i.className, Balance: i.balance, Status: i.status })),
      "outstanding-fees.csv",
    );

  return (
    <>
      <PageHeader
        title="Outstanding Fees"
        actions={<Button startIcon={<DownloadIcon />} variant="outlined" onClick={handleExport}>Export</Button>}
      />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, mb: 2 }}>
        <StatCard icon={<WarningIcon />} color="#C62828" label="Total Outstanding" value={formatKES(total)} />
        <StatCard icon={<PeopleIcon />} color="#EF6C00" label="Students with Balance" value={list.length} />
      </Box>
      <Card sx={{ p: 2, mb: 2 }}>
        <ClassSelect value={classId} onChange={setClassId} />
      </Card>
      <Card>
        <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d: any) => d.length === 0} emptyMessage="No outstanding balances — well done!">
          {() => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Adm. No.</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell align="right">Charged</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((i: any) => (
                    <TableRow key={i.id} hover>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{i.admissionNumber}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{i.studentName}</TableCell>
                      <TableCell>{i.className}</TableCell>
                      <TableCell align="right">{formatKES(i.totalCharged)}</TableCell>
                      <TableCell align="right">{formatKES(i.totalPaid)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "error.main" }}>{formatKES(i.balance)}</TableCell>
                      <TableCell><StatusChip status={i.status} /></TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<SmsIcon />} onClick={() => showNotification(`SMS reminder sent to ${i.studentName}'s parent`, "success")}>
                          Remind
                        </Button>
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
