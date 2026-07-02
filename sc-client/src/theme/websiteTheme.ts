/**
 * Website-specific theme tokens.
 * Kabarak University-inspired design system for the public website.
 * These tokens supplement the main theme.ts for website-specific styling.
 */

/** Kabarak-style color palette for website */
export const KAB = {
  // Primary brand colors
  primary: "#1A3A6B",
  primaryDark: "#0F2347",
  primaryLight: "#2A52A0",

  // Accent colors
  secondary: "#C8922A",
  secondaryDark: "#A87520",
  secondaryLight: "#F5B942",

  // Semantic accent colors
  green: "#1E6E3A",
  greenLight: "#2A8A4E",
  gold: "#C8922A",
  goldLight: "#F5B942",

  // Dark theme colors
  dark: "#1C2B3A",
  darkLight: "#2D3F52",

  // Background colors
  white: "#FFFFFF",
  bgMuted: "#F5F7FA",
  bgSubtle: "#EEF2FA",

  // Text colors
  textPrimary: "#0F1923",
  textSecondary: "#546E8A",
  textMuted: "#9AB0C8",

  // Border colors
  border: "#C8D7E5",
  borderLight: "#E4EDF5",
  borderDark: "#3A4F66",

  // Status colors
  success: "#1E6E3A",
  warning: "#B45309",
  error: "#B91C1C",
  info: "#1A3A6B",
};

/** Website-specific typography options */
export const WEBSITE_TYPOGRAPHY = {
  fontFamily: {
    heading: "'Merriweather', Georgia, serif",
    body: "'Outfit', system-ui, -apple-system, sans-serif",
  },
  headingStyles: {
    hero: {
      fontFamily: "'Merriweather', Georgia, serif",
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
    },
    section: {
      fontFamily: "'Merriweather', Georgia, serif",
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
