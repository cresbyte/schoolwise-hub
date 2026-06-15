/**
 * Four-column website footer with newsletter signup.
 * @module WebsiteFooter
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import SchoolIcon from "@mui/icons-material/School";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NextLink from "next/link";
import { HEADING_FONT, SCHOOL, WEBSITE_COLORS } from "@/lib/website/constants";

const QUICK_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Academics", href: "/academics" },
  { label: "Admissions", href: "/admissions" },
  { label: "School Life", href: "/school-life" },
  { label: "News & Events", href: "/news" },
  { label: "Gallery", href: "/gallery" },
  { label: "Our Staff", href: "/our-staff" },
  { label: "Parent Resources", href: "/parents" },
];

const footerLinkSx = {
  color: "rgba(255,255,255,0.75)",
  fontSize: 14,
  textDecoration: "none",
  display: "block",
  "&:hover": { color: "#fff" },
} as const;

const bottomLinkSx = {
  color: "rgba(255,255,255,0.5)",
  fontSize: 12,
  textDecoration: "none",
  "&:hover": { color: "rgba(255,255,255,0.85)" },
} as const;

/**
 * Site-wide footer with identity, links, contact, and newsletter.
 */
export function WebsiteFooter() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <Box
      component="footer"
      className="website-footer no-print"
      sx={{ bgcolor: WEBSITE_COLORS.footerBg, color: "rgba(255,255,255,0.85)" }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.4fr 1fr 1fr 1.2fr" },
            gap: 4,
          }}
        >
          {/* Brand */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SchoolIcon sx={{ color: WEBSITE_COLORS.secondary, fontSize: 32 }} />
              <Typography
                sx={{
                  fontFamily: HEADING_FONT,
                  fontWeight: 700,
                  color: "common.white",
                  fontSize: 18,
                }}
              >
                {SCHOOL.name}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ mb: 1, fontStyle: "italic", color: WEBSITE_COLORS.secondary }}
            >
              {SCHOOL.motto}
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
              {SCHOOL.tagline}. A premier private day and boarding school in {SCHOOL.location},
              offering CBC and 8-4-4 programmes from PP1 to Form 4.
            </Typography>
          </Box>

          {/* Quick Links */}
          <Box>
            <Typography
              sx={{ fontFamily: HEADING_FONT, fontWeight: 700, color: "common.white", mb: 2 }}
            >
              Quick Links
            </Typography>
            <Stack spacing={0.75}>
              {QUICK_LINKS.map((link) => (
                <Box key={link.href} component={NextLink} href={link.href} sx={footerLinkSx}>
                  {link.label}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Contact */}
          <Box>
            <Typography
              sx={{ fontFamily: HEADING_FONT, fontWeight: 700, color: "common.white", mb: 2 }}
            >
              Contact Us
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1.5, alignItems: "flex-start" }}>
              <LocationOnIcon sx={{ fontSize: 18, mt: 0.3, color: WEBSITE_COLORS.secondary }} />
              <Typography variant="body2">
                {SCHOOL.address}, {SCHOOL.county}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 1.5, alignItems: "center" }}>
              <PhoneIcon sx={{ fontSize: 18, color: WEBSITE_COLORS.secondary }} />
              <Box
                component="a"
                href={`tel:+${SCHOOL.phoneRaw}`}
                sx={{ color: "rgba(255,255,255,0.75)", fontSize: 14, textDecoration: "none" }}
              >
                {SCHOOL.phone}
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <EmailIcon sx={{ fontSize: 18, color: WEBSITE_COLORS.secondary }} />
              <Box
                component="a"
                href={`mailto:${SCHOOL.email}`}
                sx={{ color: "rgba(255,255,255,0.75)", fontSize: 14, textDecoration: "none" }}
              >
                {SCHOOL.email}
              </Box>
            </Box>
          </Box>

          {/* Newsletter */}
          <Box>
            <Typography
              sx={{ fontFamily: HEADING_FONT, fontWeight: 700, color: "common.white", mb: 2 }}
            >
              Newsletter
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Stay updated with school news, events, and announcements.
            </Typography>
            {subscribed ? (
              <Typography variant="body2" sx={{ color: WEBSITE_COLORS.secondary }}>
                Thank you for subscribing!
              </Typography>
            ) : (
              <Box
                component="form"
                onSubmit={(e: React.FormEvent) => {
                  e.preventDefault();
                  setSubscribed(true);
                }}
              >
                <TextField
                  size="small"
                  placeholder="Your email"
                  type="email"
                  required
                  fullWidth
                  sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "rgba(255,255,255,0.08)",
                      color: "common.white",
                    },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                  }}
                />
                <Button type="submit" variant="contained" color="secondary" fullWidth>
                  Subscribe
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
      <Container maxWidth="lg">
        <Box
          sx={{
            py: 2,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
            © {new Date().getFullYear()} {SCHOOL.name}. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box component={NextLink} href="/privacy" sx={bottomLinkSx}>
              Privacy Policy
            </Box>
            <Box component={NextLink} href="/terms" sx={bottomLinkSx}>
              Terms of Use
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
            Powered by ShuleSmart
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
