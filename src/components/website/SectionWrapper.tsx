/**
 * Alternating background section wrapper for website pages.
 * @module SectionWrapper
 */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import type { ReactNode } from "react";
import { WEBSITE_COLORS } from "@/lib/website/constants";

/** Props for {@link SectionWrapper}. */
export interface SectionWrapperProps {
  children: ReactNode;
  alt?: boolean;
  dark?: boolean;
  id?: string;
  py?: number;
}

/**
 * Full-width section with alternating white/grey backgrounds.
 * @param props - Content, background variant, optional anchor id
 */
export function SectionWrapper({
  children,
  alt = false,
  dark = false,
  id,
  py = 6,
}: SectionWrapperProps) {
  const bgcolor = dark ? WEBSITE_COLORS.bgNavy : alt ? WEBSITE_COLORS.bgAlt : WEBSITE_COLORS.bgWhite;
  const color = dark ? "common.white" : undefined;
  const sectionClass =
    py >= 8 ? "website-section-lg" : py <= 4 ? "website-section-sm" : "website-section";

  return (
    <Box
      id={id}
      component="section"
      className={sectionClass}
      sx={{ bgcolor, color }}
    >
      <Container maxWidth="xl" className="website-container">
        {children}
      </Container>
    </Box>
  );
}
