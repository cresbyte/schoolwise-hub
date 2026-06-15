/**
 * Auto-playing hero carousel for the home page.
 * @module HeroSection
 */
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Link from "next/link";
import { HERO_SLIDES } from "@/lib/website/data";

const INTERVAL_MS = 5000;

/**
 * Full-viewport hero carousel with three slides and auto-play.
 */
export function HeroSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ position: "relative", minHeight: { xs: 420, md: 560 }, overflow: "hidden" }}>
      {HERO_SLIDES.map((s, i) => (
        <Box
          key={s.id}
          sx={{
            position: "absolute",
            inset: 0,
            opacity: i === index ? 1 : 0,
            transition: "opacity 0.8s ease",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box
            component="img"
            src={s.image}
            alt={s.imageAlt}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.45)",
            }}
          />
          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                color: "common.white",
                mb: 2,
                fontSize: { xs: "2rem", md: "3rem" },
                maxWidth: 720,
              }}
            >
              {s.title}
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "rgba(255,255,255,0.9)", mb: 4, maxWidth: 560, fontWeight: 400 }}
            >
              {s.subtitle}
            </Typography>
            <Button
              LinkComponent={Link}
              href={s.cta.href}
              variant="contained"
              size="large"
              sx={{
                bgcolor: "common.white",
                color: "primary.main",
                fontWeight: 700,
                px: 4,
                "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
              }}
            >
              {s.cta.label}
            </Button>
          </Container>
        </Box>
      ))}

      <IconButton
        aria-label="Previous slide"
        onClick={() => setIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
        sx={{
          position: "absolute",
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          color: "common.white",
          bgcolor: "rgba(0,0,0,0.25)",
          zIndex: 1,
        }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        aria-label="Next slide"
        onClick={() => setIndex((i) => (i + 1) % HERO_SLIDES.length)}
        sx={{
          position: "absolute",
          right: 16,
          top: "50%",
          transform: "translateY(-50%)",
          color: "common.white",
          bgcolor: "rgba(0,0,0,0.25)",
          zIndex: 1,
        }}
      >
        <ChevronRightIcon />
      </IconButton>

      <Box
        sx={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 1,
          zIndex: 1,
        }}
      >
        {HERO_SLIDES.map((_, i) => (
          <Box
            key={i}
            onClick={() => setIndex(i)}
            sx={{
              width: i === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              bgcolor: i === index ? "common.white" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
