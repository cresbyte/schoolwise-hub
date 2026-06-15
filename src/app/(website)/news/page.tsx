"use client";

/**
 * News listing page with pagination and sidebar.
 * @module website/news/page
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Pagination from "@mui/material/Pagination";
import Chip from "@mui/material/Chip";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { NewsCard } from "@/components/website/NewsCard";
import { HEADING_FONT } from "@/lib/website/constants";
import { NEWS_ARTICLES, UPCOMING_EVENTS } from "@/lib/website/data";

const PER_PAGE = 6;

/** News listing with pagination content. */
export default function NewsPage() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(NEWS_ARTICLES.length / PER_PAGE);
  const articles = NEWS_ARTICLES.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <PageBanner
        title="News & Events"
        subtitle="Stay connected with Greenfield"
        crumbs={[{ label: "Home", href: "/" }, { label: "News" }]}
      />
      <SectionWrapper>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: 4 }}>
          <Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 3,
                mb: 3,
              }}
            >
              {articles.map((a: any) => (
                <NewsCard key={a.slug} article={a} />
              ))}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => {
                  setPage(v);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                color="primary"
              />
            </Box>
          </Box>
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2 }}>
                  Categories
                </Typography>
                {(["News", "Events", "Achievements", "Announcements"] as const).map((cat) => (
                  <Chip key={cat} label={cat} sx={{ mr: 1, mb: 1 }} variant="outlined" />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2 }}>
                  Upcoming Events
                </Typography>
                {UPCOMING_EVENTS.map((ev) => (
                  <Box key={ev.id} sx={{ mb: 2 }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                      {ev.date}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {ev.title}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </SectionWrapper>
    </>
  );
}
