/**
 * Parent portal home.
 * @module routes/portal
 */
import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { ComingSoon } from "@/components/ComingSoon";
import Typography from "@mui/material/Typography";

export const Route = createFileRoute("/portal")({
  head: () => ({ meta: [{ title: "Parent Portal — SchuleSmart" }] }),
  component: () => (
    <PortalLayout>
      <Typography variant="h5" sx={{ mb: 2 }}>Parent Portal</Typography>
      <ComingSoon title="Your Child's Dashboard" />
    </PortalLayout>
  ),
});
