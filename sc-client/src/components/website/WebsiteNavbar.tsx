/**
 * Sticky public website navigation bar — Kabarak University style.
 * Two-row layout: utility topbar + logo/nav row with mega-menu dropdowns.
 * @module WebsiteNavbar
 */
"use client";
import { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  IconButton,
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { Menu, Close, ExpandMore, KeyboardArrowDown, Phone, Email, Facebook, Twitter } from "@mui/icons-material";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/common/Logo";
import { getSchoolInfo } from "@/lib/website/constants";
import { KAB } from "@/theme/websiteTheme";

// ─── Nav Config ──────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "About Us",
    href: "/about",
    columns: [
      {
        heading: "Institution",
        links: [
          { label: "Our Story", href: "/about#story" },
          { label: "Vision & Mission", href: "/about#vision" },
          { label: "Core Values", href: "/about#values" },
          { label: "Accreditation", href: "/about#accreditation" },
        ],
      },
      {
        heading: "People",
        links: [
          { label: "Leadership Team", href: "/about#leadership" },
          { label: "Our Staff", href: "/our-staff" },
        ],
      },
      {
        heading: "Campus",
        links: [
          { label: "Facilities", href: "/about#facilities" },
          { label: "Photo Gallery", href: "/gallery" },
        ],
      },
    ],
  },
  {
    label: "Academics",
    href: "/academics",
    columns: [
      {
        heading: "Programmes",
        links: [
          { label: "CBC Programme", href: "/academics#cbc" },
          { label: "8-4-4 Programme", href: "/academics#844" },
          { label: "Junior Secondary", href: "/academics#junior" },
          { label: "Senior Secondary", href: "/academics#senior" },
        ],
      },
      {
        heading: "Performance",
        links: [
          { label: "KCSE Results", href: "/academics#results" },
          { label: "Academic Calendar", href: "/academics#calendar" },
        ],
      },
    ],
  },
  {
    label: "Admissions",
    href: "/admissions",
    columns: [
      {
        heading: "Apply",
        links: [
          { label: "How to Apply", href: "/admissions#process" },
          { label: "Apply Online", href: "/admissions/apply" },
          { label: "Available Spaces", href: "/admissions#spaces" },
        ],
      },
      {
        heading: "Information",
        links: [
          { label: "Fee Structure", href: "/admissions#fees" },
          { label: "Scholarships", href: "/admissions#scholarships" },
          { label: "FAQs", href: "/admissions#faqs" },
        ],
      },
    ],
  },
  {
    label: "School Life",
    href: "/school-life",
    columns: [
      {
        heading: "Activities",
        links: [
          { label: "Sports", href: "/school-life#sports" },
          { label: "Arts & Culture", href: "/school-life#arts" },
          { label: "Clubs & Societies", href: "/school-life#clubs" },
        ],
      },
      {
        heading: "Campus Life",
        links: [
          { label: "Boarding", href: "/school-life#boarding" },
          { label: "Leadership", href: "/school-life#leadership" },
        ],
      },
    ],
  },
];

const SOLO_LINKS = [
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function WebsiteNavbar() {
  const pathname = usePathname();
  const school = getSchoolInfo();

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  const closeTimeout = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  const handleMenuEnter = (label) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpenMenu(label);
  };

  const handleMenuLeave = () => {
    closeTimeout.current = setTimeout(() => setOpenMenu(null), 120);
  };

  const isActive = (href) =>
    href !== "/" && pathname.startsWith(href.split("#")[0]);

  return (
    <>
      {/* ── Utility Topbar ───────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          bgcolor: KAB.primaryDark,
          color: "rgba(255,255,255,0.82)",
          fontSize: 13,
          display: { xs: "none", md: "block" },
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: "6px",
            }}
          >
            {/* Social icons */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {[
                { icon: <Facebook sx={{ fontSize: 16 }} />, label: "Facebook" },
                { icon: <Twitter sx={{ fontSize: 16 }} />, label: "Twitter" },
                { icon: <YouTubeIcon sx={{ fontSize: 16 }} />, label: "YouTube" },
              ].map(({ icon, label }) => (
                <IconButton
                  key={label}
                  size="small"
                  aria-label={label}
                  href="#"
                  component="a"
                  sx={{
                    color: "rgba(255,255,255,0.7)",
                    p: "4px",
                    "&:hover": { color: "#fff", bgcolor: "transparent" },
                  }}
                >
                  {icon}
                </IconButton>
              ))}
            </Box>

            {/* Contact info + quick links */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Phone sx={{ fontSize: 13 }} />
                <Typography
                  component="a"
                  href={`tel:+${school.phoneRaw}`}
                  sx={{
                    fontSize: 12,
                    color: "inherit",
                    textDecoration: "none",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  {school.phone}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Email sx={{ fontSize: 13 }} />
                <Typography
                  component="a"
                  href={`mailto:${school.email}`}
                  sx={{
                    fontSize: 12,
                    color: "inherit",
                    textDecoration: "none",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  {school.email}
                </Typography>
              </Box>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.2)", my: "4px" }}
              />
              <Typography
                component={Link}
                href="/parent-portal"
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.82)",
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": { color: "#fff" },
                }}
              >
                Parent Portal
              </Typography>
              <Typography
                component={Link}
                href="/staff-portal"
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.82)",
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": { color: "#fff" },
                }}
              >
                Staff Portal
              </Typography>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.2)", my: "4px" }}
              />
              <Typography
                component={Link}
                href="/admissions/apply"
                sx={{
                  fontSize: 12,
                  color: KAB.secondaryLight,
                  textDecoration: "none",
                  fontWeight: 600,
                  "&:hover": { color: "#fff" },
                }}
              >
                Apply Now →
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Main Nav Row ─────────────────────────────────────────────────── */}
      <Box
        component="nav"
        aria-label="Main navigation"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          bgcolor: "#ffffff", /* Changed from KAB.primary to white */
          boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.05)" : "none",
          transition: "box-shadow 0.3s ease, padding 0.3s ease",
        }}
      >
        <Container maxWidth="xl">
          <Box
            ref={menuRef}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: scrolled ? "8px" : "14px",
              transition: "padding 0.3s ease",
            }}
          >
            {/* Logo */}
            <Box
              component={Link}
              href="/"
              sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none" }}
            >
              <Logo size={scrolled ? 36 : 44} withText={false} />
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography
                  sx={{
                    color: "#000000", /* Changed from #fff to black */
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: scrolled ? 14 : 16,
                    lineHeight: 1.1,
                    transition: "font-size 0.3s ease",
                  }}
                >
                  {school.shortName}
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(0,0,0,0.7)", /* Changed to gray */
                    fontSize: 10,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Private Academy
                </Typography>
              </Box>
            </Box>

            {/* Desktop nav links */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {NAV_GROUPS.map((group) => (
                <Box
                  key={group.label}
                  onMouseEnter={() => handleMenuEnter(group.label)}
                  onMouseLeave={handleMenuLeave}
                  sx={{ position: "relative" }}
                >
                  <Box
                    component={Link}
                    href={group.href ?? "#"}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.25,
                      px: 1.5,
                      py: 1,
                      color: isActive(group.href ?? "/___") ? KAB.secondaryLight : "#000000", /* Changed from #fff to black */
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 500,
                      fontSize: 14,
                      textDecoration: "none",
                      borderBottom: isActive(group.href ?? "/___")
                        ? `2px solid ${KAB.secondaryLight}`
                        : "2px solid transparent",
                      transition: "color 0.2s, border-color 0.2s",
                      "&:hover": {
                        color: KAB.secondaryLight,
                        borderBottomColor: KAB.secondaryLight,
                      },
                    }}
                  >
                    {group.label}
                    <KeyboardArrowDown
                      sx={{
                        fontSize: 16,
                        transition: "transform 0.2s",
                        transform: openMenu === group.label ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </Box>

                  {/* Mega-dropdown panel */}
                  {openMenu === group.label && (
                    <Box
                      onMouseEnter={() => handleMenuEnter(group.label)}
                      onMouseLeave={handleMenuLeave}
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        mt: "2px",
                        bgcolor: "#fff",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                        minWidth: group.columns.length > 2 ? 480 : 320,
                        borderTop: `3px solid ${KAB.primary}`,
                        zIndex: 10,
                        display: "flex",
                        gap: 0,
                        p: 0,
                      }}
                    >
                      {group.columns.map((col, ci) => (
                        <Box
                          key={ci}
                          sx={{
                            flex: 1,
                            p: 2.5,
                            borderRight:
                              ci < group.columns.length - 1
                                ? `1px solid ${KAB.borderLight}`
                                : "none",
                          }}
                        >
                          {col.heading && (
                            <Typography
                              sx={{
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 700,
                                fontSize: 11,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: KAB.primary,
                                mb: 1.5,
                              }}
                            >
                              {col.heading}
                            </Typography>
                          )}
                          {col.links.map((link) => (
                            <Box
                              key={link.href}
                              component={Link}
                              href={link.href}
                              sx={{
                                display: "block",
                                py: "6px",
                                color: KAB.textPrimary,
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 13,
                                textDecoration: "none",
                                fontWeight: isActive(link.href) ? 600 : 400,
                                borderLeft: isActive(link.href)
                                  ? `3px solid ${KAB.primary}`
                                  : "3px solid transparent",
                                pl: 1.5,
                                transition: "color 0.15s, border-color 0.15s",
                                "&:hover": {
                                  color: KAB.primary,
                                  borderLeftColor: KAB.primary,
                                },
                              }}
                            >
                              {link.label}
                            </Box>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}

              {SOLO_LINKS.map((link) => (
                <Box
                  key={link.href}
                  component={Link}
                  href={link.href}
                  sx={{
                    px: 1.5,
                    py: 1,
                    color: isActive(link.href) ? KAB.secondaryLight : "#000000", /* Changed from #fff to black */
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500,
                    fontSize: 14,
                    textDecoration: "none",
                    borderBottom: isActive(link.href)
                      ? `2px solid ${KAB.secondaryLight}`
                      : "2px solid transparent",
                    transition: "color 0.2s, border-color 0.2s",
                    "&:hover": {
                      color: KAB.secondaryLight,
                      borderBottomColor: KAB.secondaryLight,
                    },
                  }}
                >
                  {link.label}
                </Box>
              ))}
            </Box>

            {/* Mobile hamburger */}
            <IconButton
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { md: "none" }, color: "#000000" }} /* Changed from #fff to black */
            >
              <Menu />
            </IconButton>
          </Box>
        </Container>
      </Box>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 300,
              bgcolor: "#fff",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        {/* Drawer header */}
        <Box
          sx={{
            bgcolor: KAB.primary,
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {school.shortName}
          </Typography>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{ color: "rgba(255,255,255,0.8)" }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {NAV_GROUPS.map((group) => (
            <Accordion
              key={group.label}
              disableGutters
              elevation={0}
              sx={{
                borderBottom: `1px solid ${KAB.borderLight}`,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    color: KAB.textPrimary,
                  }}
                >
                  {group.label}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {group.columns.flatMap((col) =>
                  col.links.map((link) => (
                    <ListItemButton
                      key={link.href}
                      component={Link}
                      href={link.href}
                      selected={isActive(link.href)}
                      sx={{
                        pl: 3,
                        py: "7px",
                        "&.Mui-selected": {
                          bgcolor: `${KAB.primary}12`,
                          color: KAB.primary,
                        },
                      }}
                    >
                      <ListItemText
                        disableTypography
                        primary={
                          <Typography
                            sx={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 13,
                              fontWeight: isActive(link.href) ? 600 : 400,
                              color: "inherit",
                            }}
                          >
                            {link.label}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  ))
                )}
              </AccordionDetails>
            </Accordion>
          ))}

          {SOLO_LINKS.map((link) => (
            <ListItemButton
              key={link.href}
              component={Link}
              href={link.href}
              selected={isActive(link.href)}
              sx={{
                px: 3,
                py: "10px",
                borderBottom: `1px solid ${KAB.borderLight}`,
              }}
            >
              <ListItemText
                disableTypography
                primary={
                  <Typography
                    sx={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 600,
                      fontSize: 14,
                      color: "inherit",
                    }}
                  >
                    {link.label}
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
        </Box>

        {/* Drawer footer */}
        <Box sx={{ p: 2, borderTop: `1px solid ${KAB.border}` }}>
          <Box
            component={Link}
            href="/admissions/apply"
            sx={{
              display: "block",
              textAlign: "center",
              bgcolor: KAB.primary,
              color: "#fff",
              py: 1.25,
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              mb: 1,
              "&:hover": { bgcolor: KAB.primaryDark },
            }}
          >
            Apply Now
          </Box>
          <Box
            sx={{ display: "flex", gap: 1, mt: 1 }}
          >
            <Box
              component={Link}
              href="/parent-portal"
              sx={{
                flex: 1,
                display: "block",
                textAlign: "center",
                border: `1px solid #008264`,
                color: "#005a46",
                py: 1.25,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
                borderRadius: 1,
                "&:hover": { bgcolor: "rgba(0,130,100,0.06)" },
              }}
            >
              Parent Portal
            </Box>
            <Box
              component={Link}
              href="/staff-portal"
              sx={{
                flex: 1,
                display: "block",
                textAlign: "center",
                border: `1px solid #1a3a7a`,
                color: "#1a3a7a",
                py: 1.25,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
                borderRadius: 1,
                "&:hover": { bgcolor: "rgba(26,58,122,0.06)" },
              }}
            >
              Staff Portal
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
