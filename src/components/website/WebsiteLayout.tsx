/**
 * Public website shell — navbar, footer, and floating actions.
 * @module WebsiteLayout
 */
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { websiteTheme } from "@/theme/websiteTheme";
import { WebsiteNavbar } from "./WebsiteNavbar";
import { WebsiteFooter } from "./WebsiteFooter";
import { WhatsAppButton } from "./WhatsAppButton";
import { ScrollToTop } from "./ScrollToTop";

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
      <CssBaseline />
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
