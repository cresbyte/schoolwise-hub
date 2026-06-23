"use client";

/**
 * Admissions page — process stepper, spaces, fees, scholarships.
 * @module website/admissions/page
 */
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useState } from "react";
import Link from "next/link";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { SectionHeading } from "@/components/website/SectionHeading";
import { HEADING_FONT, getSchoolInfo } from "@/lib/website/constants";
import { getAdmissionSpaces, getFeeStructure } from "@/lib/website/data";
import { formatKES } from "@/lib/utils";

const STEPS = [
  "Submit Application",
  "Assessment Interview",
  "Offer Letter",
  "Enrollment & Payment",
];

/** Admissions information page content. */
export default function AdmissionsPage() {
  const SCHOOL = getSchoolInfo();
  const [feeTab, setFeeTab] = useState(0);
  const feeStructure = getFeeStructure();
  const fees = feeTab === 0 ? feeStructure.day : feeStructure.boarding;

  return (
    <>
      <PageBanner
        title="Admissions"
        subtitle="Join the Primrose family"
        crumbs={[{ label: "Home", href: "/" }, { label: "Admissions" }]}
      />

      <SectionWrapper id="process">
        <SectionHeading title="How to Apply" />
        <Stepper activeStep={-1} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.8,
            color: "text.secondary",
            mb: 3,
            textAlign: "center",
            maxWidth: 640,
            mx: "auto",
          }}
        >
          Begin your application online. Our admissions team will contact you within 3 business days
          to schedule an assessment and campus tour.
        </Typography>
        <Box sx={{ textAlign: "center" }}>
          <Button LinkComponent={Link} href="/admissions/apply" variant="contained" size="large">
            Start Online Application
          </Button>
        </Box>
      </SectionWrapper>

      <SectionWrapper id="spaces" alt>
        <SectionHeading title="Available Spaces — Term 3, 2026" />
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Grade/Form</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Day Spaces
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Boarding Spaces
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getAdmissionSpaces().map((row: any) => (
              <TableRow key={row.grade}>
                <TableCell>{row.grade}</TableCell>
                <TableCell align="right">{row.day}</TableCell>
                <TableCell align="right">{row.boarding || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionWrapper>

      <SectionWrapper id="fees">
        <SectionHeading
          title="Fee Structure 2026"
          subtitle="Per term. Pay via M-Pesa Paybill 522533."
        />
        <Tabs value={feeTab} onChange={(_, v) => setFeeTab(v)} sx={{ mb: 2 }}>
          <Tab label="Day Scholars" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab label="Boarders" sx={{ textTransform: "none", fontWeight: 600 }} />
        </Tabs>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Level</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Tuition
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Activity Levy
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Total/Term
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fees.map((row: any) => (
              <TableRow key={row.grade}>
                <TableCell>{row.grade}</TableCell>
                <TableCell align="right">{formatKES(row.tuition)}</TableCell>
                <TableCell align="right">{formatKES(row.activity)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatKES(row.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionWrapper>

      <SectionWrapper id="scholarships" alt>
        <Card sx={{ bgcolor: "primary.main", color: "#fff" }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2 }}>
              Merit Scholarships
            </Typography>
            <Typography sx={{ lineHeight: 1.8, mb: 3, opacity: 0.9 }}>
              Five full scholarships are available for outstanding KCPE candidates joining Form 1 in
              2025. Candidates must score 380+ marks and demonstrate leadership potential. Financial
              aid applications are reviewed confidentially by the bursar's office.
            </Typography>
            <Button
              LinkComponent={Link}
              href="/admissions/apply"
              variant="contained"
              color="secondary"
            >
              Apply for Scholarship
            </Button>
          </CardContent>
        </Card>
      </SectionWrapper>
    </>
  );
}
