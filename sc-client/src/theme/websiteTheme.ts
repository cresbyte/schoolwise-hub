/**
 * Website-specific theme tokens.
 * Primrose University-inspired design system for the public website.
 * These tokens supplement the main theme.ts for website-specific styling.
 */

/** Primrose-style color palette for the public website */
export const KAB = {
  // Primary brand — Primrose maroon/dark red
  primary: "#95191c",
  primaryDark: "#7a1215",
  primaryLight: "#b42d31",

  // Secondary — Primrose green
  secondary: "#59ac46",
  secondaryDark: "#428233",
  secondaryLight: "#7bc66a",

  // Accent — Gold/Amber
  gold: "#C8922A",
  goldLight: "#F5B942",
  green: "#59ac46",
  greenLight: "#7bc66a",

  // Dark / footer tones
  dark: "#1a1a1a",
  darkLight: "#2e2e2e",

  // Background
  white: "#FFFFFF",
  bgMuted: "#f9f9f9",
  bgSubtle: "#fdf4f4",

  // Text
  textPrimary: "#222222",
  textSecondary: "#555555",
  textMuted: "#999999",

  // Borders
  border: "#e5e5e5",
  borderLight: "#f2f2f2",
  borderDark: "#cccccc",

  // Semantic states
  success: "#59ac46",
  warning: "#B45309",
  error: "#B91C1C",
  info: "#95191c",
};

/** Website-specific typography options */
export const WEBSITE_TYPOGRAPHY = {
  fontFamily: {
    heading: "'Poppins', system-ui, -apple-system, sans-serif",
    body: "'Poppins', system-ui, -apple-system, sans-serif",
  },
  headingStyles: {
    hero: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
    },
    section: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 700,
      lineHeight: 1.25,
    },
  },
};

/** Website-specific spacing for sections */
export const WEBSITE_SPACING = {
  sectionY: {
    xs: 5,
    md: 8,
  },
  containerMax: "xl",
};
