/**
 * Page header with title, subtitle, breadcrumbs and an actions slot.
 * @module PageHeader
 */
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
}

/** Standard page heading with optional breadcrumbs and right-aligned actions. */
export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <Box className="no-print" sx={{ mb: 3 }}>
      {breadcrumbs && (
        <Breadcrumbs sx={{ mb: 0.5 }}>
          {breadcrumbs}
        </Breadcrumbs>
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default PageHeader;
