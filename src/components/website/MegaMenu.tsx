/**
 * Reusable multi-column mega-menu dropdown for the desktop header.
 * Opens on hover/focus, animates with framer-motion, and is driven
 * entirely by the {@link MegaColumn} config array.
 * @module MegaMenu
 */
"use client";
import { useId, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { dropdown } from "@/lib/motion";
import type { MegaColumn } from "@/lib/website/nav";

/** Props for {@link MegaMenu}. */
export interface MegaMenuProps {
  label: string;
  columns: MegaColumn[];
  active?: boolean;
}

const MotionBox = motion.create(Box);

/**
 * A single top-level nav item that reveals a multi-column dropdown panel.
 * @param props - Menu label, column config and active state
 */
export function MegaMenu({ label, columns, active = false }: MegaMenuProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  const handleOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <Box
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      sx={{ position: "static" }}
    >
      <Box
        component="button"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        onFocus={handleOpen}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          border: 0,
          background: "transparent",
          cursor: "pointer",
          px: 1.5,
          py: 3,
          font: "inherit",
          fontWeight: 600,
          fontSize: 13.5,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: active || open ? "primary.main" : "#3a3f45",
          position: "relative",
          transition: "color 0.2s ease",
          "&:hover": { color: "primary.main" },
          "&::after": {
            content: '""',
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 14,
            height: 3,
            bgcolor: "secondary.main",
            transform: active || open ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
            transition: "transform 0.22s ease",
          },
        }}
      >
        {label}
        <ExpandMoreIcon
          sx={{ fontSize: 18, transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "none" }}
        />
      </Box>

      <AnimatePresence>
        {open && (
          <MotionBox
            id={panelId}
            variants={dropdown}
            initial="hidden"
            animate="visible"
            exit="hidden"
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "100%",
              zIndex: (t) => t.zIndex.appBar + 1,
              bgcolor: "#fff",
              borderTop: "3px solid",
              borderColor: "primary.main",
              boxShadow: "0 16px 40px rgba(0,0,0,0.14)",
            }}
          >
            <Box
              sx={{
                maxWidth: 1200,
                mx: "auto",
                px: { xs: 3, md: 6 },
                py: 4,
                display: "grid",
                gap: 4,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: `repeat(${Math.min(columns.length, 4)}, 1fr)`,
                },
              }}
            >
              {columns.map((col) => (
                <Box key={col.heading}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "primary.main",
                      pb: 1,
                      mb: 1.5,
                      borderBottom: "2px solid",
                      borderColor: "secondary.main",
                    }}
                  >
                    {col.heading}
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {col.links.map((link) => (
                      <Box
                        key={link.label + link.href}
                        component={Link}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        sx={{
                          color: "#4a5058",
                          fontSize: 14,
                          textDecoration: "none",
                          py: 0.75,
                          borderBottom: "1px solid #f0f1f3",
                          transition: "color 0.15s ease, padding-left 0.15s ease",
                          "&:hover": { color: "primary.main", pl: 0.75 },
                        }}
                      >
                        {link.label}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}