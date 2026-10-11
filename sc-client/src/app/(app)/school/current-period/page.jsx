"use client";

import { Card, Stack, Typography, Chip, Divider, Box } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import SchoolIcon from "@mui/icons-material/School";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { schoolApi, YEAR_STATUS } from "@/lib/schoolApi";

export default function CurrentPeriodPage() {
  return (
    <>
      <PageGuard permission="school.view">
        <CurrentPeriodContent />
      </PageGuard>
    </>
  );
}

function CurrentPeriodContent() {
  const { data, loading, error, refetch } = useAsync(
    () => schoolApi.getCurrentPeriod(),
    []
  );

  const year = data?.academic_year;
  const term = data?.term;

  return (
    <>
      <PageHeader
        title="Current period"
        subtitle="The academic year and term that the school is currently running."
      />
      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() => (
          <Stack spacing={3} direction={{ xs: "column", md: "row" }}>
            <Card sx={{ p: 3, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <SchoolIcon color="primary" />
                <Typography variant="h6">Academic year</Typography>
              </Stack>
              {year ? (
                <>
                  <Typography variant="h4" gutterBottom>
                    {year.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {year.start_date} → {year.end_date}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={YEAR_STATUS[year.status]?.label || year.status}
                      color={YEAR_STATUS[year.status]?.color || "default"}
                      size="small"
                    />
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">No active academic year.</Typography>
              )}
            </Card>

            <Card sx={{ p: 3, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <EventIcon color="secondary" />
                <Typography variant="h6">Current term</Typography>
              </Stack>
              {term ? (
                <>
                  <Typography variant="h4" gutterBottom>
                    Term {term.number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {term.start_date} → {term.end_date}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip label="Current" color="success" size="small" />
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">
                  No current term set (e.g. holiday / break).
                </Typography>
              )}
            </Card>
          </Stack>
        )}
      </DataState>
    </>
  );
}
