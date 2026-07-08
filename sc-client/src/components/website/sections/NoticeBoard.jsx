/**
 * Notice board — upcoming events + downloadable resources side by side.
 * @module NoticeBoard
 */
"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DownloadIcon from "@mui/icons-material/Download";
import { SectionHeading } from "@/components/website/SectionHeading";
import { KAB } from "@/theme/websiteTheme";
import { fadeInUp, viewportOnce } from "@/lib/motion";

/** Events + downloads noticeboard section. */
export function NoticeBoard({ events, downloads }) {
  return (
    <Box
      component="section"
      sx={{ bgcolor: KAB.bgMuted, py: { xs: 8, md: 10 } }}
      aria-labelledby="notice-heading"
    >
      <Container maxWidth="xl">
        <SectionHeading
          id="notice-heading"
          overline="Stay Updated"
          title="Notices & Resources"
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
          }}
        >
          {/* Upcoming Events */}
          <Box
            component={motion.div}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
                pb: 1.5,
                borderBottom: `2px solid ${KAB.primary}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: KAB.textPrimary,
                }}
              >
                Upcoming Events
              </Typography>
              <Box
                component={Link}
                href="/news#events"
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: KAB.primary,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                View All →
              </Box>
            </Box>

            {events.map((evt) => {
              const [day, month, year] = evt.date.split(" ");
              return (
                <Box
                  key={evt.id}
                  sx={{
                    display: "flex",
                    gap: 2,
                    mb: 2,
                    p: 2,
                    bgcolor: "#fff",
                    border: `1px solid ${KAB.borderLight}`,
                    borderLeft: `3px solid ${KAB.primary}`,
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
                  }}
                >
                  {/* Date block */}
                  <Box
                    sx={{
                      width: 52,
                      flexShrink: 0,
                      bgcolor: KAB.primary,
                      color: "#fff",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      py: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 800,
                        fontSize: 22,
                        lineHeight: 1,
                      }}
                    >
                      {day}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        opacity: 0.85,
                      }}
                    >
                      {month}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 600,
                        fontSize: 14,
                        color: KAB.textPrimary,
                        mb: 0.5,
                      }}
                    >
                      {evt.title}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 12, color: KAB.textMuted }} />
                        <Typography sx={{ fontSize: 12, color: KAB.textSecondary }}>
                          {evt.time}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <LocationOnIcon sx={{ fontSize: 12, color: KAB.textMuted }} />
                        <Typography sx={{ fontSize: 12, color: KAB.textSecondary }}>
                          {evt.location}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Downloads */}
          <Box
            component={motion.div}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ ...viewportOnce, amount: 0.1 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
                pb: 1.5,
                borderBottom: `2px solid ${KAB.secondary}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: KAB.textPrimary,
                }}
              >
                Downloads
              </Typography>
            </Box>

            {downloads.slice(0, 6).map((item) => (
              <Box
                key={item.id}
                component="a"
                href="#"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 1.75,
                  mb: 1.5,
                  bgcolor: "#fff",
                  border: `1px solid ${KAB.borderLight}`,
                  textDecoration: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    borderColor: KAB.secondary,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: `${KAB.secondary}18`,
                    color: KAB.secondary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      color: KAB.textPrimary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: KAB.textMuted }}>
                    {item.fileType} · {item.size}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
