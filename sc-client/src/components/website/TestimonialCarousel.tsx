/**
 * Testimonial carousel for social proof sections.
 * @module TestimonialCarousel
 */
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { HEADING_FONT } from "@/lib/website/constants";
import type { Testimonial } from "@/lib/website/data";

/** Props for {@link TestimonialCarousel}. */
export interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

/**
 * Auto-advancing testimonial slider with manual controls.
 * @param props - Array of testimonial items
 */
export function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const t = testimonials[index];

  return (
    <Box sx={{ position: "relative", maxWidth: 800, mx: "auto" }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}>
          <FormatQuoteIcon sx={{ fontSize: 48, color: "secondary.main", opacity: 0.5, mb: 2 }} />
          <Typography
            variant="h6"
            sx={{ fontStyle: "italic", mb: 3, lineHeight: 1.7, color: "text.primary" }}
          >
            "{t.quote}"
          </Typography>
          <Avatar sx={{ width: 56, height: 56, mx: "auto", mb: 1, background: t.gradient }} />
          <Typography sx={{ fontFamily: HEADING_FONT, fontWeight: 700 }}>{t.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t.role}
          </Typography>
        </CardContent>
      </Card>

      <IconButton
        aria-label="Previous testimonial"
        onClick={() => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
        sx={{
          position: "absolute",
          left: { xs: -8, md: -56 },
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        aria-label="Next testimonial"
        onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
        sx={{
          position: "absolute",
          right: { xs: -8, md: -56 },
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}
