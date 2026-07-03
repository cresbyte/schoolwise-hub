/**
 * ShuleSmart central MUI theme.
 * ALL design decisions live here. Edit this file to retheme the
 * entire application — zero inline styles required elsewhere.
 */
import { createTheme } from "@mui/material/styles";

// ─── DESIGN TOKENS ────────────────────────────────────────────────

const TOKENS = {
  // Brand colours — inspired by Kabarak's deep navy/maroon + green + gold palette
  color: {
    primary: "#95191c",
    primaryDark: "#7a1215",
    primaryLight: "#b42d31",
    primarySubtle: "#fdf4f4",

    secondary: "#59ac46",
    secondaryDark: "#428233",
    secondaryLight: "#7bc66a",
    secondarySubtle: "#f5faf3",

    accent: "#C8922A",
    accentSubtle: "#fef7e9",

    neutral900: "#222222",
    neutral800: "#333333",
    neutral700: "#444444",
    neutral600: "#555555",
    neutral500: "#666666",
    neutral400: "#999999",
    neutral300: "#cccccc",
    neutral200: "#e5e5e5",
    neutral100: "#f2f2f2",
    neutral50: "#fafafa",

    success: "#59ac46",
    successSubtle: "#f5faf3",
    warning: "#B45309",
    warningSubtle: "#FEF3C7",
    error: "#B91C1C",
    errorSubtle: "#FEE2E2",
    info: "#95191c",
    infoSubtle: "#fdf4f4",

    white: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceAlt: "#fafafa",
    border: "#e5e5e5",
    borderLight: "#f2f2f2",
  },

  font: {
    family: {
      body: "'Poppins', 'Outfit', system-ui, -apple-system, sans-serif",
      heading: "'Poppins', 'Merriweather', Georgia, serif",
    },
    weight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    size: {
      xs: "0.75rem",
      sm: "0.8125rem",
      base: "0.875rem",
      md: "0.9375rem",
      lg: "1rem",
      xl: "1.125rem",
      "2xl": "1.25rem",
      "3xl": "1.5rem",
      "4xl": "1.875rem",
      "5xl": "2.25rem",
      "6xl": "3rem",
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 1.875,
    },
    letterSpacing: {
      tight: "-0.025em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em",
    },
  },

  space: {
    px: "1px",
    0.5: "4px",
    1: "8px",
    1.5: "12px",
    2: "16px",
    2.5: "20px",
    3: "24px",
    4: "32px",
    5: "40px",
    6: "48px",
    7: "56px",
    8: "64px",
    10: "80px",
    12: "96px",
    16: "128px",
  },

  radius: {
    none: "0px",
    sm: "0px",
    base: "0px",
    md: "0px",
    lg: "0px",
    xl: "0px",
    "2xl": "0px",
    full: "9999px",
  },

  shadow: {
    none: "none",
    xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
    sm: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
    base: "0 2px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)",
    md: "0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -2px rgba(0,0,0,0.07)",
    lg: "0 8px 24px -4px rgba(0,0,0,0.14), 0 4px 8px -4px rgba(0,0,0,0.08)",
    xl: "0 16px 40px -8px rgba(0,0,0,0.18), 0 8px 16px -8px rgba(0,0,0,0.10)",
    "2xl": "0 24px 64px -12px rgba(0,0,0,0.22)",
    inner: "inset 0 2px 4px 0 rgba(0,0,0,0.08)",
    primaryGlow: "none",
    goldGlow: "none",
  },

  transition: {
    fast: "all 0.15s ease",
    base: "all 0.2s ease",
    slow: "all 0.3s ease",
    slower: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

// ─── MUI THEME ────────────────────────────────────────────────────

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: TOKENS.color.primary,
      dark: TOKENS.color.primaryDark,
      light: TOKENS.color.primaryLight,
      contrastText: TOKENS.color.white,
    },
    secondary: {
      main: TOKENS.color.secondary,
      dark: TOKENS.color.secondaryDark,
      light: TOKENS.color.secondaryLight,
      contrastText: TOKENS.color.white,
    },
    success: {
      main: TOKENS.color.success,
      light: TOKENS.color.accentSubtle,
      contrastText: TOKENS.color.white,
    },
    warning: {
      main: TOKENS.color.warning,
      light: TOKENS.color.warningSubtle,
    },
    error: {
      main: TOKENS.color.error,
      light: TOKENS.color.errorSubtle,
    },
    info: {
      main: TOKENS.color.info,
      light: TOKENS.color.infoSubtle,
    },
    background: {
      default: TOKENS.color.surfaceAlt,
      paper: TOKENS.color.surface,
    },
    text: {
      primary: TOKENS.color.neutral800,
      secondary: TOKENS.color.neutral600,
      disabled: TOKENS.color.neutral400,
    },
    divider: TOKENS.color.borderLight,
  },

  typography: {
    fontFamily: TOKENS.font.family.body,
    fontSize: 14,
    fontWeightLight: TOKENS.font.weight.light,
    fontWeightRegular: TOKENS.font.weight.regular,
    fontWeightMedium: TOKENS.font.weight.medium,
    fontWeightBold: TOKENS.font.weight.bold,

    h1: {
      fontFamily: TOKENS.font.family.heading,
      fontSize: TOKENS.font.size["5xl"],
      fontWeight: TOKENS.font.weight.bold,
      lineHeight: TOKENS.font.lineHeight.tight,
      letterSpacing: TOKENS.font.letterSpacing.tight,
      color: TOKENS.color.neutral900,
    },
    h2: {
      fontFamily: TOKENS.font.family.heading,
      fontSize: TOKENS.font.size["4xl"],
      fontWeight: TOKENS.font.weight.bold,
      lineHeight: TOKENS.font.lineHeight.snug,
      letterSpacing: TOKENS.font.letterSpacing.tight,
      color: TOKENS.color.neutral900,
    },
    h3: {
      fontFamily: TOKENS.font.family.heading,
      fontSize: TOKENS.font.size["3xl"],
      fontWeight: TOKENS.font.weight.bold,
      lineHeight: TOKENS.font.lineHeight.snug,
      color: TOKENS.color.neutral900,
    },
    h4: {
      fontFamily: TOKENS.font.family.body,
      fontSize: TOKENS.font.size["2xl"],
      fontWeight: TOKENS.font.weight.semibold,
      lineHeight: TOKENS.font.lineHeight.snug,
      color: TOKENS.color.neutral800,
    },
    h5: {
      fontFamily: TOKENS.font.family.body,
      fontSize: TOKENS.font.size.xl,
      fontWeight: TOKENS.font.weight.semibold,
      lineHeight: TOKENS.font.lineHeight.snug,
      color: TOKENS.color.neutral800,
    },
    h6: {
      fontFamily: TOKENS.font.family.body,
      fontSize: TOKENS.font.size.lg,
      fontWeight: TOKENS.font.weight.semibold,
      lineHeight: TOKENS.font.lineHeight.normal,
      color: TOKENS.color.neutral800,
    },
    subtitle1: {
      fontFamily: TOKENS.font.family.body,
      fontSize: TOKENS.font.size.md,
      fontWeight: TOKENS.font.weight.medium,
      lineHeight: TOKENS.font.lineHeight.normal,
    },
    subtitle2: {
      fontFamily: TOKENS.font.family.body,
      fontSize: TOKENS.font.size.base,
      fontWeight: TOKENS.font.weight.medium,
      lineHeight: TOKENS.font.lineHeight.normal,
    },
    body1: {
      fontFamily: TOKENS.font.family.body,
      fontSize: TOKENS.font.size.base,
      fontWeight: TOKENS.font.weight.regular,
      lineHeight: TOKENS.font.lineHeight.relaxed,
      color: TOKENS.color.neutral700,
    },
    body2: {
      fontFamily: TOKENS.font.family.body,
      fontSize: TOKENS.font.size.sm,
      fontWeight: TOKENS.font.weight.regular,
      lineHeight: TOKENS.font.lineHeight.normal,
      color: TOKENS.color.neutral600,
    },
    caption: {
      fontFamily: TOKENS.font.family.body,
      fontSize: TOKENS.font.size.xs,
      fontWeight: TOKENS.font.weight.regular,
      lineHeight: TOKENS.font.lineHeight.normal,
      color: TOKENS.color.neutral500,
      letterSpacing: TOKENS.font.letterSpacing.wide,
    },
    overline: {
      fontFamily: TOKENS.font.family.body,
      fontSize: TOKENS.font.size.xs,
      fontWeight: TOKENS.font.weight.semibold,
      lineHeight: TOKENS.font.lineHeight.normal,
      letterSpacing: TOKENS.font.letterSpacing.widest,
      textTransform: "uppercase" as const,
      color: TOKENS.color.neutral500,
    },
    button: {
      fontFamily: TOKENS.font.family.body,
      fontWeight: TOKENS.font.weight.semibold,
      fontSize: TOKENS.font.size.sm,
      letterSpacing: TOKENS.font.letterSpacing.wide,
      textTransform: "none" as const,
    },
  },

  shape: {
    borderRadius: 0,
  },

  spacing: 8,

  shadows: [
    "none",
    TOKENS.shadow.xs,
    TOKENS.shadow.sm,
    TOKENS.shadow.base,
    TOKENS.shadow.base,
    TOKENS.shadow.md,
    TOKENS.shadow.md,
    TOKENS.shadow.md,
    TOKENS.shadow.md,
    TOKENS.shadow.lg,
    TOKENS.shadow.lg,
    TOKENS.shadow.lg,
    TOKENS.shadow.lg,
    TOKENS.shadow.lg,
    TOKENS.shadow.lg,
    TOKENS.shadow.lg,
    TOKENS.shadow.lg,
    TOKENS.shadow.xl,
    TOKENS.shadow.xl,
    TOKENS.shadow.xl,
    TOKENS.shadow.xl,
    TOKENS.shadow.xl,
    TOKENS.shadow.xl,
    TOKENS.shadow.xl,
    TOKENS.shadow["2xl"],
  ] as const,

  components: {
    MuiCard: {
      defaultProps: { elevation: 2 },
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: TOKENS.shadow.sm,
          border: `1px solid ${TOKENS.color.borderLight}`,
          transition: TOKENS.transition.base,
          "&:hover": {
            boxShadow: TOKENS.shadow.md,
          },
        },
      },
    },

    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: "20px 24px 12px",
        },
        title: {
          fontSize: TOKENS.font.size.lg,
          fontWeight: TOKENS.font.weight.semibold,
          color: TOKENS.color.neutral800,
        },
        subheader: {
          fontSize: TOKENS.font.size.sm,
          color: TOKENS.color.neutral500,
          marginTop: "2px",
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "12px 24px 20px",
          "&:last-child": { paddingBottom: "20px" },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        rounded: {
          borderRadius: 0,
        },
        elevation1: { boxShadow: TOKENS.shadow.sm },
        elevation2: { boxShadow: TOKENS.shadow.sm },
        elevation3: { boxShadow: TOKENS.shadow.base },
        elevation4: { boxShadow: TOKENS.shadow.md },
        elevation8: { boxShadow: TOKENS.shadow.lg },
        elevation16: { boxShadow: TOKENS.shadow.xl },
        elevation24: { boxShadow: TOKENS.shadow["2xl"] },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ ownerState }: any) => ({
          fontFamily: TOKENS.font.family.body,
          fontWeight: TOKENS.font.weight.semibold,
          fontSize: TOKENS.font.size.sm,
          letterSpacing: TOKENS.font.letterSpacing.wide,
          textTransform: "none",
          borderRadius: 0,
          transition: TOKENS.transition.base,
          padding: "8px 20px",
          ...(ownerState.variant === 'contained' && {
            boxShadow: TOKENS.shadow.xs,
            "&:hover": {
              boxShadow: TOKENS.shadow.sm,
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
          }),
          ...(ownerState.variant === 'contained' && ownerState.color === 'primary' && {
            background: `linear-gradient(135deg, ${TOKENS.color.primary} 0%, ${TOKENS.color.primaryLight} 100%)`,
            "&:hover": {
              background: `linear-gradient(135deg, ${TOKENS.color.primaryDark} 0%, ${TOKENS.color.primary} 100%)`,
            },
          }),
          ...(ownerState.variant === 'contained' && ownerState.color === 'secondary' && {
            background: `linear-gradient(135deg, ${TOKENS.color.secondary} 0%, ${TOKENS.color.secondaryLight} 100%)`,
            color: TOKENS.color.white,
            "&:hover": {
              background: `linear-gradient(135deg, ${TOKENS.color.secondaryDark} 0%, ${TOKENS.color.secondary} 100%)`,
            },
          }),
          ...(ownerState.variant === 'outlined' && {
            borderWidth: "1.5px",
            "&:hover": { borderWidth: "1.5px" },
          }),
          ...(ownerState.variant === 'outlined' && ownerState.color === 'primary' && {
            borderColor: TOKENS.color.primary,
            color: TOKENS.color.primary,
            "&:hover": {
              backgroundColor: TOKENS.color.primarySubtle,
            },
          }),
          ...(ownerState.variant === 'text' && {
            "&:hover": {
              backgroundColor: TOKENS.color.primarySubtle,
            },
          }),
        }),
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          transition: TOKENS.transition.base,
          "&:hover": {
            backgroundColor: TOKENS.color.primarySubtle,
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontFamily: TOKENS.font.family.body,
          fontSize: TOKENS.font.size.base,
          borderRadius: 0,
          backgroundColor: TOKENS.color.white,
          transition: TOKENS.transition.base,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: TOKENS.color.border,
            borderWidth: "1px",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: TOKENS.color.primary,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: TOKENS.color.primary,
            borderWidth: "2px",
          },
        },
        input: {
          padding: "10px 14px",
          fontSize: TOKENS.font.size.base,
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: TOKENS.font.family.body,
          fontSize: TOKENS.font.size.base,
          color: TOKENS.color.neutral500,
          fontWeight: TOKENS.font.weight.medium,
          "&.Mui-focused": {
            color: TOKENS.color.primary,
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: ({ ownerState }: any) => ({
          fontFamily: TOKENS.font.family.body,
          fontWeight: TOKENS.font.weight.medium,
          fontSize: TOKENS.font.size.xs,
          letterSpacing: TOKENS.font.letterSpacing.wide,
          borderRadius: 0,
          height: "24px",
          ...(ownerState.color === 'primary' && {
            backgroundColor: TOKENS.color.primarySubtle,
            color: TOKENS.color.primary,
            ...(ownerState.variant === 'filled' && {
              backgroundColor: TOKENS.color.primary,
              color: TOKENS.color.white,
            }),
          }),
          ...(ownerState.color === 'secondary' && {
            backgroundColor: TOKENS.color.secondarySubtle,
            color: TOKENS.color.secondaryDark,
          }),
          ...(ownerState.color === 'success' && {
            backgroundColor: TOKENS.color.accentSubtle,
            color: TOKENS.color.accent,
          }),
          ...(ownerState.color === 'warning' && {
            backgroundColor: TOKENS.color.warningSubtle,
            color: TOKENS.color.warning,
          }),
          ...(ownerState.color === 'error' && {
            backgroundColor: TOKENS.color.errorSubtle,
            color: TOKENS.color.error,
          }),
        }),
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `1px solid ${TOKENS.color.borderLight}`,
          boxShadow: "none",
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: TOKENS.color.neutral50,
          "& .MuiTableCell-head": {
            fontFamily: TOKENS.font.family.body,
            fontWeight: TOKENS.font.weight.semibold,
            fontSize: TOKENS.font.size.xs,
            color: TOKENS.color.neutral600,
            textTransform: "uppercase",
            letterSpacing: TOKENS.font.letterSpacing.widest,
            padding: "12px 16px",
            borderBottom: `2px solid ${TOKENS.color.border}`,
            whiteSpace: "nowrap",
          },
        },
      },
    },

    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root": {
            transition: TOKENS.transition.fast,
            "&:hover": {
              backgroundColor: TOKENS.color.neutral50,
            },
            "&:last-child .MuiTableCell-root": {
              borderBottom: "none",
            },
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: TOKENS.font.family.body,
          fontSize: TOKENS.font.size.sm,
          color: TOKENS.color.neutral700,
          padding: "12px 16px",
          borderColor: TOKENS.color.borderLight,
          lineHeight: TOKENS.font.lineHeight.normal,
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${TOKENS.color.borderLight}`,
          minHeight: "44px",
        },
        indicator: {
          height: "2px",
          backgroundColor: TOKENS.color.secondary,
          borderRadius: "2px 2px 0 0",
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: TOKENS.font.family.body,
          fontWeight: TOKENS.font.weight.medium,
          fontSize: TOKENS.font.size.sm,
          letterSpacing: TOKENS.font.letterSpacing.wide,
          textTransform: "none",
          color: TOKENS.color.neutral500,
          minHeight: "44px",
          padding: "10px 20px",
          transition: TOKENS.transition.base,
          "&.Mui-selected": {
            color: TOKENS.color.primary,
            fontWeight: TOKENS.font.weight.semibold,
          },
          "&:hover": {
            color: TOKENS.color.primary,
            backgroundColor: TOKENS.color.primarySubtle,
          },
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: TOKENS.color.white,
          color: TOKENS.color.neutral800,
          boxShadow: TOKENS.shadow.sm,
          borderBottom: `1px solid ${TOKENS.color.borderLight}`,
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: TOKENS.color.white,
          color: TOKENS.color.neutral800,
          borderRight: `1px solid ${TOKENS.color.borderLight}`,
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          margin: "2px 8px",
          padding: "8px 12px",
          transition: TOKENS.transition.base,
          color: TOKENS.color.neutral600,
          "& .MuiListItemIcon-root": {
            color: TOKENS.color.neutral400,
            minWidth: "36px",
            transition: TOKENS.transition.base,
          },
          "& .MuiListItemText-primary": {
            fontFamily: TOKENS.font.family.body,
            fontWeight: TOKENS.font.weight.medium,
            fontSize: TOKENS.font.size.sm,
          },
          "&:hover": {
            backgroundColor: TOKENS.color.primarySubtle,
            color: TOKENS.color.primary,
            "& .MuiListItemIcon-root": {
              color: TOKENS.color.primary,
            },
          },
          "&.Mui-selected": {
            backgroundColor: TOKENS.color.primarySubtle,
            color: TOKENS.color.primary,
            "& .MuiListItemIcon-root": {
              color: TOKENS.color.primary,
            },
            "& .MuiListItemText-primary": {
              fontWeight: TOKENS.font.weight.semibold,
            },
            "&:hover": {
              backgroundColor: TOKENS.color.primarySubtle,
            },
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          boxShadow: TOKENS.shadow["2xl"],
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: TOKENS.font.family.body,
          fontWeight: TOKENS.font.weight.semibold,
          fontSize: TOKENS.font.size.xl,
          padding: "24px 24px 16px",
          color: TOKENS.color.neutral800,
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "16px 24px 24px",
          gap: "8px",
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState }: any) => ({
          fontFamily: TOKENS.font.family.body,
          fontSize: TOKENS.font.size.sm,
          borderRadius: 0,
          padding: "10px 16px",
          border: "1px solid",
          ...(ownerState.variant === 'standard' && ownerState.severity === 'success' && {
            backgroundColor: TOKENS.color.accentSubtle,
            borderColor: TOKENS.color.accent,
            color: TOKENS.color.accent,
          }),
          ...(ownerState.variant === 'standard' && ownerState.severity === 'warning' && {
            backgroundColor: TOKENS.color.warningSubtle,
            borderColor: TOKENS.color.warning,
            color: TOKENS.color.warning,
          }),
          ...(ownerState.variant === 'standard' && ownerState.severity === 'error' && {
            backgroundColor: TOKENS.color.errorSubtle,
            borderColor: TOKENS.color.error,
            color: TOKENS.color.error,
          }),
          ...(ownerState.variant === 'standard' && ownerState.severity === 'info' && {
            backgroundColor: TOKENS.color.primarySubtle,
            borderColor: TOKENS.color.primary,
            color: TOKENS.color.primary,
          }),
        }),
        message: {
          fontWeight: TOKENS.font.weight.medium,
        },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: ({ ownerState }: any) => ({
          fontFamily: TOKENS.font.family.body,
          fontWeight: TOKENS.font.weight.semibold,
          fontSize: TOKENS.font.size.sm,
          backgroundColor: TOKENS.color.primary,
          ...(ownerState.color === 'default' && {
            backgroundColor: TOKENS.color.primarySubtle,
            color: TOKENS.color.primary,
          }),
        }),
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: TOKENS.font.family.body,
          fontSize: TOKENS.font.size.xs,
          fontWeight: TOKENS.font.weight.medium,
          backgroundColor: TOKENS.color.neutral800,
          borderRadius: TOKENS.radius.sm,
          padding: "6px 10px",
        },
      },
    },

    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: TOKENS.font.size.sm,
          fontFamily: TOKENS.font.family.body,
          color: TOKENS.color.neutral500,
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: TOKENS.radius.full,
          height: 6,
          backgroundColor: TOKENS.color.neutral200,
        },
        bar: {
          borderRadius: TOKENS.radius.full,
        },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: TOKENS.radius.md,
          backgroundColor: TOKENS.color.neutral100,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: TOKENS.color.borderLight,
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: TOKENS.radius.lg,
          boxShadow: TOKENS.shadow.xl,
          border: `1px solid ${TOKENS.color.borderLight}`,
          marginTop: "6px",
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: TOKENS.font.family.body,
          fontSize: TOKENS.font.size.sm,
          fontWeight: TOKENS.font.weight.medium,
          padding: "9px 16px",
          borderRadius: TOKENS.radius.sm,
          margin: "1px 4px",
          color: TOKENS.color.neutral700,
          transition: TOKENS.transition.fast,
          "&:hover": {
            backgroundColor: TOKENS.color.primarySubtle,
            color: TOKENS.color.primary,
          },
          "&.Mui-selected": {
            backgroundColor: TOKENS.color.primarySubtle,
            color: TOKENS.color.primary,
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        icon: {
          color: TOKENS.color.neutral400,
        },
      },
    },

    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontFamily: TOKENS.font.family.body,
          fontSize: TOKENS.font.size.sm,
          fontWeight: TOKENS.font.weight.medium,
          "&.Mui-active": {
            fontWeight: TOKENS.font.weight.semibold,
            color: TOKENS.color.primary,
          },
          "&.Mui-completed": {
            color: TOKENS.color.accent,
          },
        },
      },
    },

    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: TOKENS.color.neutral300,
          "&.Mui-active": { color: TOKENS.color.primary },
          "&.Mui-completed": { color: TOKENS.color.accent },
        },
        text: {
          fontFamily: TOKENS.font.family.body,
          fontWeight: TOKENS.font.weight.bold,
          fontSize: "0.7rem",
        },
      },
    },

    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: `${TOKENS.radius.md} !important`,
          border: `1px solid ${TOKENS.color.borderLight}`,
          boxShadow: "none",
          marginBottom: "8px",
          "&:before": { display: "none" },
          "&.Mui-expanded": {
            boxShadow: TOKENS.shadow.sm,
          },
        },
      },
    },

    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: "0 20px",
          minHeight: "52px",
          "&.Mui-expanded": { minHeight: "52px" },
        },
        content: {
          fontFamily: TOKENS.font.family.body,
          fontWeight: TOKENS.font.weight.semibold,
          fontSize: TOKENS.font.size.base,
          color: TOKENS.color.neutral800,
          margin: "14px 0",
          "&.Mui-expanded": { margin: "14px 0" },
        },
      },
    },

    MuiBadge: {
      styleOverrides: {
        badge: {
          fontFamily: TOKENS.font.family.body,
          fontWeight: TOKENS.font.weight.bold,
          fontSize: "10px",
        },
      },
    },

    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          fontFamily: TOKENS.font.family.body,
          fontSize: TOKENS.font.size.sm,
          borderRadius: TOKENS.radius.md,
        },
      },
    },
  },
});

export default theme;
export { TOKENS };
