"use client";

/**
 * Academics page — CBC/8-4-4 tabs, KCSE chart, academic calendar.
 * @module website/academics/page
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import PrintIcon from "@mui/icons-material/Print";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { SectionHeading } from "@/components/website/SectionHeading";
import { SCHOOL, HEADING_FONT } from "@/lib/website/constants";
import { KCSE_RESULTS, ACADEMIC_CALENDAR } from "@/lib/website/data";

/** Academics page with curriculum tabs and results chart. */
export default function AcademicsPage() {
  const [tab, setTab] = useState(0);

  return (
    <>
      <PageBanner
        title="Academics"
        subtitle="Rigorous programmes aligned to Kenyan national standards"
        crumbs={[{ label: "Home", href: "/" }, { label: "Academics" }]}
      />

      <SectionWrapper id="cbc">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="CBC Programme" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab label="8-4-4 Programme" sx={{ textTransform: "none", fontWeight: 600 }} />
        </Tabs>

        {tab === 0 && (
          <Box id="cbc">
            <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2 }}>
              Competency-Based Curriculum (CBC)
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }}>
              Our Junior School (PP1 – Grade 9) follows the KICD Competency-Based Curriculum,
              emphasising practical skills, values, and continuous assessment. Learners engage in
              project-based learning across seven core learning areas.
            </Typography>
            <Box
              sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}
            >
              {[
                "Pre-Primary (PP1–PP2)",
                "Lower Primary (Grade 1–3)",
                "Upper Primary (Grade 4–6)",
                "Junior Secondary (Grade 7–9)",
              ].map((level) => (
                <Card key={level}>
                  <CardContent>
                    <Typography sx={{ fontWeight: 700 }}>{level}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Age-appropriate competencies, formative assessment, and parental engagement.
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box id="844">
            <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2 }}>
              8-4-4 System (KNEC)
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }}>
              Our Senior School offers the 8-4-4 curriculum from Form 1 to Form 4, with intensive
              KCSE preparation, science practicals, and career counselling. Subject combinations
              include Sciences, Arts, and Business Studies clusters.
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              {["Form 1", "Form 2", "Form 3", "Form 4"].map((f) => (
                <Card key={f}>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {f}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      KNEC-aligned syllabus
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </SectionWrapper>

      <SectionWrapper id="results" alt>
        <SectionHeading
          title="KCSE Performance"
          subtitle="Consistent improvement in national examination results."
        />
        <Card>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={KCSE_RESULTS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis domain={[6, 10]} />
                <Tooltip formatter={(v: number) => `Mean: ${v}`} />
                <Bar dataKey="mean" fill="#1565C0" name="Mean Score" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
              Greenfield's 2024 mean score of 8.2 places us among the top private schools in Nakuru
              County.
            </Typography>
          </CardContent>
        </Card>
      </SectionWrapper>

      <SectionWrapper id="calendar">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <SectionHeading title="Academic Calendar 2024" align="left" />
          <Button
            startIcon={<PrintIcon />}
            variant="outlined"
            onClick={() => window.print()}
            className="no-print"
          >
            Print Calendar
          </Button>
        </Box>
        <Box className="print-area">
          <Box className="print-only" sx={{ textAlign: "center", mb: 3, display: "none" }}>
            <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700 }}>
              {SCHOOL.name}
            </Typography>
            <Typography variant="body2">Academic Calendar 2024</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Term</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Dates</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Key Events</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ACADEMIC_CALENDAR.map((row) => (
                <TableRow key={row.term}>
                  <TableCell>{row.term}</TableCell>
                  <TableCell>{row.dates}</TableCell>
                  <TableCell>{row.events.join(" · ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </SectionWrapper>
    </>
  );
}
