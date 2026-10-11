"use client";

import { useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import EventIcon from "@mui/icons-material/Event";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";

import { useAsync } from "@/hooks/useAsync";
import { staffApi } from "@/lib/staffApi";
import { formatDate } from "@/lib/utils";

export default function StaffNoticesPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: notices, loading, error, refetch } = useAsync(async () => {
    return await staffApi.getNotices();
  }, []);

  const list = notices || [];

  const filteredNotices = list.filter((n) => {
    const matchesCategory =
      categoryFilter === "all" ||
      (n.category || "").toLowerCase() === categoryFilter.toLowerCase();

    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (n.title || "").toLowerCase().includes(q) ||
      (n.content || "").toLowerCase().includes(q) ||
      (n.author || "").toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Staff Announcements & Notices
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Official school communications, calendar deadlines, and academic notices
        </Typography>
      </Box>

      {/* Filter and Search Bar */}
      <Card elevation={1} sx={{ borderRadius: 2, p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <TextField
            size="small"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: { xs: "100%", sm: 260 } }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="exam">Examinations</MenuItem>
              <MenuItem value="meeting">Meetings</MenuItem>
              <MenuItem value="activity">Activities</MenuItem>
              <MenuItem value="announcement">Announcements</MenuItem>
              <MenuItem value="holiday">Holidays & Closures</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      {filteredNotices.length === 0 && !loading ? (
        <Card sx={{ p: 5, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No announcements found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search || categoryFilter !== "all"
              ? "No notices match your current filters."
              : "There are currently no staff notices or calendar events."}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2.5}>
          {filteredNotices.map((n) => {
            const isUrgent = n.priority === "urgent" || n.category === "exam";

            return (
              <Card key={n.id} elevation={1} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ sm: "flex-start" }}
                    sx={{ mb: 1.5 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: isUrgent ? "error.light" : "primary.light",
                          color: isUrgent ? "error.main" : "primary.main",
                          width: 40,
                          height: 40,
                        }}
                      >
                        {n.type === "calendar" ? <EventIcon /> : <CampaignIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {n.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Posted by {n.author || "Administration"} • {formatDate(n.date)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mt: { xs: 1, sm: 0 } }}>
                      {n.category && (
                        <Chip
                          label={n.category.toUpperCase()}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 22 }}
                        />
                      )}
                      {isUrgent && (
                        <Chip
                          label="Urgent"
                          size="small"
                          color="error"
                          sx={{ fontWeight: 700, height: 22 }}
                        />
                      )}
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ lineHeight: 1.7, whiteSpace: "pre-line" }}
                  >
                    {n.content}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
