/**
 * MUI theme configuration for SchuleSmart.
 * @module theme
 */
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#1565C0", light: "#5e92f3", dark: "#003c8f", contrastText: "#ffffff" },
    secondary: { main: "#F57F17", light: "#ffb04c", dark: "#bc5100", contrastText: "#ffffff" },
    success: { main: "#2E7D32" },
    error: { main: "#C62828" },
    warning: { main: "#F57F17" },
    info: { main: "#1565C0" },
    background: { default: "#f4f6f9", paper: "#ffffff" },
    text: { primary: "#1a2027", secondary: "#5a6776" },
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" },
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } } },
  },
});

export default theme;