/**
 * Public website shell — navbar, footer, and floating actions.
 * @module WebsiteLayout
 */
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import theme from "@/theme/theme";
import { WebsiteNavbar } from "./WebsiteNavbar";
import { WebsiteFooter } from "./WebsiteFooter";
import { WhatsAppButton } from "./WhatsAppButton";
import { ScrollToTop } from "./ScrollToTop";
import { BODY_FONT, HEADING_FONT } from "@/lib/website/constants";

/** Extended theme with Merriweather for website display headings (h1–h3). */
const websiteTheme = createTheme(theme, {
  typography: {
    fontFamily: BODY_FONT,
    h1: { fontFamily: HEADING_FONT },
    h2: { fontFamily: HEADING_FONT },
    h3: { fontFamily: HEADING_FONT },
  },
});

/** Props for {@link WebsiteLayout}. */
export interface WebsiteLayoutProps {
  children: ReactNode;
  hideChrome?: boolean;
}

/**
 * Wraps public pages with navigation, footer, and floating utilities.
 * @param props - Page content and optional chrome hiding for print views
 */
export function WebsiteLayout({ children, hideChrome = false }: WebsiteLayoutProps) {
  return (
    <ThemeProvider theme={websiteTheme}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.paper" }}>
        {!hideChrome && <WebsiteNavbar />}
        <Box component="main" sx={{ flex: 1 }}>
          {children}
        </Box>
        {!hideChrome && <WebsiteFooter />}
        {!hideChrome && (
          <>
            <ScrollToTop />
            <WhatsAppButton />
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}
