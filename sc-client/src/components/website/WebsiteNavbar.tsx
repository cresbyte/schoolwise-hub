/**
 * Sticky public website navigation bar with dropdowns and mobile drawer.
 * @module WebsiteNavbar
 */
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem,
  Container,
  Divider,
} from "@mui/material";
<<<<<<< HEAD
import {Menu, Close, ExpandMore, KeyboardArrowDown, Phone, Email, Facebook, Twitter} from "@mui/icons-material";
import YouTubeIcon from "@mui/icons-material/YouTube";
=======
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Logo } from "@/components/common/Logo";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
>>>>>>> 0a504b006fe5d116c278ca0f79d2bee09e343aa1
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSchoolInfo } from "@/lib/website/constants";

interface NavLink {
  label: string;
  href: string;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "About",
    links: [
      { label: "Our Story", href: "/about#story" },
      { label: "Vision & Mission", href: "/about#vision" },
      { label: "Leadership", href: "/about#leadership" },
      { label: "Accreditation", href: "/about#accreditation" },
      { label: "Facilities", href: "/about#facilities" },
    ],
  },
  {
    label: "Academics",
    links: [
      { label: "CBC Programme", href: "/academics#cbc" },
      { label: "8-4-4 Programme", href: "/academics#844" },
      { label: "KCSE Results", href: "/academics#results" },
      { label: "Academic Calendar", href: "/academics#calendar" },
    ],
  },
  {
    label: "Admissions",
    links: [
      { label: "How to Apply", href: "/admissions#process" },
      { label: "Fee Structure", href: "/admissions#fees" },
      { label: "Available Spaces", href: "/admissions#spaces" },
      { label: "Scholarships", href: "/admissions#scholarships" },
      { label: "Apply Online", href: "/admissions/apply" },
    ],
  },
  {
    label: "School Life",
    links: [
      { label: "Sports", href: "/school-life#sports" },
      { label: "Clubs", href: "/school-life#clubs" },
      { label: "Arts & Culture", href: "/school-life#arts" },
      { label: "Leadership", href: "/school-life#leadership" },
      { label: "Boarding", href: "/school-life#boarding" },
      { label: "Photo Gallery", href: "/gallery" },
    ],
  },
];

const navLinkSx = {
  color: "common.white",
  fontWeight: 500,
  fontSize: 15,
  letterSpacing: "0.02em",
  textTransform: "none" as const,
  position: "relative" as const,
  "&:hover": {
    color: "secondary.main",
    backgroundColor: "transparent",
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: 4,
      left: 12,
      right: 12,
      height: 2,
      bgcolor: "secondary.main",
      borderRadius: 1,
    },
  },
  "&.active": {
    color: "secondary.main",
  },
};

/**
 * Sticky navbar with top info bar, desktop dropdown menus and mobile drawer.
 */
export function WebsiteNavbar() {
  const SCHOOL = getSchoolInfo();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchors, setMenuAnchors] = useState<Record<string, HTMLElement | null>>({});

  const openMenu = (label: string) => (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchors((a) => ({ ...a, [label]: e.currentTarget }));
  };
  const closeMenu = (label: string) => () => {
    setMenuAnchors((a) => ({ ...a, [label]: null }));
  };

  return (
    <>
      <Box
        className="website-navbar no-print"
        sx={{
          bgcolor: "primary.dark",
          color: "common.white",
          height: 36,
          display: "flex",
          alignItems: "center",
        }}
      >
<<<<<<< HEAD
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
                href="/login"
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
=======
        <Container maxWidth="xl" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
            Term 2, 2026 is ongoing
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              component="a"
              href={`tel:+${SCHOOL.phoneRaw}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "rgba(255,255,255,0.7)",
                fontSize: 12,
                textDecoration: "none",
                "&:hover": { color: "common.white" },
              }}
            >
              <PhoneIcon sx={{ fontSize: 14 }} />
              {SCHOOL.phone}
            </Box>
            <Box
              component="a"
              href={`mailto:${SCHOOL.email}`}
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 0.5,
                color: "rgba(255,255,255,0.7)",
                fontSize: 12,
                textDecoration: "none",
                "&:hover": { color: "common.white" },
              }}
            >
              <EmailIcon sx={{ fontSize: 14 }} />
              {SCHOOL.email}
>>>>>>> 0a504b006fe5d116c278ca0f79d2bee09e343aa1
            </Box>
          </Box>
        </Container>
      </Box>

      <AppBar
        position="sticky"
        elevation={0}
        className="no-print"
        sx={{
          bgcolor: "primary.main",
          color: "common.white",
          borderBottom: "none",
        }}
      >
        <Container maxWidth="xl">
<<<<<<< HEAD
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
                    color: "#fff",
                    fontFamily: "'Poppins', sans-serif",
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
                    color: "rgba(255,255,255,0.7)",
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
                      color: isActive(group.href ?? "/___") ? KAB.secondaryLight : "#fff",
                      fontFamily: "'Poppins', sans-serif",
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
                                fontFamily: "'Poppins', sans-serif",
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
                                fontFamily: "'Poppins', sans-serif",
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
                    color: isActive(link.href) ? KAB.secondaryLight : "#fff",
                    fontFamily: "'Poppins', sans-serif",
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
=======
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 1 }}>
>>>>>>> 0a504b006fe5d116c278ca0f79d2bee09e343aa1
            <IconButton
              edge="start"
              sx={{ display: { md: "none" }, color: "common.white" }}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </IconButton>

<<<<<<< HEAD
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
              fontFamily: "'Poppins', sans-serif",
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
=======
            <Box
              component={Link}
              href="/"
>>>>>>> 0a504b006fe5d116c278ca0f79d2bee09e343aa1
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "common.white",
                mr: 2,
                flexShrink: 0,
              }}
            >
<<<<<<< HEAD
              <AccordionSummary expandIcon={<ExpandMore />}>
=======
              <Logo size={40} variant="light" withText={false} sx={{ mr: 1.5 }} />
              <Box>
>>>>>>> 0a504b006fe5d116c278ca0f79d2bee09e343aa1
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: 14, sm: 16 },
                    color: "common.white",
                    lineHeight: 1.2,
                  }}
                >
                  {SCHOOL.shortName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: { xs: "none", sm: "block" },
                    color: "rgba(255,255,255,0.7)",
                    fontStyle: "italic",
                  }}
                >
                  {SCHOOL.motto}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", flex: 1, gap: 0.5 }}
            >
              {NAV_GROUPS.map((group) => (
                <Box key={group.label}>
                  <Button
                    endIcon={<ExpandMoreIcon />}
                    onClick={openMenu(group.label)}
                    sx={{
                      ...navLinkSx,
                      bgcolor: menuAnchors[group.label] ? "rgba(255,255,255,0.08)" : "transparent",
                    }}
                  >
                    {group.label}
                  </Button>
                  <Menu
                    anchorEl={menuAnchors[group.label]}
                    open={Boolean(menuAnchors[group.label])}
                    onClose={closeMenu(group.label)}
                  >
                    {group.links.map((link) => (
                      <MenuItem
                        key={link.href}
                        component="a"
                        href={link.href}
                        onClick={closeMenu(group.label)}
                        sx={{ fontSize: 14 }}
                      >
                        {link.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              ))}
              <Button
                component={Link}
                href="/news"
                className={pathname.startsWith("/news") ? "active" : undefined}
                sx={navLinkSx}
              >
                News & Events
              </Button>
              <Button
                component={Link}
                href="/contact"
                className={pathname === "/contact" ? "active" : undefined}
                sx={navLinkSx}
              >
                Contact
              </Button>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
              <Button
                component={Link}
                href="/login"
                variant="outlined"
                size="small"
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  fontWeight: 600,
                  color: "common.white",
                  borderColor: "rgba(255,255,255,0.5)",
                  "&:hover": { borderColor: "common.white", bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                Parent Portal
              </Button>
              <Button
                component={Link}
                href="/admissions/apply"
                variant="contained"
                color="secondary"
                size="small"
                sx={{ fontWeight: 700 }}
              >
                Apply Now
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className="no-print"
      >
        <Box sx={{ width: 300, pt: 2 }}>
          <Box sx={{ px: 2, mb: 2 }}>
            <Typography sx={{ fontWeight: 700, color: "primary.main" }}>
              {SCHOOL.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {SCHOOL.motto}
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItemButton
              component={Link}
              href="/"
              selected={pathname === "/"}
              onClick={() => setDrawerOpen(false)}
            >
              <ListItemText primary="Home" />
            </ListItemButton>
            {NAV_GROUPS.map((group) => (
              <Accordion key={group.label} disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600 }}>{group.label}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  {group.links.map((link) => (
                    <ListItemButton
                      key={link.href}
                      component="a"
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      sx={{ pl: 3 }}
                    >
                      <ListItemText
                        primary={link.label}
                        slotProps={{ primary: { style: { fontSize: 14 } } }}
                      />
                    </ListItemButton>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
            <ListItemButton component={Link} href="/news" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="News & Events" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/contact"
              onClick={() => setDrawerOpen(false)}
            >
              <ListItemText primary="Contact" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/parents"
              onClick={() => setDrawerOpen(false)}
            >
              <ListItemText primary="Parent Resources" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/our-staff"
              onClick={() => setDrawerOpen(false)}
            >
              <ListItemText primary="Our Staff" />
            </ListItemButton>
          </List>
          <Divider />
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              fullWidth
              onClick={() => setDrawerOpen(false)}
            >
              Parent Portal
            </Button>
            <Button
              component={Link}
              href="/admissions/apply"
              variant="contained"
              color="secondary"
              fullWidth
              onClick={() => setDrawerOpen(false)}
            >
              Apply Now
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
