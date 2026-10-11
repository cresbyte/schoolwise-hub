"use client";

import { Avatar, Box, Typography } from "@mui/material";
import { getInitials } from "@/lib/utils";

export function ChildSelector({ children = [], selectedId, onSelect }) {
  if (!children || children.length === 0) return null;

  if (children.length === 1) {
    const c = children[0];
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Avatar
          src={c.photo || undefined}
          sx={{
            width: 42,
            height: 42,
            bgcolor: "primary.main",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {getInitials(c.name)}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
            {c.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            display="block"
            sx={{ fontSize: "0.7rem" }}
          >
            {c.gradeLevel} {c.className ? `• ${c.className}` : ""} • {c.admissionNumber}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          color: "text.secondary",
          mb: 0.75,
          display: "block",
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontSize: "0.68rem",
        }}
      >
        Select Student
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 1.25,
          overflowX: "auto",
          pb: 0.75,
          pt: 0.25,
          px: 0.25,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {children.map((c) => {
          const isSelected = String(c.id) === String(selectedId);
          return (
            <Box
              key={c.id}
              onClick={() => onSelect(c.id)}
              sx={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                pr: 1.75,
                borderRadius: 3,
                cursor: "pointer",
                bgcolor: isSelected ? "primary.main" : "background.paper",
                color: isSelected ? "primary.contrastText" : "text.primary",
                border: 1.5,
                borderColor: isSelected ? "primary.main" : "divider",
                boxShadow: isSelected ? "0 6px 14px -4px rgba(31,95,174,0.4)" : "none",
                transition: "all 0.2s ease",
                "&:hover": { borderColor: "primary.main" },
                "&:active": { transform: "scale(0.97)" },
              }}
            >
              <Avatar
                src={c.photo || undefined}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: 12,
                  bgcolor: isSelected ? "white" : "primary.light",
                  color: isSelected ? "primary.main" : "primary.contrastText",
                  fontWeight: 800,
                }}
              >
                {getInitials(c.name)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: isSelected ? 800 : 700, lineHeight: 1.2, fontSize: "0.8rem" }}
                  noWrap
                >
                  {c.name.split(" ")[0]}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: isSelected ? 0.9 : 0.65,
                    fontSize: "0.65rem",
                    display: "block",
                  }}
                  noWrap
                >
                  {c.gradeLevel}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
