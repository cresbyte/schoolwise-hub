"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

// Used only if the API doesn't send school details with the report card.
const DEFAULT_SCHOOL = {
  name: "KIBAARA ELITES ACADEMY",
  address: "P.O. Box 1234-00100, Nairobi",
  phone: "+254 700 123 456",
  email: "info@kibaraa.ac.ke",
};

export function ReportCardDocument({ studentId, year, term }) {
  const {
    data: card,
    loading,
    error,
  } = useAsync(
    () => api.exams.getStudentReportCard(studentId, year, term),
    [studentId, year, term],
  );

  if (loading) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress size={28} />
        <Typography sx={{ mt: 1.5 }} color="text.secondary">
          Loading report card...
        </Typography>
      </Box>
    );
  }

  if (error || !card) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography color="error">
          We couldn&apos;t load this report card. Please try again.
        </Typography>
      </Box>
    );
  }

  const school = { ...DEFAULT_SCHOOL, ...(card.school || {}) };
  const { student, summary } = card;
  const contact = [school.address, school.phone && `Tel: ${school.phone}`, school.email]
    .filter(Boolean)
    .join("  |  ");
  const printedOn = new Date().toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Box
      className="report-card-document"
      sx={{
        bgcolor: "#fff",
        width: "100%",
        maxWidth: "210mm",
        mx: "auto",
        p: { xs: 2, sm: 4 },
        boxShadow: { sm: 2 },
        // Typography/TableCell use the theme font, so set the serif face explicitly.
        "& .MuiTypography-root, & .MuiTableCell-root": {
          fontFamily: "'Times New Roman', Georgia, serif",
        },
        "& *": { color: "#000 !important" },
      }}
    >
      {/* Letterhead */}
      <Box sx={{ textAlign: "center", mb: 3, pb: 2, borderBottom: "3px double #000" }}>
        <Typography
          sx={{
            fontWeight: 900,
            letterSpacing: 2,
            fontSize: { xs: "1.3rem", sm: "2rem" },
            lineHeight: 1.2,
          }}
        >
          {school.name}
        </Typography>
        {contact && (
          <Typography
            variant="body2"
            sx={{ mt: 0.75, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          >
            {contact}
          </Typography>
        )}
        <Typography sx={{ mt: 2, fontWeight: 700, fontStyle: "italic", fontSize: "1.15rem" }}>
          END OF TERM REPORT CARD
        </Typography>
        <Typography variant="body2">
          Term {card.term.term}, {card.term.year}
        </Typography>
      </Box>

      {/* Student info */}
      <Box
        className="rc-keep-together"
        sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, mb: 3 }}
      >
        <InfoRow label="Student Name" value={student.name} capitalize />
        <InfoRow label="Admission No" value={student.admission_number} />
        <InfoRow label="Class" value={student.class_room} />
        <InfoRow label="Grade Level" value={student.grade_level} capitalize />
        <InfoRow
          label="Position"
          value={`${summary.position_in_class} out of ${summary.total_students_in_class}`}
        />
        <InfoRow label="Mean Grade" value={`${summary.mean_grade} (${summary.mean_points} pts)`} />
      </Box>

      {/* Subjects. Scrolls sideways on a phone, flows normally when printed. */}
      <Box className="rc-table-scroll" sx={{ overflowX: "auto", mb: 3 }}>
        <Table
          size="small"
          sx={{
            minWidth: 520,
            "& td, & th": { py: 0.8, fontSize: "0.85rem", border: "1px solid #bbb" },
          }}
        >
          <TableHead>
            <TableRow sx={{ bgcolor: "#f0f0f0" }}>
              <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Marks
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Grade
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Points
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Remark</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {card.subjects.map((s) => (
              <TableRow key={s.subject_name}>
                <TableCell>{s.subject_name}</TableCell>
                <TableCell align="center">
                  {s.marks_obtained} / {s.total_marks}
                </TableCell>
                {/* Plain bold text prints cleanly in black and white; coloured chips don't. */}
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {s.grade}
                </TableCell>
                <TableCell align="center">{s.points}</TableCell>
                <TableCell sx={{ fontSize: "0.8rem", fontStyle: "italic" }}>
                  {s.interpretation}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Summary */}
      <Box
        className="rc-keep-together"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
          gap: 1.5,
          mb: 3,
          p: 2,
          bgcolor: "#f5f5f5",
          border: "1px solid #ccc",
        }}
      >
        <SummaryItem
          label="Total Marks"
          value={`${summary.total_marks_obtained} / ${summary.total_marks_possible}`}
        />
        <SummaryItem label="Average" value={`${summary.overall_percentage}%`} />
        <SummaryItem label="Mean Grade" value={summary.mean_grade} />
        <SummaryItem label="Mean Points" value={summary.mean_points} />
      </Box>

      <Divider sx={{ mb: 2, borderColor: "#999" }} />

      {/* Teacher comment + signatures stay together on one page */}
      <Box className="rc-keep-together">
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          Class Teacher&apos;s Comment:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontStyle: "italic",
            minHeight: 40,
            p: 1,
            bgcolor: "#fafafa",
            border: "1px dashed #bbb",
          }}
        >
          {card.teacher_comment || "No comment provided."}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 4,
            mt: 5,
          }}
        >
          <SignatureLine label="Class Teacher" />
          <SignatureLine label="Headteacher" />
          <SignatureLine label="Parent/Guardian" />
        </Box>

        <Box sx={{ mt: 4, pt: 2, borderTop: "1px solid #bbb", textAlign: "center" }}>
          <Typography variant="caption">
            This is a computer-generated report card. Printed on {printedOn}.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function InfoRow({ label, value, capitalize }) {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 110 }}>
        {label}:
      </Typography>
      <Typography variant="body2" sx={{ textTransform: capitalize ? "capitalize" : "none" }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

function SummaryItem({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

function SignatureLine({ label }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Box sx={{ borderBottom: "1px solid #000", mb: 0.5, height: 40 }} />
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}
