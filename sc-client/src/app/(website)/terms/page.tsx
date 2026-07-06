"use client";

/**
 * Terms of Use placeholder page.
 * @module website/terms/page
 */
import Typography from "@mui/material/Typography";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { getSchoolInfo } from "@/lib/website/constants";

/** Terms of use placeholder content. */
export default function TermsPage() {
  const SCHOOL = getSchoolInfo();
  return (
    <>
            <SectionWrapper>
        <Typography
          variant="body1"
          sx={{ lineHeight: 1.8, color: "text.secondary", maxWidth: 720 }}
        >
          By using the {SCHOOL.name} website, you agree to use it for lawful purposes only. Content
          on this site is provided for informational purposes. The school reserves the right to
          update these terms at any time. Unauthorized reproduction of website content is prohibited
          without written permission.
        </Typography>
      </SectionWrapper>
    </>
  );
}
