"use client";

import { useState, useEffect } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
  Button,
} from "@mui/material";
import { StaffPortalLayout } from "@/components/layout/StaffPortalLayout";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { OverviewTab } from "./_tabs/OverviewTab";
import { MyClassesTab } from "./_tabs/MyClassesTab";
import { AttendanceTab } from "./_tabs/AttendanceTab";
import { GradingTab } from "./_tabs/GradingTab";
import { MessagesTab } from "./_tabs/MessagesTab";

export default function StaffPortalPage() {
  return (
    <StaffPortalLayout>
      <StaffPortalContent />
    </StaffPortalLayout>
  );
}

function StaffPortalContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState(0);

  // Only staff/teachers can access this portal
  if (
    user &&
    !["teacher", "class_teacher", "hod", "deputy", "headteacher", "admin"].includes(user.role)
  ) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" sx={{ mb: 2 }}>
          This portal is for teaching and administrative staff only.
        </Typography>
        <Button variant="contained" onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  // Fetch the staff profile to get assigned classes
  const { data: staffProfile, loading } = useAsync(async () => {
    if (!user?.staffId) return null;
    try {
      const res = await api.getStaffById(user.staffId);
      return res;
    } catch {
      return null;
    }
  }, [user?.staffId]);

  if (loading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Welcome Header */}
      <Card sx={{ mb: 2, borderRadius: 2, bgcolor: "primary.main", color: "white" }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: "rgba(255,255,255,0.2)", fontSize: 20 }}>
            {getInitials(user?.name || "Staff")}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Welcome back, {user?.name?.split(" ")[0] || "Teacher"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {staffProfile?.designation || user?.role?.replace("_", " ")} ·{" "}
              {staffProfile?.department || "Staff"}
            </Typography>
          </Box>
          <Chip
            label={staffProfile?.status || "Active"}
            size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 700 }}
          />
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Card sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": { minHeight: 48, fontSize: { xs: 12, sm: 14 }, fontWeight: 700 },
          }}
        >
          <Tab label="Overview" />
          <Tab label="My Classes" />
          <Tab label="Attendance" />
          <Tab label="Grading" />
          <Tab label="Messages" />
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {tab === 0 && (
            <OverviewTab user={user} staffProfile={staffProfile} onSwitchTab={setTab} />
          )}
          {tab === 1 && <MyClassesTab user={user} staffProfile={staffProfile} />}
          {tab === 2 && <AttendanceTab user={user} staffProfile={staffProfile} />}
          {tab === 3 && <GradingTab user={user} />}
          {tab === 4 && <MessagesTab user={user} />}
        </Box>
      </Card>
    </>
  );
}
