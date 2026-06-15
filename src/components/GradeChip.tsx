/**
 * Letter-grade chip with color coding.
 * @module GradeChip
 */
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import { TOKENS } from "@/theme/theme";

const C = TOKENS.color;

function colorFor(grade: string): string {
  if (grade.startsWith("A")) return C.success;
  if (grade.startsWith("B")) return C.info;
  if (grade.startsWith("C")) return C.warning;
  if (grade.startsWith("D")) return C.warning;
  return C.error;
}

/** Render a letter grade as a colored chip. */
export function GradeChip({ grade, label }: { grade?: string; label?: string }) {
  if (!grade) return <span>—</span>;
  const color = colorFor(grade);
  return (
    <Chip
      label={label ?? grade}
      size="small"
      sx={{
        color,
        bgcolor: alpha(color, 0.1),
        fontWeight: 700,
        borderRadius: 1,
      }}
    />
  );
}

export default GradeChip;
