/**
 * News grid section — one large feature article + secondary news cards.
 * @module NewsGrid
 */
"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import Link from "next/link";
import { SectionHeading } from "@/components/website/SectionHeading";
import { ImagePlaceholder } from "@/components/website/ImagePlaceholder";
import type { NewsArticle } from "@/lib/website/data";
import { KAB } from "@/theme/websiteTheme";
import { fadeInUp, staggerContainer, staggerItem, viewportOnce } from "@/lib/motion";

const CATEGORY_COLORS: Record<string, string> = {
  News: KAB.primary,
  Events: KAB.secondary,
  Achievements: "#C8922A",
  Announcements: "#555",
};

function CategoryBadge({ category }: { category: string }) {
  return (
    <Box
      sx={{
        display: "inline-block",
        bgcolor: CATEGORY_COLORS[category] ?? KAB.primary,
        color: "#fff",
        fontSize: 10,
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        px: 1.25,
        py: "3px",
      }}
    >
      {category}
    </Box>
  );
}

interface NewsGridProps {
  articles: NewsArticle[];
  /** Number of articles to display (default 6) */
  limit?: number;
}

/** News + events section with featured article and staggered secondary cards. */
export function NewsGrid({ articles, limit = 6 }: NewsGridProps) {
  const displayed = articles.slice(0, limit);
  const [featured, ...rest] = displayed;

  return (
    <Box
      component="section"
      sx={{ bgcolor: "#fff", py: { xs: 8, md: 10 } }}
      aria-labelledby="news-heading"
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 5,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <SectionHeading
            id="news-heading"
            overline="Latest Updates"
            title="News & Events"
            align="left"
          />
          <Box
            component={Link}
            href="/news"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: KAB.primary,
              textDecoration: "none",
              borderBottom: `1px solid ${KAB.primary}`,
              pb: "2px",
              "&:hover": { color: KAB.primaryDark },
            }}
          >
            View All News →
          </Box>
        </Box>

        <Grid container spacing={3} alignItems="flex-start">
          {/* Featured article */}
          {featured && (
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                component={motion.div}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                <Link href={`/news/${featured.slug}`} style={{ textDecoration: "none" }}>
                  <Box sx={{ overflow: "hidden", "&:hover img": { transform: "scale(1.04)" } }}>
                    <ImagePlaceholder
                      src={featured.image}
                      alt={featured.title}
                      aspectRatio="16/9"
                    />
                  </Box>
                  <Box
                    sx={{
                      p: 0,
                      pt: 2.5,
                      borderTop: `3px solid ${KAB.primary}`,
                      mt: 0,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                      <CategoryBadge category={featured.category} />
                      <Typography
                        sx={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: 12,
                          color: KAB.textMuted,
                        }}
                      >
                        {featured.date} · {featured.readMinutes} min read
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 700,
                        fontSize: { xs: 18, md: 22 },
                        color: KAB.textPrimary,
                        lineHeight: 1.35,
                        mb: 1.5,
                        "&:hover": { color: KAB.primary },
                        transition: "color 0.2s",
                      }}
                    >
                      {featured.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 14,
                        color: KAB.textSecondary,
                        lineHeight: 1.7,
                      }}
                    >
                      {featured.excerpt}
                    </Typography>
                  </Box>
                </Link>
              </Box>
            </Grid>
          )}

          {/* Secondary cards column */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              component={motion.div}
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              sx={{ display: "flex", flexDirection: "column", gap: 0 }}
            >
              {rest.slice(0, 4).map((article) => (
                <Box key={article.slug} component={motion.div} variants={staggerItem}>
                  <Link href={`/news/${article.slug}`} style={{ textDecoration: "none" }}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        py: 2,
                        borderBottom: `1px solid ${KAB.borderLight}`,
                        transition: "background 0.15s",
                        "&:hover": { bgcolor: KAB.bgMuted },
                        px: 1.5,
                      }}
                    >
                      <Box sx={{ width: 80, flexShrink: 0 }}>
                        <ImagePlaceholder src={article.image} alt={article.title} height={64} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <CategoryBadge category={article.category} />
                        </Box>
                        <Typography
                          sx={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 600,
                            fontSize: 13,
                            color: KAB.textPrimary,
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {article.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: 11,
                            color: KAB.textMuted,
                            mt: 0.5,
                          }}
                        >
                          {article.date}
                        </Typography>
                      </Box>
                    </Box>
                  </Link>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
