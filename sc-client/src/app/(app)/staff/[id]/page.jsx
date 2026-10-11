"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { StatusChip } from "@/components/StatusChip";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatDate, formatKES, getInitials } from "@/lib/utils";

export default function StaffDetailsPage() {
  const params = useParams();
  const id = params?.id;

  if (!id) return <Typography sx={{ p: 3 }}>Loading...</Typography>;

  return (
    <DashboardLayout>
      <PageGuard permission="staff.view">
        <StaffDetailContent id={id} />
      </PageGuard>
    </DashboardLayout>
  );
}

function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function StaffDetailContent({ id }) {
  const router = useRouter();
  const { data: staff, loading, error, refetch } = useAsync(() => api.getStaffById(id), [id]);
  const [tab, setTab] = useState(0);

  return (
    <DataState loading={loading} error={error} data={staff} onRetry={refetch}>
      {(s) => (
        <>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/staff")}
            sx={{ mb: 2 }}
          >
            Back to Staff
          </Button>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
                <Avatar
                  src={s.photoUrl}
                  alt={s.name}
                  sx={{ width: 84, height: 84, fontSize: 28, bgcolor: "secondary.main" }}
                >
                  {getInitials(s.name || "Staff")}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography variant="h5">{s.name}</Typography>
                    <Chip
                      size="small"
                      label={s.staffNumber || "No ID"}
                      sx={{ fontFamily: "monospace" }}
                    />
                    <StatusChip status={s.is_active ? "active" : "inactive"} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {s.designation || "Staff"} · {s.role} · {s.phone}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label="Personal Info" />
              <Tab label="Teaching Load" disabled />
              <Tab label="Timetable" disabled />
            </Tabs>
            <CardContent>{tab === 0 && <PersonalTab s={s} />}</CardContent>
          </Card>
        </>
      )}
    </DataState>
  );
}

function PersonalTab({ s }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Employment Details
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <Field label="Staff Number" value={s.staffNumber} />
        <Field label="Designation" value={s.designation} />
        <Field label="Role" value={s.role} />
        <Field label="Contract Type" value={s.contractType} />
        <Field label="Date of Birth" value={formatDate(s.dateOfBirth)} />
        <Field label="ID Number" value={s.idNumber} />
        <Field label="Basic Salary" value={formatKES(s.basic_salary)} />
        <Field label="Status" value={s.is_active ? "Active" : "Inactive"} />
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Contact Information
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <Field label="Phone" value={s.phone} />
        <Field label="Email" value={s.email} />
      </Box>
    </Box>
  );
}
