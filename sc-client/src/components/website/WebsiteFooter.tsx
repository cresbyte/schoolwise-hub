/**
 * Public website footer — Kabarak University style.
 * Dark multi-column layout with contact details, quick links, and copyright bar.
 * @module WebsiteFooter
 */
import { Container, Typography, Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";
import { Logo } from "@/components/common/Logo";
import { KAB } from "@/theme/websiteTheme";
import { getSchoolInfo } from "@/lib/website/constants";

// ─── Footer link columns ──────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Academics", href: "/academics" },
  { label: "Admissions", href: "/admissions" },
  { label: "School Life", href: "/school-life" },
  { label: "News & Events", href: "/news" },
  { label: "Photo Gallery", href: "/gallery" },
  { label: "Contact Us", href: "/contact" },
];

const ACADEMICS_LINKS = [
  { label: "CBC Programme", href: "/academics#cbc" },
  { label: "8-4-4 Programme", href: "/academics#844" },
  { label: "Academic Calendar", href: "/academics#calendar" },
  { label: "KCSE Results", href: "/academics#results" },
  { label: "Clubs & Societies", href: "/school-life#clubs" },
  { label: "Sports", href: "/school-life#sports" },
];

const ADMISSIONS_LINKS = [
  { label: "How to Apply", href: "/admissions#process" },
  { label: "Fee Structure", href: "/admissions#fees" },
  { label: "Available Spaces", href: "/admissions#spaces" },
  { label: "Scholarships", href: "/admissions#scholarships" },
  { label: "Apply Online", href: "/admissions/apply" },
  { label: "Parent Portal", href: "/login" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Typography
        sx={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#fff",
          mb: 0.75,
        }}
      >
        {children}
      </Typography>
      <Box
        sx={{
          width: 32,
          height: 2,
          bgcolor: KAB.primary,
          mb: 2.5,
        }}
      />
    </Box>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Box
      component={Link}
      href={href}
      sx={{
        display: "block",
        color: "rgba(255,255,255,0.65)",
        fontFamily: "'Outfit', sans-serif",
        fontSize: 13,
        textDecoration: "none",
        mb: 1,
        transition: "color 0.2s, padding-left 0.2s",
        "&:hover": {
          color: "#fff",
          pl: 1,
        },
      }}
    >
      › {children}
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WebsiteFooter() {
  const school = getSchoolInfo();
  const year = new Date().getFullYear();

  return (
    <Box component="footer">
      {/* ── Top band: contact info pills ───────────────────────────────── */}
      <Box sx={{ bgcolor: KAB.primary, py: 4 }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {[
              {
                icon: <LocationOnIcon sx={{ fontSize: 22 }} />,
                label: "Address",
                value: school.address,
                sub: school.postal,
              },
              {
                icon: <PhoneIcon sx={{ fontSize: 22 }} />,
                label: "Phone",
                value: school.phone,
                href: `tel:+${school.phoneRaw}`,
              },
              {
                icon: <EmailIcon sx={{ fontSize: 22 }} />,
                label: "Email",
                value: school.email,
                href: `mailto:${school.email}`,
              },
            ].map(({ icon, label, value, sub, href }) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      border: "2px solid rgba(255,255,255,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.55)",
                        mb: 0.25,
                      }}
                    >
                      {label}
                    </Typography>
                    {href ? (
                      <Typography
                        component="a"
                        href={href}
                        sx={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#fff",
                          textDecoration: "none",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {value}
                      </Typography>
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#fff",
                        }}
                      >
                        {value}
                      </Typography>
                    )}
                    {sub && (
                      <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12, mt: 0.25 }}>
                        {sub}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Main link columns ──────────────────────────────────────────── */}
      <Box sx={{ bgcolor: KAB.dark, py: { xs: 6, md: 8 } }}>
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 5, md: 6 }}>
            {/* Column 1 — Branding & about text */}
            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
              <Box>
                <Box
                  component={Link}
                  href="/"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2.5,
                    textDecoration: "none",
                  }}
                >
                  <Logo size={48} withText={false} />
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#fff",
                        lineHeight: 1.1,
                      }}
                    >
                      {school.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.45)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {school.county} County, Kenya
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    lineHeight: 1.8,
                    mb: 3,
                    maxWidth: 280,
                  }}
                >
                  {school.tagline}. A premier institution offering CBC and 8-4-4 education from PP1
                  to Form 4 in Nairobi County.
                </Typography>
                {/* Social icons */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  {[
                    { icon: <FacebookIcon fontSize="small" />, label: "Facebook" },
                    { icon: <TwitterIcon fontSize="small" />, label: "Twitter" },
                    { icon: <InstagramIcon fontSize="small" />, label: "Instagram" },
                    { icon: <YouTubeIcon fontSize="small" />, label: "YouTube" },
                  ].map(({ icon, label }) => (
                    <Box
                      key={label}
                      component="a"
                      href="#"
                      aria-label={label}
                      sx={{
                        width: 34,
                        height: 34,
                        border: "1px solid rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.6)",
                        textDecoration: "none",
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: KAB.primary,
                          borderColor: KAB.primary,
                          color: "#fff",
                        },
                      }}
                    >
                      {icon}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Column 2 — Quick Links */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Box>
                <FooterHeading>Quick Links</FooterHeading>
                {QUICK_LINKS.map((l) => (
                  <FooterLink key={l.href} href={l.href}>
                    {l.label}
                  </FooterLink>
                ))}
              </Box>
            </Grid>

            {/* Column 3 — Academics */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Box>
                <FooterHeading>Academics</FooterHeading>
                {ACADEMICS_LINKS.map((l) => (
                  <FooterLink key={l.href} href={l.href}>
                    {l.label}
                  </FooterLink>
                ))}
              </Box>
            </Grid>

            {/* Column 4 — Admissions */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <FooterHeading>Admissions</FooterHeading>
                {ADMISSIONS_LINKS.map((l) => (
                  <FooterLink key={l.href} href={l.href}>
                    {l.label}
                  </FooterLink>
                ))}
                {/* Newsletter teaser */}
                <Box sx={{ mt: 3 }}>
                  <Typography
                    sx={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.55)",
                      mb: 1.5,
                    }}
                  >
                    Newsletter
                  </Typography>
                  <Box
                    component="form"
                    onSubmit={(e) => e.preventDefault()}
                    sx={{ display: "flex" }}
                  >
                    <Box
                      component="input"
                      type="email"
                      placeholder="Your email address"
                      sx={{
                        flex: 1,
                        bgcolor: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRight: "none",
                        color: "#fff",
                        px: 1.5,
                        py: 1,
                        fontSize: 12,
                        fontFamily: "'Outfit', sans-serif",
                        outline: "none",
                        "::placeholder": { color: "rgba(255,255,255,0.35)" },
                        "&:focus": { borderColor: KAB.secondary },
                      }}
                    />
                    <Box
                      component="button"
                      type="submit"
                      sx={{
                        bgcolor: KAB.primary,
                        border: `1px solid ${KAB.primary}`,
                        color: "#fff",
                        px: 2,
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "background 0.2s",
                        "&:hover": { bgcolor: KAB.primaryDark },
                      }}
                    >
                      Go
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Copyright bar ─────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: "#111",
          py: 2,
          borderTop: `1px solid rgba(255,255,255,0.06)`,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Outfit', sans-serif",
                color: "rgba(255,255,255,0.4)",
                fontSize: 12,
              }}
            >
              © {year} {school.name}. All rights reserved. KNEC Code: {school.knecCode}
            </Typography>
            <Box sx={{ display: "flex", gap: 2.5 }}>
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Use", href: "/terms" },
                { label: "Sitemap", href: "/sitemap" },
              ].map((l) => (
                <Typography
                  key={l.href}
                  component={Link}
                  href={l.href}
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    textDecoration: "none",
                    "&:hover": { color: "rgba(255,255,255,0.8)" },
                  }}
                >
                  {l.label}
                </Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
