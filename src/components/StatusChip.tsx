/**
 * Colored status chip mapping common statuses to MUI colors.
 * @module StatusChip
 */
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import { TOKENS } from "@/theme/theme";

const C = TOKENS.color;

const MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: C.success },
  transferred_out: { label: "Transferred", color: C.warning },
  graduated: { label: "Graduated", color: C.info },
  expelled: { label: "Expelled", color: C.error },
  deferred: { label: "Deferred", color: C.neutral600 },
  on_leave: { label: "On Leave", color: C.warning },
  suspended: { label: "Suspended", color: C.error },
  terminated: { label: "Terminated", color: C.neutral500 },
  paid: { label: "Paid", color: C.success },
  partial: { label: "Partial", color: C.warning },
  unpaid: { label: "Unpaid", color: C.error },
  overpaid: { label: "Overpaid", color: C.info },
  upcoming: { label: "Upcoming", color: C.neutral500 },
  ongoing: { label: "Ongoing", color: C.info },
  marking: { label: "Marking", color: C.warning },
  completed: { label: "Completed", color: C.success },
  published: { label: "Published", color: C.neutral600 },
  draft: { label: "Draft", color: C.neutral500 },
  approved: { label: "Approved", color: C.info },
  pending: { label: "Pending", color: C.warning },
  rejected: { label: "Rejected", color: C.error },
  cancelled: { label: "Cancelled", color: C.neutral500 },
  archived: { label: "Archived", color: C.neutral500 },
};

/** Render a status string as a colored chip. */
export function StatusChip({ status, size = "small" }: { status: string; size?: "small" | "medium" }) {
  const cfg = MAP[status] ?? { label: status, color: C.neutral500 };
  return (
    <Chip
      label={cfg.label}
      size={size}
      sx={{
        color: cfg.color,
        bgcolor: alpha(cfg.color, 0.1),
        fontWeight: 600,
        borderRadius: 1,
      }}
    />
  );
}

export default StatusChip;
