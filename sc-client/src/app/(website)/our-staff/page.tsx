"use client";

/**
 * Public staff directory page (no salary/private data).
 * @module website/our-staff/page
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Button from "@mui/material/Button";
import Link from "next/link";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { SectionHeading } from "@/components/website/SectionHeading";
import { staff as staffData } from "@/lib/mockData";
import { STAFF_QUALIFICATIONS } from "@/lib/website/data";
import { classes } from "@/lib/mockData";

const FILTERS = ["All", "Administration", "Academics"] as const;

function getClassName(classId?: string): string | undefined {
  if (!classId) return undefined;
  return classes.find((c) => c.id === classId)?.name;
}

/** Public staff directory with department filters content. */
export default function OurStaffPage() {
  const [filter, setFilter] = useState<string>("All");

  const filtered = staffData.filter((s) => filter === "All" || s.department === filter);

  return (
    <>
            <SectionWrapper>
        <Tabs value={filter} onChange={(_, v) => setFilter(v)} sx={{ mb: 3 }}>
          {FILTERS.map((f) => (
            <Tab key={f} label={f} value={f} sx={{ textTransform: "none", fontWeight: 600 }} />
          ))}
        </Tabs>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {filtered.map((s) => (
            <Card key={s.id} sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: "auto",
                    mb: 2,
                    bgcolor: "primary.main",
                    fontSize: 28,
                  }}
                >
                  {s.firstName[0]}
                  {s.lastName[0]}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {s.firstName} {s.lastName}
                </Typography>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                  {s.designation}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  {STAFF_QUALIFICATIONS[s.id as keyof typeof STAFF_QUALIFICATIONS] ?? "Qualified educator"}
                </Typography>
                {s.classAssigned && (
                  <Typography variant="caption" color="text.secondary">
                    Class: {getClassName(s.classAssigned) ?? s.classAssigned}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </SectionWrapper>

      <SectionWrapper alt>
        <Box sx={{ textAlign: "center", maxWidth: 560, mx: "auto" }}>
          <SectionHeading
            title="Join Our Team"
            subtitle="We're always looking for passionate educators and support staff."
          />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Send your CV and cover letter to careers@primroseacademy.ac.ke or visit our Contact
            page for more information.
          </Typography>
          <Button LinkComponent={Link} href="/contact" variant="contained">
            Get in Touch
          </Button>
        </Box>
      </SectionWrapper>
    </>
  );
}
