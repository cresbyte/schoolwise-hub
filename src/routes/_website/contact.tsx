/**
 * Contact page — form, info cards, map, contacts directory.
 * @module routes/_website/contact
 */
import { createFileRoute } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { ContactForm } from "@/components/website/ContactForm";
import { websiteHead } from "@/lib/website/seo";
import { SCHOOL, HEADING_FONT } from "@/lib/website/constants";

export const Route = createFileRoute("/_website/contact")({
  head: () =>
    websiteHead({
      title: "Contact",
      description: `Contact ${SCHOOL.name} — phone, email, address, and enquiry form.`,
    }),
  component: ContactPage,
});

const DIRECTORY = [
  {
    role: "Principal's Office",
    name: SCHOOL.principal,
    phone: SCHOOL.phone,
    email: "principal@greenfieldacademy.ac.ke",
  },
  {
    role: "Admissions",
    name: "Admissions Team",
    phone: SCHOOL.phone,
    email: SCHOOL.admissionsEmail,
  },
  {
    role: "Accounts & Fees",
    name: "Ms. Agnes Kariuki",
    phone: "0733 456 789",
    email: "accounts@greenfieldacademy.ac.ke",
  },
  {
    role: "Boarding Office",
    name: "Mr. Joseph Mutua",
    phone: "0711 234 567",
    email: "deputy@greenfieldacademy.ac.ke",
  },
];

/** Contact page with form and directory. */
function ContactPage() {
  return (
    <>
      <PageBanner
        title="Contact Us"
        subtitle="We'd love to hear from you"
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />
      <SectionWrapper>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 3 }}>
              Send Us a Message
            </Typography>
            <ContactForm />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              {
                icon: <LocationOnIcon color="primary" />,
                title: "Address",
                text: `${SCHOOL.address}\n${SCHOOL.postal}`,
              },
              { icon: <PhoneIcon color="primary" />, title: "Phone", text: SCHOOL.phone },
              { icon: <EmailIcon color="primary" />, title: "Email", text: SCHOOL.email },
              {
                icon: <AccessTimeIcon color="primary" />,
                title: "Office Hours",
                text: "Mon–Fri: 7:30 AM – 5:00 PM\nSat: 8:00 AM – 12:00 PM",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent sx={{ display: "flex", gap: 2 }}>
                  {item.icon}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: "pre-line" }}
                    >
                      {item.text}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </SectionWrapper>

      <SectionWrapper alt>
        <Box
          sx={{
            bgcolor: "action.hover",
            borderRadius: 2,
            height: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 4,
          }}
        >
          <Typography color="text.secondary">Map placeholder — Milimani Road, Nakuru</Typography>
        </Box>
        <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 3 }}>
          Contacts Directory
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {DIRECTORY.map((d) => (
            <Card key={d.role}>
              <CardContent>
                <Typography variant="overline" color="primary">
                  {d.role}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {d.name}
                </Typography>
                <Typography variant="body2">{d.phone}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {d.email}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </SectionWrapper>
    </>
  );
}
