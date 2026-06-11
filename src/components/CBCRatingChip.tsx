/**
 * CBC competency rating chip (EE/ME/AE/BE).
 * @module CBCRatingChip
 */
import Chip from "@mui/material/Chip";
import type { CBCRating } from "@/lib/types";

const MAP: Record<CBCRating, { color: string; bg: string; label: string }> = {
  EE: { color: "#2E7D32", bg: "#2E7D3219", label: "EE" },
  ME: { color: "#1565C0", bg: "#1565C019", label: "ME" },
  AE: { color: "#EF6C00", bg: "#EF6C0019", label: "AE" },
  BE: { color: "#C62828", bg: "#C6282819", label: "BE" },
};

/** Render a CBC rating as a colored chip. */
export function CBCRatingChip({ rating }: { rating?: CBCRating }) {
  if (!rating) return <span>—</span>;
  const cfg = MAP[rating];
  return <Chip label={cfg.label} size="small" sx={{ color: cfg.color, bgcolor: cfg.bg, fontWeight: 700, borderRadius: 1 }} />;
}

export default CBCRatingChip;