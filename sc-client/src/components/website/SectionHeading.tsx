/**
 * Reusable section heading for website pages.
 * @module SectionHeading
 */
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { TOKENS } from "@/theme/theme";

/** Props for {@link SectionHeading}. */
export interface SectionHeadingProps {
  id?: string;
  overline?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

/**
 * Styled section title with optional overline, gold rule, and subtitle.
 * @param props - Overline, title, optional subtitle, alignment
 */
export function SectionHeading({ id, overline, title, subtitle, align = "center" }: SectionHeadingProps) {
  const isCenter = align === "center";

  return (
    <Box sx={{ textAlign: align, mb: 7 }}>
      {overline && (
        <Typography
          component="span"
          variant="overline"
          sx={{
            display: "block",
            color: "secondary.main",
            fontWeight: 700,
            letterSpacing: "0.12em",
            mb: 1.5,
          }}
        >
          {overline}
        </Typography>
      )}
      <Typography variant="h2" component="h2" id={id} sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box
        sx={{
          width: 56,
          height: 3,
          background: `linear-gradient(90deg, ${TOKENS.color.secondary}, ${TOKENS.color.secondaryLight})`,
          borderRadius: 0,
          mx: isCenter ? "auto" : 0,
          mb: subtitle ? 2 : 0,
        }}
      />
      {subtitle && (
        <Typography
          variant="body1"
          color="text.primary"
          sx={{ maxWidth: 600, mx: isCenter ? "auto" : 0, fontWeight: 500, opacity: 0.85 }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
