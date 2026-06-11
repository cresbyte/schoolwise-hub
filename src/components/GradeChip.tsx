/**
 * Letter-grade chip with color coding.
 * @module GradeChip
 */
import Chip from "@mui/material/Chip";

function colorFor(grade: string): { color: string; bg: string } {
  if (grade.startsWith("A")) return { color: "#2E7D32", bg: "#2E7D3219" };
  if (grade.startsWith("B")) return { color: "#1565C0", bg: "#1565C019" };
  if (grade.startsWith("C")) return { color: "#EF6C00", bg: "#EF6C0019" };
  if (grade.startsWith("D")) return { color: "#D84315", bg: "#D8431519" };
  return { color: "#C62828", bg: "#C6282819" };
}

/** Render a letter grade as a colored chip. */
export function GradeChip({ grade }: { grade?: string }) {
  if (!grade) return <span>—</span>;
  const cfg = colorFor(grade);
  return <Chip label={grade} size="small" sx={{ color: cfg.color, bgcolor: cfg.bg, fontWeight: 700, borderRadius: 1 }} />;
}

export default GradeChip;