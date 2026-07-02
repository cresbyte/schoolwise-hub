/**
 * Floating scroll-to-top button for website pages.
 * @module ScrollToTop
 */
import { useEffect, useState } from "react";
import Fab from "@mui/material/Fab";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Zoom from "@mui/material/Zoom";

const THRESHOLD = 300;

/**
 * FAB that appears after scrolling past 300px and smooth-scrolls to top.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > THRESHOLD);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Zoom in={visible}>
      <Fab
        size="medium"
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="no-print"
        sx={{
          position: "fixed",
          bottom: 96,
          right: 24,
          zIndex: 1200,
          bgcolor: "primary.main",
          color: "common.white",
          "&:hover": { bgcolor: "primary.dark" },
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
}
