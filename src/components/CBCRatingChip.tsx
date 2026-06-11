/**
 * CBC competency rating chip (EE/ME/AE/BE).
 * @module CBCRatingChip
 */
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import type { CBCRating } from "@/lib/types";
import { TOKENS } from "@/theme/theme";

const C = TOKENS.color;

const MAP: Record<CBCRating, { color: string; label: string }> = {
  EE: { color: C.success, label: "EE" },
  ME: { color: C.info, label: "ME" },
  AE: { color: C.warning, label: "AE" },
  BE: { color: C.error, label: "BE" },
};

/** Render a CBC rating as a colored chip. */
export function CBCRatingChip({ rating }: { rating?: CBCRating }) {
  if (!rating) return <span>—</span>;
  const cfg = MAP[rating];
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        color: cfg.color,
        bgcolor: alpha(cfg.color, 0.1),
        fontWeight: 700,
        borderRadius: 1,
      }}
    />
  );
}

export default CBCRatingChip;
