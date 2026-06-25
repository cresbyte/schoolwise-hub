/**
 * Inner page hero banner with title and breadcrumbs area.
 * @module PageBanner
 */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import NextLink from "next/link";
import { WEBSITE_COLORS } from "@/lib/website/constants";

/** Props for {@link PageBanner}. */
export interface PageBannerProps {
  title: string;
  subtitle?: string;
  gradient?: string;
  crumbs?: { label: string; href?: string }[];
}

/**
 * Full-width banner for interior website pages.
 * @param props - Title, optional subtitle, gradient, and breadcrumb trail
 */
export function PageBanner({
  title,
  subtitle,
  gradient = `linear-gradient(135deg, ${WEBSITE_COLORS.primary} 0%, ${WEBSITE_COLORS.bgNavy} 100%)`,
  crumbs,
}: PageBannerProps) {
  return (
    <Box
      sx={{
        background: gradient,
        color: "common.white",
        py: { xs: 5, md: 7 },
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.06)",
        },
      }}
    >
      <Container maxWidth="xl">
        {crumbs && crumbs.length > 0 && (
          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{ mb: 2, "& .MuiBreadcrumbs-separator": { color: "rgba(255,255,255,0.6)" } }}
          >
            {crumbs.map((c, i) =>
              c.href ? (
                <Box
                  key={i}
                  component={NextLink}
                  href={c.href}
                  sx={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 14,
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {c.label}
                </Box>
              ) : (
                <Typography key={i} sx={{ color: "common.white", fontSize: 14 }}>
                  {c.label}
                </Typography>
              ),
            )}
          </Breadcrumbs>
        )}
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 700, mb: subtitle ? 1 : 0, color: "common.white" }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="h6"
            sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 640, color: "rgba(255,255,255,0.95)" }}
          >
            {subtitle}
          </Typography>
        )}
      </Container>
    </Box>
  );
}
