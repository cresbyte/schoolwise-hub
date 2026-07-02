/**
 * Public-website MUI theme — Kabarak University visual language.
 * Scoped to the public site only (applied in WebsiteLayout) so the admin
 * dashboard theme stays untouched. Extracted from kabarak.ac.ke computed CSS:
 *   primary maroon  #95191c   (header accents, links, active nav)
 *   accent green     #59ac46   (hover/active underline, highlights)
 *   gold             #cb9e4f   (subtle secondary accents)
 *   dark neutral     #343a40   (footer + dark bands)
 *   body text        #444444
 *   muted background #eef1f4
 *   font             Poppins
 *
 * Hard rule: borderRadius 0 everywhere.
 * @module websiteTheme
 */
import { createTheme } from "@mui/material/styles";

/** Raw Kabarak-derived design tokens for the public website. */
export const KAB = {
  primary: "#95191c",
  primaryDark: "#6b1214",
  primaryLight: "#b3252a",
  green: "#59ac46",
  greenDark: "#4a9139",
  greenLight: "#62ae50",
  gold: "#cb9e4f",
  goldDark: "#b3893f",
  dark: "#343a40",
  darker: "#23272b",
  textPrimary: "#343a40",
  textSecondary: "#666f78",
  bodyText: "#444444",
  white: "#ffffff",
  bgMuted: "#eef1f4",
  border: "#e2e6ea",
  borderDark: "rgba(255,255,255,0.14)",
} as const;

const FONT = "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Kabarak-styled theme for the public website (borderRadius 0 globally). */
export const websiteTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: KAB.primary,
      dark: KAB.primaryDark,
      light: KAB.primaryLight,
      contrastText: KAB.white,
    },
    secondary: {
      main: KAB.green,
      dark: KAB.greenDark,
      light: KAB.greenLight,
      contrastText: KAB.white,
    },
    success: { main: KAB.green, contrastText: KAB.white },
    warning: { main: KAB.gold, contrastText: KAB.white },
    error: { main: "#c0392b" },
    info: { main: KAB.primary },
    background: { default: KAB.white, paper: KAB.white },
    text: { primary: KAB.textPrimary, secondary: KAB.textSecondary },
    divider: KAB.border,
  },

  shape: { borderRadius: 0 },
  spacing: 8,

  typography: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: "clamp(2rem, 5vw, 3.25rem)",
      lineHeight: 1.15,
      letterSpacing: "-0.01em",
      color: KAB.textPrimary,
    },
    h2: {
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: "clamp(1.6rem, 3.6vw, 2.4rem)",
      lineHeight: 1.2,
      letterSpacing: "-0.01em",
      color: KAB.textPrimary,
    },
    h3: {
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)",
      lineHeight: 1.25,
      color: KAB.textPrimary,
    },
    h4: {
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: "clamp(1.2rem, 2vw, 1.5rem)",
      lineHeight: 1.3,
      color: KAB.textPrimary,
    },
    h5: { fontFamily: FONT, fontWeight: 600, fontSize: "1.25rem", color: KAB.textPrimary },
    h6: { fontFamily: FONT, fontWeight: 600, fontSize: "1.05rem", color: KAB.textPrimary },
    subtitle1: { fontFamily: FONT, fontWeight: 500 },
    subtitle2: { fontFamily: FONT, fontWeight: 600 },
    body1: { fontFamily: FONT, fontWeight: 400, fontSize: "0.95rem", lineHeight: 1.7, color: KAB.bodyText },
    body2: { fontFamily: FONT, fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.65, color: KAB.bodyText },
    caption: { fontFamily: FONT, fontSize: "0.75rem" },
    overline: {
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: "0.72rem",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    },
    button: {
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: "0.82rem",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "a:focus-visible, button:focus-visible, [tabindex]:focus-visible": {
          outline: `2px solid ${KAB.green}`,
          outlineOffset: "2px",
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*": { animationDuration: "0.001ms !important", transitionDuration: "0.001ms !important" },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 0, padding: "10px 22px" },
      },
    },
    MuiPaper: { styleOverrides: { root: { borderRadius: 0, backgroundImage: "none" } } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `1px solid ${KAB.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
        },
      },
    },
    MuiTextField: {
      styleOverrides: { root: { "& .MuiOutlinedInput-root": { borderRadius: 0 } } },
    },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 0 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 0, fontWeight: 600 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 0 } } },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 0 } } },
    MuiPopover: { styleOverrides: { paper: { borderRadius: 0 } } },
    MuiAvatar: { styleOverrides: { root: { borderRadius: 0 } } },
    MuiSkeleton: { defaultProps: { variant: "rectangular" }, styleOverrides: { root: { borderRadius: 0 } } },
    MuiAppBar: { styleOverrides: { root: { borderRadius: 0 } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 0 } } },
    MuiCardActionArea: { styleOverrides: { root: { borderRadius: 0 } } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 0 } } },
    MuiAccordion: { styleOverrides: { root: { borderRadius: 0, "&:before": { display: "none" } } } },
    MuiLink: {
      defaultProps: { underline: "none" },
      styleOverrides: { root: { color: KAB.primary, fontWeight: 500 } },
    },
  },
});

export default websiteTheme;