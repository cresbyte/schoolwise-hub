/**
 * Dashboard statistic card with icon, value, label and optional trend.
 * @module StatCard
 */
import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { TOKENS } from "@/theme/theme";

interface StatCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  color?: string;
  footer?: ReactNode;
}

/** Compact KPI card with left accent border and icon circle. */
export function StatCard({ icon, value, label, color, footer }: StatCardProps) {
  const theme = useTheme();
  const accentColor = color ?? theme.palette.primary.main;

  return (
    <Card
      sx={{
        height: "100%",
        borderLeft: `4px solid ${accentColor}`,
        p: 3,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: TOKENS.radius.lg,
          backgroundColor: alpha(accentColor, 0.1),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: accentColor,
          "& .MuiSvgIcon-root": { fontSize: 26 },
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "text.secondary",
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
        {footer && <Box sx={{ mt: 1 }}>{footer}</Box>}
      </Box>
    </Card>
  );
}

export default StatCard;
