/**
 * School settings: editable school profile and term info.
 * @module routes/settings
 */
import { createFileRoute } from "@tanstack/react-router";
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
import * as api from "@/lib/mockApi";
import type { School } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "School Settings — SchuleSmart" }] }),
  component: () => (
    <DashboardLayout>
      <SettingsPage />
    </DashboardLayout>
  ),
});

/** School settings page. */
function SettingsPage() {
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
function SettingsForm({ school }: { school: School }) {
  const { showNotification } = useNotification();
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<School>({ defaultValues: school });
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
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={() => reset(school)} disabled={!isDirty}>Reset</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || !isDirty}>{isSubmitting ? "Saving…" : "Save Changes"}</Button>
        </Box>
      </CardContent>
    </Card>
  );
}