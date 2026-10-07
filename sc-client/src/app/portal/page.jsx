"use client";

import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatKES, getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { ThisTermTab } from "./_tabs/ThisTermTab";
import { ResultsTab } from "./_tabs/ResultsTab";
import { FeesTab } from "./_tabs/FeesTab";
import { MessagesTab } from "./_tabs/MessagesTab";
import { TimetableTab } from "./_tabs/TimetableTab";
import { AttendanceTab } from "./_tabs/AttendanceTab";

const FEES_TAB = 2;

export default function PortalPage() {
  return (
    <PortalLayout>
      <PortalContent />
    </PortalLayout>
  );
}

function PortalContent() {
  const { user } = useAuth();
  const router = useRouter();
  const isParent = user?.role === "parent";

  // Hooks must run before any early return.
  const {
    data: studentsData,
    loading,
    error,
  } = useAsync(async () => {
    if (!isParent) return [];
    const res = await api.getStudents({ parent: user.id });
    return Array.isArray(res) ? res : res?.results || [];
  }, [user?.id, isParent]);

  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState(0);

  if (!isParent) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          This page is for parents only.
        </Typography>
        <Button variant="contained" onClick={() => router.push("/dashboard")}>
          Go to dashboard
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", minHeight: "60vh", alignItems: "center" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        We could not load your children's details. Please refresh the page or try again later.
      </Alert>
    );
  }

  const students = studentsData || [];

  if (students.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No children are linked to your account yet. Please contact the school office.
      </Alert>
    );
  }

  // Falls back to the first child until one is picked
  const student = students.find((s) => s.id === selectedId) || students[0];
  const fullName = `${student.firstName} ${student.lastName}`;
  const hasBalance = student.feeBalance > 0;

  const tabs = [
    { label: "Overview", content: <ThisTermTab student={student} onSwitchTab={setTab} /> },
    { label: "Results", content: <ResultsTab student={student} /> },
    { label: "Fees", content: <FeesTab student={student} /> },
    { label: "Attendance", content: <AttendanceTab student={student} /> },
    { label: "Messages", content: <MessagesTab student={student} user={user} /> },
  ];

  return (
    <Stack spacing={2}>
      {/* Child selector: only needed when there is more than one child */}
      {students.length > 1 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Select child
          </Typography>
          <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
            {students.map((s) => {
              const selected = s.id === student.id;
              return (
                <Chip
                  key={s.id}
                  label={`${s.firstName} ${s.lastName}`}
                  onClick={() => setSelectedId(s.id)}
                  color={selected ? "primary" : "default"}
                  variant={selected ? "filled" : "outlined"}
                  sx={{ flexShrink: 0, fontWeight: 600 }}
                />
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Child summary */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 2 }}
        >
          <Avatar
            src={student.photo}
            sx={{ width: 52, height: 52, bgcolor: "primary.main", color: "primary.contrastText" }}
          >
            {getInitials(fullName)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 160 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
              {fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {student.className}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adm. no. {student.admissionNumber}
            </Typography>
          </Box>

          {hasBalance && (
            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="caption" color="text.secondary">
                Fee balance
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "error.main", lineHeight: 1.2 }}
              >
                {formatKES(student.feeBalance)}
              </Typography>
              <Button size="small" onClick={() => setTab(FEES_TAB)} sx={{ px: 0, minWidth: 0 }}>
                View fees
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          {tabs.map((t) => (
            <Tab key={t.label} label={t.label} sx={{ fontWeight: 600, textTransform: "none" }} />
          ))}
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>{tabs[tab].content}</Box>
      </Paper>
    </Stack>
  );
}
