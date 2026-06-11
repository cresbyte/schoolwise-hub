/**
 * Page header with title, subtitle and an actions slot.
 * @module PageHeader
 */
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

/** Standard page heading with right-aligned actions. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box
      className="no-print"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h5">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{actions}</Box>}
    </Box>
  );
}

export default PageHeader;