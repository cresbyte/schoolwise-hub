/**
 * Why Choose Us / Highlights grid — card grid with icon, title, and description.
 * @module HighlightGrid
 */
"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/website/SectionHeading";
import { KAB } from "@/theme/websiteTheme";
import { staggerContainer, staggerItem, viewportOnce } from "@/lib/motion";

// Map icon names to Material Symbols / emoji fallbacks
const ICON_MAP = {
  school: "🎓",
  groups: "👩‍🏫",
  apartment: "🏫",
  hotel: "🛏️",
  emoji_events: "🏆",
  family_restroom: "👨‍👩‍👧",
};

/** Staggered card grid highlighting what makes the school unique. */
export function HighlightGrid({ items }) {
  return (
    <Box
      component="section"
      sx={{ bgcolor: KAB.bgMuted, py: { xs: 8, md: 10 } }}
      aria-labelledby="highlights-heading"
    >
      <Container maxWidth="xl">
        <SectionHeading
          id="highlights-heading"
          overline="Our Strengths"
          title="Why Choose Primrose?"
          subtitle="We offer a holistic education that develops every learner's potential."
        />

        <Box
          component={motion.div}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {items.map((item, idx) => (
            <Box
              key={item.title}
              component={motion.div}
              variants={staggerItem}
              sx={{
                bgcolor: "#fff",
                p: 3.5,
                border: `1px solid ${KAB.borderLight}`,
                borderTop: `3px solid ${idx % 2 === 0 ? KAB.primary : KAB.secondary}`,
                transition: "box-shadow 0.25s, transform 0.25s",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  transform: "translateY(-4px)",
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: idx % 2 === 0 ? `${KAB.primary}14` : `${KAB.secondary}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  mb: 2,
                }}
              >
                {ICON_MAP[item.icon] ?? "✦"}
              </Box>
              <Typography
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: KAB.textPrimary,
                  mb: 1,
                }}
              >
                {item.title}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  color: KAB.textSecondary,
                  lineHeight: 1.7,
                }}
              >
                {item.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
