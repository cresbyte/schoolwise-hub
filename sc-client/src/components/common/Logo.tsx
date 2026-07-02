import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SxProps, Theme } from "@mui/material/styles";

interface LogoProps {
  size?: number;
  withText?: boolean;
  textColor?: string;
  variant?: "dark" | "light";
  sx?: SxProps<Theme>;
  textStyle?: SxProps<Theme>;
}

/**
 * Reusable School Logo component.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 40,
  withText = true,
  textColor,
  variant = "dark",
  sx,
  textStyle,
}) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: size > 0 ? 1.5 : 0, ...sx }}>
      {size > 0 && (
        <Box
          component="img"
          src="/school-logo.png"
          alt="School Logo"
          sx={{
            width: size,
            height: size,
            objectFit: "contain",
            borderRadius: size * 0.2, // Subtle rounding
          }}
        />
      )}
      {withText && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: textColor || (variant === "dark" ? "primary.main" : "common.white"),
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            ...textStyle,
          }}
        >
          Shule
          <Box component="span" sx={{ color: variant === "dark" ? "secondary.main" : "secondary.light" }}>
            Smart
          </Box>
        </Typography>
      )}
    </Box>
  );
};
