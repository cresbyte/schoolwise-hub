/**
 * Homepage hero section — full-bleed image slider with Kabarak-style overlays.
 * @module Hero
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import {Box, Container, Typography,  } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { HeroSlide } from "@/lib/website/data";
import { KAB } from "@/theme/websiteTheme";

interface HeroProps {
  slides: HeroSlide[];
}

/** Full-bleed hero carousel with fade cross-dissolve transitions. */
export function Hero({ slides }: HeroProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  const slide = slides[current];

  return (
    <Box
      sx={{
        position: "relative",
        height: { xs: "68vh", md: "80vh" },
        minHeight: { xs: 420, md: 560 },
        overflow: "hidden",
        bgcolor: "#111",
      }}
    >
      {/* Background image with cross-dissolve */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </AnimatePresence>

      {/* Dark gradient overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.1) 100%)",
        }}
      />

      {/* Left accent bar */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          bgcolor: KAB.primary,
        }}
      />

      {/* Text content */}
      <Container maxWidth="xl" sx={{ height: "100%", position: "relative", zIndex: 2 }}>
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: { xs: "100%", md: "56%" },
            pl: { xs: 2, md: 0 },
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${slide.id}`}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Category label */}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Box sx={{ width: 24, height: 2, bgcolor: KAB.secondary }} />
                <Typography
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: KAB.secondaryLight,
                  }}
                >
                  Primrose Private Academy
                </Typography>
              </Box>

              <Typography
                component="h1"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 800,
                  fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3.25rem" },
                  color: "#fff",
                  lineHeight: 1.12,
                  mb: 2,
                  textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
              >
                {slide.title}
              </Typography>

              <Typography
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: { xs: "0.95rem", md: "1.1rem" },
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.65,
                  mb: 4,
                  maxWidth: 480,
                }}
              >
                {slide.subtitle}
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box
                  component={Link}
                  href={slide.cta.href}
                  sx={{
                    display: "inline-block",
                    bgcolor: KAB.primary,
                    color: "#fff",
                    px: 3.5,
                    py: 1.5,
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                    letterSpacing: "0.03em",
                    transition: "background 0.2s, transform 0.2s",
                    "&:hover": { bgcolor: KAB.primaryDark, transform: "translateY(-2px)" },
                  }}
                >
                  {slide.cta.label}
                </Box>
                <Box
                  component={Link}
                  href="/about"
                  sx={{
                    display: "inline-block",
                    border: "2px solid rgba(255,255,255,0.7)",
                    color: "#fff",
                    px: 3.5,
                    py: 1.5,
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                    transition: "border-color 0.2s, background 0.2s",
                    "&:hover": {
                      borderColor: "#fff",
                      bgcolor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  Learn More
                </Box>
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Container>

      {/* Slide indicator strip */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          zIndex: 3,
        }}
      >
        {slides.map((s, i) => (
          <Box
            key={s.id}
            onClick={() => setCurrent(i)}
            sx={{
              flex: 1,
              height: 4,
              bgcolor: i === current ? KAB.primary : "rgba(255,255,255,0.25)",
              cursor: "pointer",
              transition: "background 0.3s",
              "&:hover": { bgcolor: i === current ? KAB.primary : "rgba(255,255,255,0.5)" },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
