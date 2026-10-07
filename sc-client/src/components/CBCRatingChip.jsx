// @/components/CBCRatingChip.jsx
import Chip from "@mui/material/Chip";

const ratingColors = {
  "Exceeding Expectations": "success",
  "Meeting Expectations": "primary",
  "Approaching Expectations": "info",
  "Below Expectations": "warning",
  "Needs Intervention": "error",
};

export function CBCRatingChip({ rating }) {
  return (
    <Chip
      label={rating}
      size="small"
      color={ratingColors[rating] || "default"}
      variant="outlined"
    />
  );
}
