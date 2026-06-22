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
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        position: "relative",
        overflow: "hidden",
        border: "none",
        boxShadow: TOKENS.shadow.sm,
        "&:hover": {
          boxShadow: TOKENS.shadow.md,
          transform: "translateY(-2px)",
        },
        transition: TOKENS.transition.base,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: TOKENS.radius.md,
            background: `linear-gradient(135deg, ${alpha(accentColor, 0.1)} 0%, ${alpha(
              accentColor,
              0.2
            )} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
            "& .MuiSvgIcon-root": { fontSize: 24 },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography
            variant="caption"
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "text.secondary",
              fontWeight: 700,
              fontSize: 10,
              display: "block",
              mb: 0.5,
            }}
          >
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1 }}>
            {value}
          </Typography>
        </Box>
      </Box>
      {footer && (
        <Box
          sx={{
            pt: 1.5,
            borderTop: `1px solid ${TOKENS.color.borderLight}`,
            display: "flex",
            alignItems: "center",
          }}
        >
          {footer}
        </Box>
      )}
    </Card>
  );
}

export default StatCard;
