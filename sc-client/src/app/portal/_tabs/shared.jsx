"use client";
import { Card, Typography } from "@mui/material";

export function StatItem({ label, value }) {
  return (
    <Card variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
        {value}
      </Typography>
    </Card>
  );
}

export function PortalStatCard({ label, value, color }) {
  return (
    <Card
      variant="outlined"
      sx={{ p: 1.5, textAlign: "center", borderTop: "4px solid", borderTopColor: color }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        {value}
      </Typography>
    </Card>
  );
}
