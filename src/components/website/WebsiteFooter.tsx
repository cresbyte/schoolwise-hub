/**
 * Public website footer — Kabarak-style.
 * Dark band with multiple config-driven link columns, a contacts block,
 * a logo watermark and a divided bottom bar. No rounded corners.
 * @module WebsiteFooter
 */
"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Logo } from "@/components/common/Logo";
import { SocialIcons } from "./SocialIcons";
import { getSchoolInfo, WEBSITE_COLORS } from "@/lib/website/constants";
import { FOOTER_COLUMNS } from "@/lib/website/nav";

const columnHeadingSx = {
  fontWeight: 700,
  fontSize: 15,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "#fff",
  pb: 1.5,
  mb: 2,
  position: "relative" as const,
  "&::after": {
    content: '""',
    position: "absolute" as const,
    left: 0,
    bottom: 0,
    width: 40,
    height: 3,
    backgroundColor: WEBSITE_COLORS.secondary,
  },
};

const linkSx = {
  color: "rgba(255,255,255,0.72)",
  fontSize: 14,
  textDecoration: "none",
  display: "block",
  py: 0.6,
  transition: "color 0.18s ease, padding-left 0.18s ease",
  "&:hover": { color: "#fff", pl: 0.75 },
} as const;

/**
 * Site-wide dark footer with link columns, contacts and bottom bar.
 */
export function WebsiteFooter() {
  const SCHOOL = getSchoolInfo();

  return (
    <Box component="footer" className="website-footer no-print" sx={{ bgcolor: WEBSITE_COLORS.footerBg, color: "rgba(255,255,255,0.85)" }}>
      {/* Accent top rule */}
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${WEBSITE_COLORS.primary} 0 60%, ${WEBSITE_COLORS.secondary} 60% 100%)` }} />

      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 5 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1.6fr 1fr 1fr 1fr",
              lg: "1.8fr repeat(4, 1fr)",
            },
          }}
        >
          {/* Identity + contacts */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Logo size={44} variant="light" withText={false} />
              <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: 18, letterSpacing: "0.02em" }}>
                {SCHOOL.name}
              </Typography>
            </Box>
            <Typography sx={{ color: WEBSITE_COLORS.secondaryLight, fontStyle: "italic", mb: 2, fontSize: 14 }}>
              {SCHOOL.motto}
            </Typography>

            <Box sx={{ display: "flex", gap: 1.2, mb: 1.5, alignItems: "flex-start" }}>
              <LocationOnIcon sx={{ fontSize: 18, mt: 0.3, color: WEBSITE_COLORS.secondary }} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)" }}>
                {SCHOOL.address}<br />{SCHOOL.postal}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.2, mb: 1.5, alignItems: "center" }}>
              <PhoneIcon sx={{ fontSize: 18, color: WEBSITE_COLORS.secondary }} />
              <Box component="a" href={`tel:+${SCHOOL.phoneRaw}`} sx={{ color: "rgba(255,255,255,0.78)", fontSize: 14, textDecoration: "none", "&:hover": { color: "#fff" } }}>
                {SCHOOL.phone}
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1.2, mb: 1.5, alignItems: "center" }}>
              <EmailIcon sx={{ fontSize: 18, color: WEBSITE_COLORS.secondary }} />
              <Box component="a" href={`mailto:${SCHOOL.email}`} sx={{ color: "rgba(255,255,255,0.78)", fontSize: 14, textDecoration: "none", "&:hover": { color: "#fff" } }}>
                {SCHOOL.email}
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1.2, mb: 2.5, alignItems: "center" }}>
              <AccessTimeIcon sx={{ fontSize: 18, color: WEBSITE_COLORS.secondary }} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)" }}>
                Mon – Fri: 7:30 AM – 5:00 PM
              </Typography>
            </Box>
            <SocialIcons color="rgba(255,255,255,0.7)" hoverColor="#fff" size={17} />
          </Box>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <Box key={col.heading}>
              <Typography sx={columnHeadingSx}>{col.heading}</Typography>
              {col.links.map((l) => (
                <Box key={l.label + l.href} component={Link} href={l.href} sx={linkSx}>
                  {l.label}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Container>

      {/* Watermark logo strip */}
      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.08)", py: 2.5, textAlign: "center", opacity: 0.35 }}>
        <Logo size={30} variant="light" withText={false} />
      </Box>

      {/* Bottom bar */}
      <Box sx={{ bgcolor: "rgba(0,0,0,0.25)" }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              py: 2,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              textAlign: "center",
            }}
          >
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              © {new Date().getFullYear()} {SCHOOL.name}. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
              {SCHOOL.tagline} · Powered by ShuleSmart
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}