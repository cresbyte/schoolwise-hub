/**
 * Public website header — Kabarak-style.
 * Structure: thin top utility bar (quick links + social icons) above a
 * sticky main nav row (logo left, config-driven mega-menus, expanding
 * search on the right). Shrinks slightly on scroll. Mobile collapses into
 * a slide-in drawer with accordion sections. No CTA buttons.
 * @module WebsiteNavbar
 */
"use client";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Divider from "@mui/material/Divider";
import InputBase from "@mui/material/InputBase";
import Collapse from "@mui/material/Collapse";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/common/Logo";
import { SocialIcons } from "./SocialIcons";
import { MegaMenu } from "./MegaMenu";
import { getSchoolInfo } from "@/lib/website/constants";
import { MAIN_NAV, TOP_BAR_LINKS } from "@/lib/website/nav";

/**
 * Sticky Kabarak-style header with top bar, mega-menus and mobile drawer.
 */
export function WebsiteNavbar() {
  const SCHOOL = getSchoolInfo();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/news?q=${encodeURIComponent(query.trim())}`);
  };

  const isActive = (href?: string) =>
    !!href && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <Box component="header" className="no-print" sx={{ position: "sticky", top: 0, zIndex: (t) => t.zIndex.appBar }}>
      {/* Top utility bar */}
      <Box sx={{ bgcolor: "primary.dark", color: "rgba(255,255,255,0.85)" }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "center", md: "space-between" },
              minHeight: 38,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2.5 }}>
              {TOP_BAR_LINKS.map((l) => (
                <Box
                  key={l.label}
                  component={Link}
                  href={l.href}
                  sx={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 12.5,
                    fontWeight: 500,
                    textDecoration: "none",
                    letterSpacing: "0.02em",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  {l.label}
                </Box>
              ))}
            </Box>
            <SocialIcons color="rgba(255,255,255,0.8)" hoverColor="#fff" size={15} />
          </Box>
        </Container>
      </Box>

      {/* Main nav row */}
      <Box
        sx={{
          position: "relative",
          bgcolor: "#fff",
          borderBottom: "1px solid",
          borderColor: scrolled ? "transparent" : "#eceef0",
          boxShadow: scrolled ? "0 4px 16px rgba(0,0,0,0.10)" : "none",
          transition: "box-shadow 0.25s ease",
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: scrolled ? 66 : 84,
              transition: "min-height 0.25s ease",
            }}
          >
            {/* Logo */}
            <Box
              component={Link}
              href="/"
              sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none", flexShrink: 0 }}
            >
              <Logo size={scrolled ? 40 : 48} variant="dark" withText={false} />
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    lineHeight: 1,
                    color: "primary.main",
                    fontSize: { xs: 17, md: scrolled ? 19 : 22 },
                    transition: "font-size 0.25s ease",
                  }}
                >
                  {SCHOOL.shortName.toUpperCase()}
                </Typography>
                <Typography
                  sx={{
                    display: { xs: "none", sm: "block" },
                    fontWeight: 600,
                    fontSize: { md: scrolled ? 10 : 11 },
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                  }}
                >
                  Private Academy
                </Typography>
              </Box>
            </Box>

            {/* Desktop nav */}
            <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center" }}>
              {MAIN_NAV.map((item) =>
                item.columns ? (
                  <MegaMenu
                    key={item.label}
                    label={item.label}
                    columns={item.columns}
                    active={item.columns.some((c) => c.links.some((l) => isActive(l.href.split("#")[0])))}
                  />
                ) : (
                  <Box
                    key={item.label}
                    component={Link}
                    href={item.href!}
                    sx={{
                      position: "relative",
                      px: 1.5,
                      py: 3,
                      fontWeight: 600,
                      fontSize: 13.5,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      color: isActive(item.href) ? "primary.main" : "#3a3f45",
                      transition: "color 0.2s ease",
                      "&:hover": { color: "primary.main" },
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        left: 12,
                        right: 12,
                        bottom: 14,
                        height: 3,
                        bgcolor: "secondary.main",
                        transform: isActive(item.href) ? "scaleX(1)" : "scaleX(0)",
                        transformOrigin: "left",
                        transition: "transform 0.22s ease",
                      },
                      "&:hover::after": { transform: "scaleX(1)" },
                    }}
                  >
                    {item.label}
                  </Box>
                ),
              )}
            </Box>

            {/* Right controls */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                component="form"
                onSubmit={submitSearch}
                sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center" }}
              >
                <Collapse orientation="horizontal" in={searchOpen}>
                  <InputBase
                    autoFocus={searchOpen}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    sx={{
                      width: 200,
                      px: 1.5,
                      py: 0.5,
                      fontSize: 14,
                      border: "1px solid #d7dade",
                      bgcolor: "#f7f8f9",
                    }}
                  />
                </Collapse>
                <IconButton
                  onClick={() => setSearchOpen((s) => !s)}
                  aria-label={searchOpen ? "Close search" : "Open search"}
                  sx={{ color: "primary.main" }}
                >
                  {searchOpen ? <CloseIcon /> : <SearchIcon />}
                </IconButton>
              </Box>
              <IconButton
                sx={{ display: { xs: "inline-flex", lg: "none" }, color: "primary.main" }}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} className="no-print">
        <Box sx={{ width: { xs: "84vw", sm: 340 }, display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, bgcolor: "primary.main" }}>
            <Typography sx={{ fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>
              {SCHOOL.shortName.toUpperCase()}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "#fff" }} aria-label="Close menu">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box component="form" onSubmit={submitSearch} sx={{ p: 2, pb: 1 }}>
            <InputBase
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              fullWidth
              startAdornment={<SearchIcon sx={{ fontSize: 18, mr: 1, color: "text.secondary" }} />}
              sx={{ px: 1.5, py: 1, border: "1px solid #d7dade", bgcolor: "#f7f8f9", fontSize: 14 }}
            />
          </Box>

          <Box sx={{ overflowY: "auto", flex: 1 }}>
            <List disablePadding>
              {MAIN_NAV.map((item) =>
                item.columns ? (
                  <Accordion key={item.label} disableGutters elevation={0} square>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ fontWeight: 600, textTransform: "uppercase", fontSize: 14, letterSpacing: "0.04em" }}>
                        {item.label}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                      {item.columns.map((col) => (
                        <Box key={col.heading} sx={{ mb: 1.5 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "primary.main", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                            {col.heading}
                          </Typography>
                          {col.links.map((l) => (
                            <ListItemButton
                              key={l.label + l.href}
                              component={Link}
                              href={l.href}
                              onClick={() => setDrawerOpen(false)}
                              sx={{ pl: 1, py: 0.5 }}
                            >
                              <ListItemText primary={l.label} slotProps={{ primary: { fontSize: 14 } }} />
                            </ListItemButton>
                          ))}
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ) : (
                  <ListItemButton
                    key={item.label}
                    component={Link}
                    href={item.href!}
                    onClick={() => setDrawerOpen(false)}
                    selected={isActive(item.href)}
                  >
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { sx: { fontWeight: 600, textTransform: "uppercase", fontSize: 14, letterSpacing: "0.04em" } } }}
                    />
                  </ListItemButton>
                ),
              )}
            </List>
            <Divider />
            <List>
              {TOP_BAR_LINKS.map((l) => (
                <ListItemButton key={l.label} component={Link} href={l.href} onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary={l.label} slotProps={{ primary: { fontSize: 13 } }} />
                </ListItemButton>
              ))}
            </List>
          </Box>

          <Box sx={{ p: 2, bgcolor: "#f2f4f6", display: "flex", justifyContent: "center" }}>
            <SocialIcons color="#5a6169" hoverColor="#95191c" size={18} />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}