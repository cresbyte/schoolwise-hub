"use client";

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CampaignIcon from "@mui/icons-material/Campaign";
import DescriptionIcon from "@mui/icons-material/Description";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PaymentsIcon from "@mui/icons-material/Payments";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { portalApi } from "@/lib/portalApi";
import { formatKES, getInitials } from "@/lib/utils";

export default function PortalHomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: children, loading, error } = useAsync(
    () => portalApi.getChildren(),
    []
  );

  const { data: notices } = useAsync(
    () => portalApi.getCalendarEvents({ visible_to_parents: true }),
    []
  );

  if (loading) return <LinearProgress sx={{ borderRadius: 1 }} />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  const kids = Array.isArray(children) ? children : [];
  const events = Array.isArray(notices) ? notices : [];

  if (kids.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          No Enrolled Students
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No children are currently linked to your parent account. Please contact the school administration to link your phone number ({user?.phone || "registered contact"}).
        </Typography>
      </Card>
    );
  }

  return (
    <Box>
      {/* Greeting banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: 3,
          background:
            "linear-gradient(135deg, #1F5FAE 0%, #174A8A 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          },
        }}
      >
        <Typography
          variant="overline"
          sx={{ opacity: 0.85, letterSpacing: 1.2, fontSize: "0.65rem", fontWeight: 700 }}
        >
          Parent Portal • Term 2 2026
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, mb: 0.5, letterSpacing: -0.3 }}>
          Hello, {user?.name ? user.name.split(" ")[0] : "Parent"} 👋
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.8rem" }}>
          {kids.length === 1
            ? `Viewing academic updates for ${kids[0].name}.`
            : `You have ${kids.length} children enrolled at school.`}
        </Typography>
      </Paper>

      {/* Children */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            mb: 1.25,
            color: "text.secondary",
            textTransform: "uppercase",
            fontSize: "0.7rem",
            letterSpacing: 0.6,
          }}
        >
          Student Overview
        </Typography>

        <Stack spacing={2}>
          {kids.map((child) => (
            <ChildCard key={child.id} child={child} router={router} />
          ))}
        </Stack>
      </Box>

      {/* Notices */}
      {events.length > 0 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            p: 2,
            border: 1,
            borderColor: "divider",
            mb: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                fontSize: "0.85rem",
              }}
            >
              <CampaignIcon color="primary" sx={{ fontSize: 18 }} />
              Notices &amp; Events
            </Typography>
            <Button
              size="small"
              component={Link}
              href="/portal/notices"
              endIcon={<ArrowForwardIosIcon sx={{ fontSize: 10 }} />}
              sx={{
                textTransform: "none",
                fontSize: "0.72rem",
                fontWeight: 700,
                minWidth: 0,
                p: 0.5,
              }}
            >
              View All
            </Button>
          </Stack>

          <Stack spacing={1} divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>
            {events.slice(0, 3).map((ev) => (
              <Box key={ev.id} sx={{ pt: 1, "&:first-of-type": { pt: 0 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
                      {ev.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.15, display: "block" }}>
                      {ev.start_date || ev.date || "Upcoming"}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={(ev.category || "Event").toUpperCase()}
                    sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Card>
      )}
    </Box>
  );
}

function ChildCard({ child, router }) {
  const attendanceRate = Math.round((child.attendance?.rate || 0) * 100);
  const balance = Number(child.fees?.balance || 0);
  const overdue = child.fees?.daysOverdue > 0;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        transition: "box-shadow 0.15s, transform 0.15s",
        "&:hover": { boxShadow: 3, transform: "translateY(-1px)" },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Stack direction="row" spacing={1.75} alignItems="center" sx={{ mb: 1.75 }}>
          <Avatar
            src={child.photo || undefined}
            sx={{
              width: 48,
              height: 48,
              bgcolor: "primary.main",
              fontSize: 16,
              fontWeight: 800,
              boxShadow: "0 4px 10px -2px rgba(31,95,174,0.35)",
            }}
          >
            {getInitials(child.name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
              {child.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.15, display: "block" }}>
              {child.gradeLevel} {child.className ? `• ${child.className}` : ""}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
              Adm: {child.admissionNumber}
            </Typography>
          </Box>
        </Stack>

        {/* Attendance */}
        <Box
          sx={{
            mb: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "grey.50",
            border: 1,
            borderColor: "divider",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <EventAvailableIcon sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.7rem" }}>
                30-Day Attendance
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                fontSize: "0.8rem",
                color:
                  attendanceRate >= 90
                    ? "success.main"
                    : attendanceRate >= 75
                    ? "warning.main"
                    : "error.main",
              }}
            >
              {attendanceRate}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={attendanceRate}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: "grey.200",
              "& .MuiLinearProgress-bar": { borderRadius: 3 },
            }}
            color={attendanceRate >= 90 ? "success" : attendanceRate >= 75 ? "warning" : "error"}
          />
        </Box>

        {/* Fee balance */}
        <Box
          sx={{
            mb: 1.75,
            p: 1.5,
            borderRadius: 2,
            bgcolor: balance > 0 ? "#fff5f5" : "#f0fdf4",
            border: "1px solid",
            borderColor: balance > 0 ? "#fecaca" : "#bbf7d0",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 0.4 }}>
                Fee Balance
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: balance > 0 ? "error.main" : "success.main",
                  mt: 0.25,
                  letterSpacing: -0.3,
                }}
              >
                {formatKES(balance)}
              </Typography>
            </Box>

            {balance > 0 ? (
              <Button
                variant="contained"
                size="small"
                component={Link}
                href={`/portal/fees?child=${child.id}&pay=1`}
                startIcon={<PaymentsIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#00a859",
                  "&:hover": { bgcolor: "#008f4c" },
                  fontWeight: 800,
                  textTransform: "none",
                  borderRadius: 2,
                  fontSize: "0.75rem",
                  boxShadow: "0 4px 10px -2px rgba(0,168,89,0.4)",
                }}
              >
                Pay Fees
              </Button>
            ) : (
              <Chip
                size="small"
                color="success"
                label="Fully Paid"
                sx={{ fontWeight: 800, fontSize: "0.68rem" }}
              />
            )}
          </Stack>

          {overdue && (
            <Typography
              variant="caption"
              color="error.main"
              sx={{ display: "block", mt: 0.75, fontWeight: 700, fontSize: "0.68rem" }}
            >
              ⚠ {child.fees.daysOverdue} days overdue
            </Typography>
          )}
        </Box>

        {/* Action pills */}
        <Stack direction="row" spacing={0.75}>
          <Button
            size="small"
            variant="outlined"
            component={Link}
            href={`/portal/attendance?child=${child.id}`}
            startIcon={<EventAvailableIcon sx={{ fontSize: 14 }} />}
            sx={{
              flex: 1,
              textTransform: "none",
              borderRadius: 2,
              fontSize: "0.7rem",
              fontWeight: 700,
              py: 0.75,
            }}
          >
            Attendance
          </Button>
          <Button
            size="small"
            variant="outlined"
            component={Link}
            href={`/portal/reports?child=${child.id}`}
            startIcon={<DescriptionIcon sx={{ fontSize: 14 }} />}
            sx={{
              flex: 1,
              textTransform: "none",
              borderRadius: 2,
              fontSize: "0.7rem",
              fontWeight: 700,
              py: 0.75,
            }}
          >
            Report Card
          </Button>
          <Button
            size="small"
            variant="outlined"
            component={Link}
            href={`/portal/fees?child=${child.id}`}
            startIcon={<AccountBalanceWalletIcon sx={{ fontSize: 14 }} />}
            sx={{
              flex: 1,
              textTransform: "none",
              borderRadius: 2,
              fontSize: "0.7rem",
              fontWeight: 700,
              py: 0.75,
            }}
          >
            Statement
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}
