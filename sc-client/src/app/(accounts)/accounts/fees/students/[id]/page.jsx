"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import PaymentsIcon from "@mui/icons-material/Payments";
import { useAsync } from "@/hooks/useAsync";
import { feesApi, formatKES } from "@/lib/feesApi";
import { RecordPaymentDialog } from "@/components/fees/RecordPaymentDialog";

export default function StudentStatementPage() {
  const { id } = useParams();
  const router = useRouter();
  const [payOpen, setPayOpen] = useState(false);

  const { data, loading, error, refetch } = useAsync(() => feesApi.getStudentStatement(id), [id]);

  const { data: summary } = useAsync(() => feesApi.getStudentSummary(id), [id]);

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{String(error)}</Alert>;
  if (!data) return <Alert severity="warning">Statement not available.</Alert>;

  const student = data.student ?? {};
  const entries = data.entries ?? [];
  const balance = Number(data.balance || 0);

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexwrap="wrap"
        useFlexGap
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
            Back
          </Button>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {student.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {student.admissionNumber} · {student.className}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="contained" startIcon={<PaymentsIcon />} onClick={() => setPayOpen(true)}>
            Record payment
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        }}
      >
        <Card sx={{ p: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Current balance
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: balance > 0 ? "error.main" : "success.main",
            }}
          >
            {formatKES(balance)}
          </Typography>
        </Card>
        <Card sx={{ p: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Total invoiced
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {formatKES(summary?.totalInvoiced || 0)}
          </Typography>
        </Card>
        <Card sx={{ p: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Total paid
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "success.main" }}>
            {formatKES(summary?.totalPaid || 0)}
          </Typography>
        </Card>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Statement
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((e, i) => (
                <TableRow key={i} hover>
                  <TableCell>{e.date}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {e.description}
                    </Typography>
                    {e.type === "invoice" && e.details?.lines?.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {e.details.lines.map((l) => l.description).join(", ")}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>
                    {e.reference || "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "error.main" }}>
                    {e.debit ? formatKES(e.debit) : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "success.main" }}>
                    {e.credit ? formatKES(e.credit) : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatKES(e.balance)}
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <RecordPaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        studentId={id}
        studentName={student.name}
        suggestedAmount={balance > 0 ? balance : 0}
        onSaved={() => {
          setPayOpen(false);
          refetch();
        }}
        onError={() => {}}
      />
    </Stack>
  );
}
