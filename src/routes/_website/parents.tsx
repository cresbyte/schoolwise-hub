/**
 * Parent Resources page — downloads, portal guide, FAQs.
 * @module routes/_website/parents
 */
import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LoginIcon from "@mui/icons-material/Login";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { SectionHeading } from "@/components/website/SectionHeading";
import { FAQAccordion } from "@/components/website/FAQAccordion";
import { DownloadButton } from "@/components/website/DownloadButton";
import { websiteHead } from "@/lib/website/seo";
import { SCHOOL, HEADING_FONT } from "@/lib/website/constants";
import { PARENT_FAQS, PARENT_DOWNLOADS } from "@/lib/website/data";

export const Route = createFileRoute("/_website/parents")({
  head: () =>
    websiteHead({
      title: "Parent Resources",
      description: `Parent resources for ${SCHOOL.name} — downloads, portal guide, and FAQs.`,
    }),
  component: ParentsPage,
});

const QUICK_LINKS = [
  { title: "Parent Portal", desc: "View fees, attendance, and report cards", href: "/login" },
  {
    title: "Fee Structure",
    desc: "Current term fees and payment methods",
    href: "/admissions#fees",
  },
  { title: "Academic Calendar", desc: "Term dates and key events", href: "/academics#calendar" },
  { title: "Contact School", desc: "Reach teachers and administration", href: "/contact" },
];

/** Parent resources hub page. */
function ParentsPage() {
  return (
    <>
      <PageBanner
        title="Parent Resources"
        subtitle="Everything you need to support your child's education"
        crumbs={[{ label: "Home", href: "/" }, { label: "Parents" }]}
      />

      <SectionWrapper>
        <SectionHeading title="Quick Access" />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {QUICK_LINKS.map((link) => (
            <Card key={link.title} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {link.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {link.desc}
                </Typography>
                <Button component={RouterLink} to={link.href} size="small" variant="outlined">
                  Open
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </SectionWrapper>

      <SectionWrapper alt>
        <SectionHeading title="Downloads" />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {PARENT_DOWNLOADS.map((doc) => (
            <Card key={doc.id}>
              <CardContent
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{doc.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {doc.description} · {doc.size}
                  </Typography>
                </Box>
                <DownloadButton title={doc.title} fileType={doc.fileType} size={doc.size} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </SectionWrapper>

      <SectionWrapper>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2 }}>
              SchuleSmart Parent Portal
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }}>
              Access your child's academic records, fee statements, and attendance reports through
              our secure online portal powered by SchuleSmart.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              1. Visit the portal login page
              <br />
              2. Enter your registered email and password
              <br />
              3. View dashboards for each enrolled child
              <br />
              4. Download report cards and pay fees via M-Pesa
            </Typography>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              startIcon={<LoginIcon />}
            >
              Go to Parent Portal
            </Button>
          </Box>
          <Card sx={{ bgcolor: "primary.main", color: "#fff" }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Need Help?
              </Typography>
              <Typography sx={{ opacity: 0.9, mb: 2 }}>
                Contact the accounts office for portal credentials or password resets.
              </Typography>
              <Typography variant="body2">accounts@greenfieldacademy.ac.ke</Typography>
              <Typography variant="body2">0733 456 789</Typography>
            </CardContent>
          </Card>
        </Box>
      </SectionWrapper>

      <SectionWrapper alt>
        <SectionHeading title="Frequently Asked Questions" />
        <FAQAccordion items={PARENT_FAQS} />
      </SectionWrapper>
    </>
  );
}
