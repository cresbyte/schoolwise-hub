"use client";

/**
 * Privacy Policy placeholder page.
 * @module website/privacy/page
 */
import Typography from "@mui/material/Typography";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { getSchoolInfo } from "@/lib/website/constants";

/** Privacy policy placeholder content. */
export default function PrivacyPage() {
  const SCHOOL = getSchoolInfo();
  return (
    <>
      <PageBanner
        title="Privacy Policy"
        crumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
      />
      <SectionWrapper>
        <Typography
          variant="body1"
          sx={{ lineHeight: 1.8, color: "text.secondary", maxWidth: 720 }}
        >
          {SCHOOL.name} is committed to protecting your personal information. Data collected through
          our website contact forms and parent portal is used solely for school administration and
          communication purposes. We do not share personal data with third parties except as
          required by Kenyan law. For questions about data handling, contact {SCHOOL.email}.
        </Typography>
      </SectionWrapper>
    </>
  );
}
