/**
 * Privacy Policy placeholder page.
 * @module routes/_website/privacy
 */
import { createFileRoute } from "@tanstack/react-router";
import Typography from "@mui/material/Typography";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { websiteHead } from "@/lib/website/seo";
import { SCHOOL } from "@/lib/website/constants";

export const Route = createFileRoute("/_website/privacy")({
  head: () =>
    websiteHead({
      title: "Privacy Policy",
      description: `Privacy policy for ${SCHOOL.name} website and parent portal.`,
    }),
  component: PrivacyPage,
});

/** Privacy policy placeholder. */
function PrivacyPage() {
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
