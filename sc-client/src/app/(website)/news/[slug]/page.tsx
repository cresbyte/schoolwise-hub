"use client";

/**
 * Individual news article detail page.
 * @module website/news/[slug]/page
 */
import { notFound, useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { NewsCard } from "@/components/website/NewsCard";
import { ImagePlaceholder } from "@/components/website/ImagePlaceholder";
import { getNewsArticles } from "@/lib/website/data";

/** Single news article with related posts. */
export default function NewsArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const articles = getNewsArticles();
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const related = articles.filter(
    (a) => a.slug !== article.slug && a.category === article.category,
  ).slice(0, 3);

  return (
    <>
      <PageBanner
        title={article.title}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "News", href: "/news" },
          { label: article.title },
        ]}
      />
      <SectionWrapper>
        <Box sx={{ maxWidth: 800, mx: "auto" }}>
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Chip label={article.category} color="primary" size="small" />
            <Typography variant="body2" color="text.secondary">
              {article.date} · {article.readMinutes} min read · {article.author}
            </Typography>
          </Box>
          <ImagePlaceholder src={article.image} aspectRatio="16/9" alt={article.title} />
          <Typography
            variant="body1"
            sx={{ mt: 3, lineHeight: 1.9, color: "text.secondary", whiteSpace: "pre-line" }}
          >
            {article.content}
          </Typography>
        </Box>
        {related.length > 0 && (
          <>
            <Divider sx={{ my: 5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
              Related Articles
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 3,
              }}
            >
              {related.map((a) => (
                <NewsCard key={a.slug} article={a} compact />
              ))}
            </Box>
          </>
        )}
      </SectionWrapper>
    </>
  );
}
