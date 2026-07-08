/**
 * Quick links portal tiles — apply, portal, e-learning, contact.
 * @module QuickLinks
 */
"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import SchoolIcon from "@mui/icons-material/School";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import PersonIcon from "@mui/icons-material/Person";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EventIcon from "@mui/icons-material/Event";
import { KAB } from "@/theme/websiteTheme";
import { staggerContainer, staggerItem, viewportOnce } from "@/lib/motion";

const TILES = [
  {
    label: "Apply for Admission",
    sub: "Start your application online",
    href: "/admissions/apply",
    icon: <HowToRegIcon sx={{ fontSize: 32 }} />,
    color: KAB.primary,
  },
  {
    label: "Parent Portal",
    sub: "View fees, marks & attendance",
    href: "/login",
    icon: <PersonIcon sx={{ fontSize: 32 }} />,
    color: KAB.secondary,
  },
  {
    label: "Academic Calendar",
    sub: "Term dates and school events",
    href: "/academics#calendar",
    icon: <EventIcon sx={{ fontSize: 32 }} />,
    color: "#C8922A",
  },
  {
    label: "Our Academics",
    sub: "CBC, 8-4-4 and beyond",
    href: "/academics",
    icon: <SchoolIcon sx={{ fontSize: 32 }} />,
    color: KAB.primary,
  },
  {
    label: "Library & Resources",
    sub: "Downloads, handbooks & forms",
    href: "/admissions#resources",
    icon: <MenuBookIcon sx={{ fontSize: 32 }} />,
    color: KAB.secondary,
  },
  {
    label: "Contact Us",
    sub: "Get in touch with our team",
    href: "/contact",
    icon: <ContactMailIcon sx={{ fontSize: 32 }} />,
    color: "#C8922A",
  },
];

/** Quick-access portal tile grid. */
export function QuickLinks() {
  return (
    <Box
      component="section"
      sx={{ bgcolor: "#fff", py: { xs: 8, md: 10 } }}
      aria-label="Quick links"
    >
      <Container maxWidth="xl">
        <Box
          component={motion.div}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              sm: "repeat(3, 1fr)",
              md: "repeat(6, 1fr)",
            },
            gap: 0,
          }}
        >
          {TILES.map((tile, i) => (
            <Box
              key={tile.href}
              component={motion.div}
              variants={staggerItem}
            >
              <Box
                component={Link}
                href={tile.href}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  textDecoration: "none",
                  p: 3,
                  height: "100%",
                  minHeight: 160,
                  border: `1px solid ${KAB.borderLight}`,
                  borderLeft: i % 3 !== 0 ? "none" : `1px solid ${KAB.borderLight}`,
                  borderTop: i >= 3 ? "none" : `1px solid ${KAB.borderLight}`,
                  color: tile.color,
                  bgcolor: "#fff",
                  transition: "all 0.25s",
                  "&:hover": {
                    bgcolor: tile.color,
                    color: "#fff",
                    borderColor: tile.color,
                    transform: "scale(1.03)",
                    zIndex: 1,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                  },
                  "@media (min-width: 900px)": {
                    borderLeft: i !== 0 ? "none" : `1px solid ${KAB.borderLight}`,
                    borderTop: `1px solid ${KAB.borderLight}`,
                  },
                }}
              >
                <Box sx={{ mb: 1.5 }}>{tile.icon}</Box>
                <Typography
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    lineHeight: 1.3,
                    mb: 0.5,
                  }}
                >
                  {tile.label}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 11,
                    opacity: 0.75,
                    lineHeight: 1.4,
                  }}
                >
                  {tile.sub}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
