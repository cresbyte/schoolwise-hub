/**
 * Mission band — centered vision/mission statement with decorative accent.
 * @module MissionBand
 */
"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/website/ImagePlaceholder";
import { KAB } from "@/theme/websiteTheme";
import { fadeInUp, slideInLeft, slideInRight, viewportOnce } from "@/lib/motion";

interface MissionBandProps {
  image: string;
}

/** Split vision/mission section with image and text. */
export function MissionBand({ image }: MissionBandProps) {
  return (
    <Box
      component="section"
      sx={{ py: { xs: 8, md: 10 }, bgcolor: "#fff" }}
      aria-label="Vision and mission"
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
          {/* Image side */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              component={motion.div}
              variants={slideInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              sx={{ position: "relative" }}
            >
              <ImagePlaceholder src={image} alt="Principal's message" aspectRatio="3/4" />
              {/* Accent corner box */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: -12,
                  right: -12,
                  width: 80,
                  height: 80,
                  bgcolor: KAB.secondary,
                  zIndex: -1,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: -12,
                  left: -12,
                  width: 80,
                  height: 80,
                  border: `4px solid ${KAB.primary}`,
                  zIndex: -1,
                }}
              />
            </Box>
          </Grid>

          {/* Text side */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box
              component={motion.div}
              variants={slideInRight}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Box sx={{ width: 32, height: 2, bgcolor: KAB.primary }} />
                <Typography
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: KAB.primary,
                  }}
                >
                  Principal's Message
                </Typography>
              </Box>

              <Typography
                component="h2"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 800,
                  fontSize: { xs: "1.5rem", md: "2rem" },
                  color: KAB.textPrimary,
                  lineHeight: 1.25,
                  mb: 3,
                }}
              >
                Excellence Through{" "}
                <Box component="span" sx={{ color: KAB.primary }}>
                  Knowledge
                </Box>
              </Typography>

              <Typography
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 14,
                  color: KAB.textSecondary,
                  lineHeight: 1.85,
                  mb: 2.5,
                }}
              >
                At Primrose Private Academy, we are committed to providing a world-class education
                that prepares every learner for the demands of the 21st century. Our dual CBC and
                8-4-4 curriculum ensures seamless progression from Early Childhood to Senior
                Secondary.
              </Typography>

              <Typography
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 14,
                  color: KAB.textSecondary,
                  lineHeight: 1.85,
                  mb: 3.5,
                }}
              >
                We nurture intellectual curiosity, moral integrity, and leadership qualities —
                ensuring every student leaves Primrose ready to make a meaningful contribution to
                society.
              </Typography>

              {/* Mission / Vision callouts */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  {
                    label: "Our Mission",
                    text: "To provide holistic education that develops character, competence, and compassion.",
                  },
                  {
                    label: "Our Vision",
                    text: "To be the premier institution shaping responsible, innovative leaders in Kenya.",
                  },
                ].map((item) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                    <Box
                      sx={{
                        p: 2,
                        borderLeft: `3px solid ${KAB.secondary}`,
                        bgcolor: KAB.bgMuted,
                        height: "100%",
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 700,
                          fontSize: 12,
                          color: KAB.primary,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          mb: 0.75,
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: 12,
                          color: KAB.textSecondary,
                          lineHeight: 1.6,
                        }}
                      >
                        {item.text}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Box
                component={Link}
                href="/about"
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
                  transition: "background 0.2s, transform 0.2s",
                  "&:hover": { bgcolor: KAB.primaryDark, transform: "translateY(-2px)" },
                }}
              >
                Learn More About Us
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
