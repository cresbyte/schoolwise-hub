/**
 * Placeholder section for modules under construction.
 * @module ComingSoon
 */
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConstructionIcon from "@mui/icons-material/Construction";

/** Friendly "module in progress" placeholder. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <Card>
      <Stack spacing={1.5} sx={{ alignItems: "center", py: 8, color: "text.secondary" }}>
        <ConstructionIcon sx={{ fontSize: 56, opacity: 0.4 }} />
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2">This module is being built and will be available shortly.</Typography>
      </Stack>
    </Card>
  );
}

export default ComingSoon;