"use client";

/**
 * Public website shell — navbar, footer, and floating actions.
 * @module WebsiteLayout
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import theme from "@/theme/theme";
import { WebsiteNavbar } from "./WebsiteNavbar";
import { WebsiteFooter } from "./WebsiteFooter";
import { WhatsAppButton } from "./WhatsAppButton";
import { ScrollToTop } from "./ScrollToTop";
import { BODY_FONT, HEADING_FONT } from "@/lib/website/constants";

/** Extended theme: Poppins for all headings and body text on the public website. */
const websiteTheme = createTheme(theme, {
  typography: {
    fontFamily: BODY_FONT,
    h1: { fontFamily: HEADING_FONT },
    h2: { fontFamily: HEADING_FONT },
    h3: { fontFamily: HEADING_FONT },
    h4: { fontFamily: HEADING_FONT },
    h5: { fontFamily: HEADING_FONT },
    h6: { fontFamily: HEADING_FONT },
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
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}
