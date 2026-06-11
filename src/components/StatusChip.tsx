/**
 * Colored status chip mapping common statuses to MUI colors.
 * @module StatusChip
 */
import Chip from "@mui/material/Chip";

const MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#2E7D32", bg: "#2E7D3219" },
  transferred_out: { label: "Transferred", color: "#EF6C00", bg: "#EF6C0019" },
  graduated: { label: "Graduated", color: "#1565C0", bg: "#1565C019" },
  expelled: { label: "Expelled", color: "#C62828", bg: "#C6282819" },
  deferred: { label: "Deferred", color: "#6A1B9A", bg: "#6A1B9A19" },
  on_leave: { label: "On Leave", color: "#EF6C00", bg: "#EF6C0019" },
  suspended: { label: "Suspended", color: "#C62828", bg: "#C6282819" },
  terminated: { label: "Terminated", color: "#5a6776", bg: "#5a677619" },
  paid: { label: "Paid", color: "#2E7D32", bg: "#2E7D3219" },
  partial: { label: "Partial", color: "#EF6C00", bg: "#EF6C0019" },
  unpaid: { label: "Unpaid", color: "#C62828", bg: "#C6282819" },
  overpaid: { label: "Overpaid", color: "#1565C0", bg: "#1565C019" },
  upcoming: { label: "Upcoming", color: "#5a6776", bg: "#5a677619" },
  ongoing: { label: "Ongoing", color: "#1565C0", bg: "#1565C019" },
  marking: { label: "Marking", color: "#EF6C00", bg: "#EF6C0019" },
  completed: { label: "Completed", color: "#2E7D32", bg: "#2E7D3219" },
  published: { label: "Published", color: "#6A1B9A", bg: "#6A1B9A19" },
  draft: { label: "Draft", color: "#5a6776", bg: "#5a677619" },
  approved: { label: "Approved", color: "#1565C0", bg: "#1565C019" },
  pending: { label: "Pending", color: "#EF6C00", bg: "#EF6C0019" },
  rejected: { label: "Rejected", color: "#C62828", bg: "#C6282819" },
  cancelled: { label: "Cancelled", color: "#5a6776", bg: "#5a677619" },
  archived: { label: "Archived", color: "#5a6776", bg: "#5a677619" },
};

/** Render a status string as a colored chip. */
export function StatusChip({ status, size = "small" }: { status: string; size?: "small" | "medium" }) {
  const cfg = MAP[status] ?? { label: status, color: "#5a6776", bg: "#5a677619" };
  return (
    <Chip
      label={cfg.label}
      size={size}
      sx={{ color: cfg.color, bgcolor: cfg.bg, fontWeight: 600, borderRadius: 1 }}
    />
  );
}

export default StatusChip;