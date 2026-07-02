"use client";

/**
 * School settings: editable school profile and term info.
 * @module settings/page
 */
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}

/** School settings content. */
function SettingsContent() {
  const { data, loading, error, refetch } = useAsync(() => api.getSchoolSettings(), []);
  return (
    <>
      <PageHeader title="School Settings" subtitle="Manage your school profile" />
      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {(school) => <SettingsForm school={school} />}
      </DataState>
    </>
  );
}

/** Editable settings form. */
function SettingsForm({ school }) {
  const { showNotification } = useNotification();
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm({ defaultValues: school });
  useEffect(() => reset(school), [school, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await api.updateSchoolSettings(values);
    showNotification("School settings saved", "success");
    reset(values);
  });

  return (
    <Card component="form" onSubmit={onSubmit}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>School Identity</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <TextField label="School Name" size="small" {...register("name")} />
          <TextField label="Motto" size="small" {...register("motto")} />
          <TextField label="Registration Number" size="small" {...register("registrationNumber")} />
          <TextField label="KNEC Code" size="small" {...register("knecCode")} />
          <TextField label="NEMIS Code" size="small" {...register("nemisCode")} />
          <TextField label="Principal" size="small" {...register("principalName")} />
        </Box>
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Contact</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <TextField label="Phone" size="small" {...register("phone")} />
          <TextField label="Email" size="small" {...register("email")} />
          <TextField label="Postal Address" size="small" {...register("postalAddress")} />
          <TextField label="Physical Address" size="small" {...register("physicalAddress")} />
          <TextField label="County" size="small" {...register("county")} />
          <TextField label="Sub-County" size="small" {...register("subCounty")} />
        </Box>
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Payments & Term</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <TextField label="M-Pesa Paybill" size="small" {...register("mpesaPaybill")} />
          <TextField label="M-Pesa Till" size="small" {...register("mpesaTill")} />
          <TextField label="Current Term" size="small" type="number" {...register("currentTerm")} />
          <TextField label="Current Year" size="small" type="number" {...register("currentYear")} />
          <TextField label="Term Start" size="small" type="date" slotProps={{ inputLabel: { shrink: true } }} {...register("termStartDate")} />
          <TextField label="Term End" size="small" type="date" slotProps={{ inputLabel: { shrink: true } }} {...register("termEndDate")} />
        </Box>
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Principal Report Card Comments</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>These templates are used to auto-fill principal comments on report cards based on performance levels.</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Excellent (80%+)" size="small" fullWidth multiline rows={2} {...register("config.comments.excellent" as any)} />
          <TextField label="Good (60-79%)" size="small" fullWidth multiline rows={2} {...register("config.comments.good" as any)} />
          <TextField label="Average (40-59%)" size="small" fullWidth multiline rows={2} {...register("config.comments.average" as any)} />
          <TextField label="Below Average (<40%)" size="small" fullWidth multiline rows={2} {...register("config.comments.belowAverage" as any)} />
        </Box>
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={() => reset(school)} disabled={!isDirty}>Reset</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || !isDirty}>{isSubmitting ? "Saving…" : "Save Changes"}</Button>
        </Box>
      </CardContent>
    </Card>
  );
}
