"use client";

/**
 * Primrose Private Academy — Kabarak-style public homepage.
 * @module website/page
 */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import ApartmentIcon from "@mui/icons-material/Apartment";
import HotelIcon from "@mui/icons-material/Hotel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import { useSpring, useTransform } from "framer-motion";
import { getHeroSlides, getSchoolStats, getWhyChooseUs, getNewsArticles, getUpcomingEvents, type SchoolStat } from "@/lib/website/data";
import { WEBSITE_IMAGES, getSchoolInfo } from "@/lib/website/constants";
import { KAB } from "@/theme/websiteTheme";
import { staggerContainer, staggerItem, fadeInUp, fadeIn, viewportOnce } from "@/lib/motion";
import { QUICK_ACCESS } from "@/lib/website/nav";

// Icon mapping for highlight cards
const ICON_MAP: Record<string, React.ReactNode> = {
  school: <SchoolIcon />,
  groups: <GroupsIcon />,
  apartment: <ApartmentIcon />,
  hotel: <HotelIcon />,
  emoji_events: <EmojiEventsIcon />,
  family_restroom: <FamilyRestroomIcon />,
};

const INTERVAL_MS = 5500;

/** Kabarak-style hero carousel */
function Hero() {
  const slides = getHeroSlides();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <Box sx={{ position: "relative", minHeight: { xs: 480, md: 620 }, overflow: "hidden", bgcolor: KAB.dark }}>
      <AnimatePresence mode="wait">
        {slides.map(
          (slide, i) =>
            i === index && (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}
              >
                <Box
                  component="img"
                  src={slide.image}
                  alt={slide.imageAlt}
                  loading={i === 0 ? "eager" : "lazy"}
                  sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(52,58,64,0.35) 0%, rgba(52,58,64,0.55) 50%, rgba(52,58,64,0.75) 100%)` }} />
                <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
                  <Typography variant="overline" sx={{ color: KAB.green, fontWeight: 700, letterSpacing: "0.15em", mb: 1, display: "block" }}>
                    Welcome to Primrose Private Academy
                  </Typography>
                  <Typography variant="h1" component="h1" sx={{ fontWeight: 700, color: "common.white", mb: 2, maxWidth: 800, textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
                    {slide.title}
                  </Typography>
                  <Typography variant="h5" sx={{ color: "rgba(255,255,255,0.92)", mb: 4, maxWidth: 640, fontWeight: 400, lineHeight: 1.5 }}>
                    {slide.subtitle}
                  </Typography>
                  <Button LinkComponent={Link} href={slide.cta.href} variant="contained" size="large" sx={{ bgcolor: KAB.primary, color: "common.white", fontWeight: 700, px: 4, py: 1.5, "&:hover": { bgcolor: KAB.primaryDark } }}>
                    {slide.cta.label}
                  </Button>
                </Container>
              </motion.div>
            )
        )}
      </AnimatePresence>
      <Box sx={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 1, zIndex: 2 }}>
        {slides.map((_, i) => (
          <Box key={i} onClick={() => setIndex(i)} sx={{ width: i === index ? 28 : 10, height: 10, borderRadius: 0, bgcolor: i === index ? KAB.green : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.3s ease" }} />
        ))}
      </Box>
    </Box>
  );
}

/** Animated counter for stats */
function AnimatedCounter({ stat }: { stat: SchoolStat }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const spring = useSpring(0, { duration: 2000, bounce: 0 });
  const display = useTransform(spring, (v) => (stat.decimals && stat.decimals > 0 ? v.toFixed(stat.decimals) : Math.floor(v).toLocaleString()));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !started) { setStarted(true); spring.set(stat.value); } }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [stat.value, started, spring]);

  return (
    <Box ref={ref} sx={{ textAlign: "center", py: 1 }}>
      <Typography variant="h2" sx={{ fontWeight: 700, color: KAB.green, mb: 0.5, display: "flex", alignItems: "baseline", justifyContent: "center" }}>
        <motion.span>{display}</motion.span>
        {stat.suffix && <Box component="span" sx={{ ml: 0.5 }}>{stat.suffix}</Box>}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>{stat.label}</Typography>
    </Box>
  );
}

/** Kabarak-style animated stats band */
function StatsBand() {
  const stats = getSchoolStats();
  return (
    <Box component="section" sx={{ py: { xs: 5, md: 6 }, bgcolor: KAB.dark }}>
      <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer} style={{ width: "100%" }}>
        <Box sx={{ maxWidth: "xl", mx: "auto", px: { xs: 2, md: 4 }, display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: `repeat(${stats.length}, 1fr)` }, gap: { xs: 3, md: 4 } }}>
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <AnimatedCounter stat={stat} />
            </motion.div>
          ))}
        </Box>
      </motion.div>
    </Box>
  );
}

/** Highlight cards grid */
function HighlightGrid() {
  const items = getWhyChooseUs();
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 }, bgcolor: KAB.bgMuted }}>
      <Container maxWidth="xl">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}>
          <Typography variant="overline" sx={{ color: KAB.primary, fontWeight: 700, letterSpacing: "0.12em", mb: 1, display: "block", textAlign: "center" }}>Why Primrose</Typography>
          <Typography variant="h2" sx={{ textAlign: "center", mb: 1, color: KAB.textPrimary }}>Choosing the Right School</Typography>
          <Typography variant="body1" sx={{ textAlign: "center", mb: 5, maxWidth: 640, mx: "auto", color: KAB.textSecondary }}>Discover what makes our school a trusted choice for families across Nakuru and beyond.</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 3 }}>
            {items.map((item) => (
              <motion.div key={item.title} variants={staggerItem}>
                <Card sx={{ height: "100%", bgcolor: KAB.white, border: `1px solid ${KAB.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "transform 0.25s ease, box-shadow 0.25s ease", "&:hover": { transform: "translateY(-6px)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" } }}>
                  <CardContent sx={{ p: 3 }}>
                    <Avatar sx={{ bgcolor: KAB.primary, mb: 2, width: 52, height: 52 }}>{ICON_MAP[item.icon] || <SchoolIcon />}</Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: KAB.textPrimary }}>{item.title}</Typography>
                    <Typography variant="body2" sx={{ color: KAB.textSecondary, lineHeight: 1.7 }}>{item.description}</Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

/** News grid section */
function NewsGrid() {
  const articles = getNewsArticles().slice(0, 3);
  const CATEGORY_COLORS: Record<string, "primary" | "secondary" | "success" | "warning" | "info"> = { News: "primary", Events: "secondary", Achievements: "success", Announcements: "info" };
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 }, bgcolor: KAB.white }}>
      <Container maxWidth="xl">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}>
          <Typography variant="overline" sx={{ color: KAB.primary, fontWeight: 700, letterSpacing: "0.12em", mb: 1, display: "block", textAlign: "center" }}>Stay Informed</Typography>
          <Typography variant="h2" sx={{ textAlign: "center", mb: 1, color: KAB.textPrimary }}>Latest News & Updates</Typography>
          <Typography variant="body1" sx={{ textAlign: "center", mb: 5, maxWidth: 600, mx: "auto", color: KAB.textSecondary }}>Keep up with achievements, events, and announcements from our school community.</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
            {articles.map((article) => (
              <motion.div key={article.slug} variants={staggerItem}>
                <Card component={Link} href={`/news/${article.slug}`} sx={{ display: "block", height: "100%", textDecoration: "none", bgcolor: KAB.white, border: `1px solid ${KAB.border}`, boxShadow: "0 2px 6px rgba(0,0,0,0.05)", transition: "transform 0.25s ease, box-shadow 0.25s ease", "&:hover": { transform: "translateY(-6px)", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" } }}>
                  <Box component="img" src={article.image} alt={article.title} sx={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <Chip label={article.category} size="small" color={CATEGORY_COLORS[article.category] || "primary"} sx={{ fontWeight: 600 }} />
                      <Typography variant="caption" sx={{ color: KAB.textSecondary }}>{article.date}</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: KAB.textPrimary, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{article.title}</Typography>
                    <Typography variant="body2" sx={{ color: KAB.textSecondary, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{article.excerpt}</Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button LinkComponent={Link} href="/news" variant="contained" sx={{ bgcolor: KAB.primary, color: KAB.white, px: 4, "&:hover": { bgcolor: KAB.primaryDark } }}>View All News</Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

/** Notice board with upcoming events */
function NoticeBoard() {
  const events = getUpcomingEvents();
  return (
    <Box component="section" sx={{ py: { xs: 5, md: 7 }, bgcolor: KAB.bgMuted }}>
      <Container maxWidth="xl">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp}>
          <Typography variant="overline" sx={{ color: KAB.primary, fontWeight: 700, letterSpacing: "0.12em", mb: 1, display: "block", textAlign: "center" }}>Mark Your Calendar</Typography>
          <Typography variant="h3" sx={{ textAlign: "center", mb: 4, color: KAB.textPrimary, fontWeight: 700 }}>Upcoming Events</Typography>
          <Card sx={{ maxWidth: 720, mx: "auto", bgcolor: KAB.dark, color: "common.white", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              {events.map((event, idx) => (
                <Box key={event.id} sx={{ py: 2, px: 1, borderBottom: idx < events.length - 1 ? `1px solid ${KAB.borderDark}` : "none", "&:first-of-type": { pt: 0 }, "&:last-of-type": { pb: 0 } }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, bgcolor: KAB.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <EventIcon sx={{ color: "common.white", fontSize: 26 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: KAB.green, fontWeight: 700, mb: 0.5 }}>{event.date}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: "common.white", mb: 0.75 }}>{event.title}</Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.6)" }} />
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>{event.time}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.6)" }} />
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>{event.location}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}

/** Quick access icon grid */
function QuickLinks() {
  const ICONS: Record<string, React.ReactNode> = {
    portal: "Login",
    apply: "Apply",
    fees: "Fees",
    downloads: "Files",
    news: "News",
    contact: "Contact",
  };
  return (
    <Box component="section" sx={{ py: { xs: 5, md: 7 }, bgcolor: KAB.white }}>
      <Container maxWidth="xl">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}>
          <Typography variant="overline" sx={{ color: KAB.primary, fontWeight: 700, letterSpacing: "0.12em", mb: 1, display: "block", textAlign: "center" }}>Quick Access</Typography>
          <Typography variant="h3" sx={{ textAlign: "center", mb: 4, color: KAB.textPrimary, fontWeight: 700 }}>I Want To...</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }, gap: 2.5 }}>
            {QUICK_ACCESS.map((link) => (
              <motion.div key={link.label} variants={staggerItem}>
                <Card component={Link} href={link.href} sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", height: "100%", minHeight: { xs: 120, md: 140 }, py: 2.5, px: 2, bgcolor: KAB.bgMuted, border: `1px solid ${KAB.border}`, textDecoration: "none", transition: "all 0.25s ease", "&:hover": { bgcolor: KAB.primary, borderColor: KAB.primary, transform: "translateY(-4px)", boxShadow: "0 6px 16px rgba(149,25,28,0.2)", "& .ql-label": { color: "common.white" } } }}>
                  <Typography className="ql-label" variant="h6" sx={{ fontWeight: 700, color: KAB.primary, transition: "color 0.25s ease" }}>{ICONS[link.icon] || link.label}</Typography>
                  <Typography className="ql-label" variant="caption" sx={{ color: KAB.textSecondary, mt: 0.5, transition: "color 0.25s ease" }}>{link.label}</Typography>
                </Card>
              </motion.div>
            ))}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

/** Mission band */
function MissionBand() {
  const SCHOOL = getSchoolInfo();
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 }, background: `linear-gradient(135deg, ${KAB.primary} 0%, ${KAB.primaryDark} 50%, ${KAB.dark} 100%)`, color: "common.white", position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${KAB.green} 0%, ${KAB.gold} 50%, ${KAB.green} 100%)` }} />
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp}>
          <Typography variant="overline" sx={{ color: KAB.green, fontWeight: 700, letterSpacing: "0.15em", mb: 2, display: "block", textAlign: "center" }}>Our Foundation</Typography>
          <Typography variant="h2" sx={{ textAlign: "center", mb: 3, color: "common.white", fontWeight: 700 }}>Vision & Mission</Typography>
        </motion.div>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4, mt: 4 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp}>
            <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: "rgba(255,255,255,0.08)", borderLeft: `4px solid ${KAB.gold}` }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: KAB.gold }}>Our Vision</Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.92)", lineHeight: 1.8, fontSize: "1.05rem" }}>To be a centre of academic excellence nurturing confident, compassionate learners who positively transform their communities and the nation.</Typography>
            </Box>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp}>
            <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: "rgba(255,255,255,0.08)", borderLeft: `4px solid ${KAB.green}` }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: KAB.green }}>Our Mission</Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.92)", lineHeight: 1.8, fontSize: "1.05rem" }}>To provide holistic, quality education through innovative teaching, strong moral values, and a supportive environment that develops each learner's intellectual, spiritual, and physical potential.</Typography>
            </Box>
          </motion.div>
        </Box>
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp}>
          <Box sx={{ mt: 5, textAlign: "center", py: 3, px: { xs: 2, md: 4 }, bgcolor: "rgba(0,0,0,0.2)" }}>
            <Typography variant="h4" sx={{ fontWeight: 700, fontStyle: "italic", color: KAB.gold, mb: 1 }}>"{SCHOOL.motto}"</Typography>
            <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em" }}>{SCHOOL.name} School Motto</Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

/** Partners strip */
function PartnersStrip() {
  const PARTNERS = [{ name: "KNEC" }, { name: "KICD" }, { name: "MOE" }, { name: "KPA" }, { name: "KESSE" }];
  return (
    <Box component="section" sx={{ py: { xs: 5, md: 6 }, bgcolor: KAB.bgMuted, borderTop: `1px solid ${KAB.border}`, borderBottom: `1px solid ${KAB.border}` }}>
      <Container maxWidth="xl">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp}>
          <Typography variant="overline" sx={{ color: KAB.textSecondary, fontWeight: 600, letterSpacing: "0.12em", mb: 3, display: "block", textAlign: "center" }}>Affiliations & Partnerships</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: { xs: 3, md: 5 } }}>
            {PARTNERS.map((partner) => (
              <Box key={partner.name} sx={{ px: 3, py: 2, opacity: 0.75, transition: "opacity 0.25s ease", "&:hover": { opacity: 1 } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: KAB.textPrimary, letterSpacing: "0.04em", textAlign: "center" }}>{partner.name}</Typography>
              </Box>
            ))}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

/** Public homepage following Kabarak University visual language. */
export default function HomePage() {
  return (
    <Box component="main">
      <Hero />
      <HighlightGrid />
      <NewsGrid />
      <NoticeBoard />
      <QuickLinks />
      <StatsBand />
      <MissionBand />
      <PartnersStrip />
    </Box>
  );
}
