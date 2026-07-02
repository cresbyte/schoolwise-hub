"use client";

/**
 * Primrose Private Academy — Home page.
 * @module website/page
 */
import { lazy, Suspense } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GroupsIcon from "@mui/icons-material/Groups";
import ApartmentIcon from "@mui/icons-material/Apartment";
import HotelIcon from "@mui/icons-material/Hotel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import { HeroSection } from "@/components/website/HeroSection";
import { StatsCounter } from "@/components/website/StatsCounter";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { SectionHeading } from "@/components/website/SectionHeading";
import { NewsCard } from "@/components/website/NewsCard";
import { TestimonialCarousel } from "@/components/website/TestimonialCarousel";
import { GalleryGrid } from "@/components/website/GalleryGrid";
import { ImagePlaceholder } from "@/components/website/ImagePlaceholder";
import { HEADING_FONT, WEBSITE_COLORS, WEBSITE_IMAGES, getSchoolInfo } from "@/lib/website/constants";
import {
  getSchoolStats,
  getWhyChooseUs,
  getNewsArticles,
  getUpcomingEvents,
  getTestimonials,
  getGalleryItems,
} from "@/lib/website/data";

const LazyTestimonials = lazy(() => Promise.resolve({ default: TestimonialCarousel }));
const LazyGallery = lazy(() => Promise.resolve({ default: GalleryGrid }));

const ICONS: Record<string, React.ReactNode> = {
  school: <SchoolIcon />,
  groups: <GroupsIcon />,
  apartment: <ApartmentIcon />,
  hotel: <HotelIcon />,
  emoji_events: <EmojiEventsIcon />,
  family_restroom: <FamilyRestroomIcon />,
};

/** Public home page with ten content sections. */
export default function HomePage() {
  const SCHOOL = getSchoolInfo();
  const latestNews = getNewsArticles().slice(0, 3);
  const whyChooseUs = getWhyChooseUs();
  const testimonials = getTestimonials();
  const galleryItems = getGalleryItems();
  const schoolStats = getSchoolStats();
  const upcomingEvents = getUpcomingEvents();

  return (
    <>
      <HeroSection />
      <StatsCounter stats={schoolStats} />

      <SectionWrapper>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1.5fr" },
            gap: 4,
            alignItems: "center",
          }}
        >
          <Card sx={{ overflow: "hidden" }}>
            <ImagePlaceholder
              src={WEBSITE_IMAGES.principal}
              aspectRatio="4/5"
              alt={`${SCHOOL.principal}, Principal of Primrose Private Academy`}
              priority
            />
            <CardContent>
              <Typography sx={{ fontFamily: HEADING_FONT, fontWeight: 700, color: "primary.main" }}>
                {SCHOOL.principal}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Principal
              </Typography>
            </CardContent>
          </Card>
          <Box>
            <SectionHeading title="Welcome to Primrose" align="left" subtitle={SCHOOL.tagline} />
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3, color: "text.secondary" }}>
              For over {new Date().getFullYear() - SCHOOL.founded} years, Primrose Private Academy
              has been a beacon of academic excellence in Nakuru County. We nurture confident,
              compassionate learners prepared for Kenya's evolving educational landscape.
            </Typography>
            <Box
              sx={{
                borderLeft: 4,
                borderColor: "secondary.main",
                pl: 3,
                py: 1,
                bgcolor: WEBSITE_COLORS.bgAlt,
                borderRadius: 1,
              }}
            >
              <Typography variant="body1" sx={{ fontStyle: "italic", lineHeight: 1.7 }}>
                "Every child who walks through our gates carries unique potential. Our duty is to
                unlock it through rigorous academics, strong values, and genuine care."
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                — {SCHOOL.principal}
              </Typography>
            </Box>
          </Box>
        </Box>
      </SectionWrapper>

      <SectionWrapper alt>
        <SectionHeading
          title="Why Choose Primrose?"
          subtitle="Discover what makes our school a trusted choice for families across Nakuru and beyond."
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {whyChooseUs.map((item) => (
            <Card
              key={item.title}
              sx={{
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)" },
              }}
            >
              <CardContent>
                <Avatar sx={{ bgcolor: "primary.main", mb: 2 }}>{ICONS[item.icon]}</Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </SectionWrapper>

      <SectionWrapper>
        <SectionHeading
          title="Academic Programmes"
          subtitle="Dual curriculum pathways designed for Kenyan learners."
        />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
          <Card sx={{ height: "100%" }}>
            <ImagePlaceholder
              src={WEBSITE_IMAGES.classroom}
              aspectRatio="16/9"
              alt="Students in a CBC competency-based learning session"
            />
            <CardContent>
              <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 1 }}>
                CBC (Competency-Based)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                PP1 through Grade 9 with hands-on learning, continuous assessment, and holistic
                development aligned to KICD guidelines.
              </Typography>
              <Button LinkComponent={Link} href="/academics#cbc" variant="outlined">
                Learn More
              </Button>
            </CardContent>
          </Card>
          <Card sx={{ height: "100%" }}>
            <ImagePlaceholder
              src={WEBSITE_IMAGES.library}
              aspectRatio="16/9"
              alt="Students studying in the Primrose school library"
            />
            <CardContent>
              <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 1 }}>
                8-4-4 (KNEC)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Form 1 through Form 4 with rigorous KCSE preparation, science practicals, and career
                guidance for university and beyond.
              </Typography>
              <Button LinkComponent={Link} href="/academics#844" variant="outlined">
                Learn More
              </Button>
            </CardContent>
          </Card>
        </Box>
      </SectionWrapper>

      <SectionWrapper alt>
        <SectionHeading title="Latest News & Events" />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 3 }}>
          <Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: 3,
              }}
            >
              {latestNews.map((article) => (
                <NewsCard key={article.slug} article={article} compact />
              ))}
            </Box>
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Button LinkComponent={Link} href="/news" variant="contained">
                View All News
              </Button>
            </Box>
          </Box>
          <Card sx={{ bgcolor: WEBSITE_COLORS.bgNavy, color: "common.white", height: "fit-content" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: HEADING_FONT, mb: 2, color: "common.white" }}>
                Upcoming Events
              </Typography>
              {upcomingEvents.map((ev) => (
                <Box
                  key={ev.id}
                  sx={{ mb: 2, pb: 2, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: WEBSITE_COLORS.secondary, fontWeight: 700 }}
                  >
                    {ev.date}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "common.white" }}>
                    {ev.title}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, color: "rgba(255,255,255,0.8)" }}>
                    {ev.time} · {ev.location}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>
      </SectionWrapper>

      <Box
        sx={{
          py: { xs: 6, md: 8 },
          background: `linear-gradient(135deg, ${WEBSITE_COLORS.primary}, ${WEBSITE_COLORS.bgNavy})`,
          color: "common.white",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2, color: "common.white" }}>
          Begin Your Primrose Journey
        </Typography>
        <Typography sx={{ mb: 3, opacity: 0.95, maxWidth: 560, mx: "auto", color: "rgba(255,255,255,0.9)" }}>
          Limited spaces available for Term 3, 2026. Apply today and join a community committed to
          excellence.
        </Typography>
        <Button
          LinkComponent={Link}
          href="/admissions/apply"
          variant="contained"
          color="secondary"
          size="large"
          sx={{ mr: 2, mb: { xs: 1, sm: 0 } }}
        >
          Apply Now
        </Button>
        <Button
          LinkComponent={Link}
          href="/admissions"
          variant="outlined"
          size="large"
          sx={{ borderColor: "common.white", color: "common.white" }}
        >
          Admissions Info
        </Button>
      </Box>

      <SectionWrapper>
        <SectionHeading title="What Families Say" />
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          }
        >
          <LazyTestimonials testimonials={testimonials} />
        </Suspense>
      </SectionWrapper>

      <SectionWrapper alt>
        <SectionHeading
          title="Life at Primrose"
          subtitle="A glimpse of our vibrant campus community."
        />
        <Suspense fallback={<CircularProgress />}>
          <LazyGallery items={galleryItems} showFilters={false} limit={8} />
        </Suspense>
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button LinkComponent={Link} href="/gallery" variant="outlined">
            View Full Gallery
          </Button>
        </Box>
      </SectionWrapper>

      <SectionWrapper dark>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2, color: "common.white" }}>
              Visit Us in Nakuru
            </Typography>
            <Typography sx={{ opacity: 0.9, mb: 3, lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }}>
              Located along Milimani Road with panoramic views of the Rift Valley. We welcome
              prospective families for campus tours every Saturday.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <LocationOnIcon sx={{ color: WEBSITE_COLORS.secondary }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                  {SCHOOL.address}, {SCHOOL.county}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <PhoneIcon sx={{ color: WEBSITE_COLORS.secondary }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>{SCHOOL.phone}</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <EmailIcon sx={{ color: WEBSITE_COLORS.secondary }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>{SCHOOL.email}</Typography>
              </Box>
            </Box>
            <Button
              LinkComponent={Link}
              href="/contact"
              variant="contained"
              color="secondary"
              sx={{ mt: 3 }}
            >
              Contact Us
            </Button>
          </Box>
          <Box
            sx={{
              bgcolor: "rgba(255,255,255,0.08)",
              borderRadius: 2,
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <MenuBookIcon sx={{ fontSize: 48, opacity: 0.4, mb: 1 }} />
              <Typography variant="body2" sx={{ opacity: 0.6 }}>
                Map placeholder — Nakuru, Kenya
              </Typography>
            </Box>
          </Box>
        </Box>
      </SectionWrapper>
    </>
  );
}
