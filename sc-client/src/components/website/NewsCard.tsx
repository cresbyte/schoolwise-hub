/**
 * News article preview card for listings.
 * @module NewsCard
 */
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Link from "next/link";
import { ImagePlaceholder } from "./ImagePlaceholder";
import type { NewsArticle } from "@/lib/website/data";

/** Props for {@link NewsCard}. */
export interface NewsCardProps {
  article: NewsArticle;
  compact?: boolean;
}

/**
 * Card linking to a news article detail page.
 * @param props - Article data and optional compact layout
 */
export function NewsCard({ article, compact = false }: NewsCardProps) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardActionArea
        LinkComponent={Link}
        href={`/news/${article.slug}`}
        sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <ImagePlaceholder
          src={article.image}
          aspectRatio={compact ? "16/10" : "16/9"}
          alt={article.title}
        />
        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
            <Chip label={article.category} size="small" color="primary" sx={{ fontSize: 11 }} />
            <Typography variant="caption" color="text.secondary">
              {article.date}
            </Typography>
          </Box>
          <Typography
            variant={compact ? "subtitle1" : "h6"}
            sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}
          >
            {article.title}
          </Typography>
          {!compact && (
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {article.excerpt}
            </Typography>
          )}
          <Typography variant="caption" color="primary" sx={{ mt: 1.5, fontWeight: 600 }}>
            Read more →
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
