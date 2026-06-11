/**
 * Dashboard statistic card with icon, value, label and optional trend.
 * @module StatCard
 */
import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface StatCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  color?: string;
  footer?: ReactNode;
}

/** Compact KPI card. */
export function StatCard({ icon, value, label, color = "#1565C0", footer }: StatCardProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${color}1A`,
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
        {footer && <Box sx={{ mt: 1.5 }}>{footer}</Box>}
      </CardContent>
    </Card>
  );
}

export default StatCard;