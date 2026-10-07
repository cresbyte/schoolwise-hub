"use client";

import { useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportCardDocument } from "@/components/exams/ReportCardDocument";

export default function StudentReportCardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params.studentId;
  const year = Number(searchParams.get("year"));
  const term = Number(searchParams.get("term"));

  if (!studentId || !year || !term) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error">
            Missing required parameters. Please provide studentId, year, and term.
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box className="no-print" sx={{ mb: 2, display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button component={Link} href="/exams" startIcon={<ArrowBackIcon />} variant="outlined">
          Back
        </Button>
        <Button startIcon={<PrintIcon />} variant="contained" onClick={() => window.print()}>
          Print
        </Button>
      </Box>

      <ReportCardDocument studentId={studentId} year={year} term={term} />
    </DashboardLayout>
  );
}
