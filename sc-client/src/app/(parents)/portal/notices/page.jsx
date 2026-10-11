"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import CampaignIcon from "@mui/icons-material/Campaign";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import CelebrationIcon from "@mui/icons-material/Celebration";

import { useAsync } from "@/hooks/useAsync";
import { portalApi } from "@/lib/portalApi";
import { formatDate } from "@/lib/utils";

const CATEGORY_ICONS = {
  exam: <SchoolIcon fontSize="small" />,
  meeting: <GroupsIcon fontSize="small" />,
  holiday: <CelebrationIcon fontSize="small" />,
  closure: <EventIcon fontSize="small" />,
  activity: <CampaignIcon fontSize="small" />,
};

const CATEGORY_COLORS = {
  exam: "error",
  holiday: "info",
  closure: "default",
  meeting: "secondary",
  activity: "primary",
  trip: "primary",
  deadline: "warning",
  other: "default",
};

export default function PortalNoticesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const today = new Date().toISOString().slice(0, 10);

  const { data, loading, error } = useAsync(
    () => portalApi.getCalendarEvents({ from: today, visible_to_parents: true }),
    []
  );

  const events = Array.isArray(data) ? data : [];

  const categories = ["all", "exam", "meeting", "holiday", "activity"];

  const filteredEvents = events.filter((e) => {
    if (selectedCategory === "all") return true;
    return (e.category || "").toLowerCase() === selectedCategory;
  });

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          School Notices & Events
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Official academic calendar, term dates, and parent announcements
        </Typography>
      </Box>

      {/* Category Filter Chips */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 0.5,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat === "all" ? "All Events" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            onClick={() => setSelectedCategory(cat)}
            color={selectedCategory === cat ? "primary" : "default"}
            variant={selectedCategory === cat ? "filled" : "outlined"}
            sx={{ fontWeight: 600, flexShrink: 0 }}
          />
        ))}
      </Box>

      {loading && <LinearProgress sx={{ borderRadius: 1 }} />}
      {error && <Alert severity="error">{error.message}</Alert>}

      {filteredEvents.length === 0 && !loading ? (
        <Card sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No upcoming events found for this category.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {filteredEvents.map((e) => {
            const color = CATEGORY_COLORS[e.category] || "default";
            const icon = CATEGORY_ICONS[e.category] || <EventIcon fontSize="small" />;

            return (
              <Card
                key={e.id}
                elevation={1}
                sx={{
                  borderRadius: 2.5,
                  p: { xs: 2, sm: 2.5 },
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1.75} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: `${color}.50`,
                      color: `${color}.main`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                        {e.title}
                      </Typography>
                      <Chip
                        size="small"
                        color={color}
                        variant="outlined"
                        label={e.category ? e.category.toUpperCase() : "EVENT"}
                        sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}
                      />
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      📅 {e.start_date === e.end_date ? formatDate(e.start_date) : `${formatDate(e.start_date)} → ${formatDate(e.end_date)}`}
                    </Typography>

                    {e.description && (
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ mt: 1.25, lineHeight: 1.6, bgcolor: "grey.50", p: 1.5, borderRadius: 1.5 }}
                      >
                        {e.description}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
