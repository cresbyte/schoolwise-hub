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

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Link from "next/link";
import { useState } from "react";

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
  const integrations = useAsync(() => api.getIntegrationsStatus(), []);

  return (
    <>
      <PageHeader title="School Settings" subtitle="Manage your school profile" />
      <DataState loading={loading || integrations.loading} error={error} data={data} onRetry={refetch}>
        {(school) => <SettingsForm school={school} integrations={integrations.data || {}} />}
      </DataState>
    </>
  );
}

/** Editable settings form. */
function SettingsForm({ school, integrations }) {
  const { showNotification } = useNotification();
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, isDirty } } = useForm({ defaultValues: school });
  const [tab, setTab] = useState(0);

  useEffect(() => reset(school), [school, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await api.updateSchoolSettings(values);
    showNotification("School settings saved", "success");
    reset(values);
  });

  const enabledPaymentMethods = watch("enabledPaymentMethods") || [];

  const handlePaymentMethodToggle = (method) => {
    if (enabledPaymentMethods.includes(method)) {
      setValue("enabledPaymentMethods", enabledPaymentMethods.filter((m) => m !== method), { shouldDirty: true });
    } else {
      setValue("enabledPaymentMethods", [...enabledPaymentMethods, method], { shouldDirty: true });
    }
  };

  return (
    <Card component="form" onSubmit={onSubmit}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="General" />
        <Tab label="Contact" />
        <Tab label="Academic & School Type" />
        <Tab label="Payments" />
        <Tab label="Notifications" />
      </Tabs>
      <CardContent sx={{ pt: 3 }}>
        {tab === 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>School Identity</Typography>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              <TextField label="School Name" size="small" {...register("name")} />
              <TextField label="Motto" size="small" {...register("motto")} />
              <TextField label="Registration Number" size="small" {...register("registrationNumber")} />
              <TextField label="KNEC Code" size="small" {...register("knecCode")} />
              <TextField label="NEMIS Code" size="small" {...register("nemisCode")} />
              <TextField label="Principal" size="small" {...register("principalName")} />
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Contact</Typography>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              <TextField label="Phone" size="small" {...register("phone")} />
              <TextField label="Email" size="small" {...register("email")} />
              <TextField label="Website" size="small" {...register("website")} />
              <TextField label="Postal Address" size="small" {...register("postalAddress")} />
              <TextField label="Physical Address" size="small" {...register("physicalAddress")} />
              <TextField label="County" size="small" {...register("county")} />
              <TextField label="Sub-County" size="small" {...register("subCounty")} />
            </Box>
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Academic Details</Typography>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              <TextField select label="School Type" size="small" defaultValue={school.schoolType || "day"} {...register("schoolType")}>
                <MenuItem value="day">Day School</MenuItem>
                <MenuItem value="boarding">Boarding School</MenuItem>
                <MenuItem value="both">Day & Boarding</MenuItem>
              </TextField>
              <TextField select label="Academic System" size="small" defaultValue={school.academicSystem || "CBC"} {...register("academicSystem")}>
                <MenuItem value="CBC">CBC</MenuItem>
                <MenuItem value="844">8-4-4</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </TextField>
              <TextField label="Current Term" size="small" type="number" {...register("currentTerm")} />
              <TextField label="Current Year" size="small" type="number" {...register("currentYear")} />
              <TextField label="Term Start" size="small" type="date" slotProps={{ inputLabel: { shrink: true } }} {...register("termStartDate")} />
              <TextField label="Term End" size="small" type="date" slotProps={{ inputLabel: { shrink: true } }} {...register("termEndDate")} />
            </Box>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Manage Academic Resources</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              Classes, streams, and subjects are managed in their respective modules.
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button component={Link} href="/classes" variant="outlined">Manage Classes & Streams</Button>
              <Button component={Link} href="/subjects" variant="outlined">Manage Subjects</Button>
            </Box>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Principal Report Card Comments</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>These templates are used to auto-fill principal comments on report cards based on performance levels.</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Excellent (80%+)" size="small" fullWidth multiline rows={2} {...register("reportCommentTemplates.excellent")} />
              <TextField label="Good (60-79%)" size="small" fullWidth multiline rows={2} {...register("reportCommentTemplates.good")} />
              <TextField label="Average (40-59%)" size="small" fullWidth multiline rows={2} {...register("reportCommentTemplates.average")} />
              <TextField label="Below Average (<40%)" size="small" fullWidth multiline rows={2} {...register("reportCommentTemplates.belowAverage")} />
            </Box>
          </Box>
        )}

        {tab === 3 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Payments Information</Typography>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mb: 3 }}>
              <TextField label="Currency" size="small" {...register("currency")} />
              <TextField label="Bank Name" size="small" {...register("bankName")} />
              <TextField label="Bank Branch" size="small" {...register("bankBranch")} />
              <TextField label="Account Number" size="small" {...register("accountNumber")} />
              <TextField label="M-Pesa Paybill" size="small" {...register("paybillNumber")} />
              <TextField label="M-Pesa Till" size="small" {...register("mpesaTill")} />
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Enabled Payment Methods</Typography>
            <FormGroup row>
              <FormControlLabel control={<Checkbox checked={enabledPaymentMethods.includes("mpesa")} onChange={() => handlePaymentMethodToggle("mpesa")} />} label="M-Pesa" />
              <FormControlLabel control={<Checkbox checked={enabledPaymentMethods.includes("bank")} onChange={() => handlePaymentMethodToggle("bank")} />} label="Bank Transfer" />
              <FormControlLabel control={<Checkbox checked={enabledPaymentMethods.includes("cash")} onChange={() => handlePaymentMethodToggle("cash")} />} label="Cash" />
              <FormControlLabel control={<Checkbox checked={enabledPaymentMethods.includes("cheque")} onChange={() => handlePaymentMethodToggle("cheque")} />} label="Cheque" />
            </FormGroup>
          </Box>
        )}

        {tab === 4 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Notifications & Integrations</Typography>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mb: 3 }}>
              <TextField label="Email From Name" size="small" {...register("emailFromName")} />
              <TextField label="Email From Address" size="small" {...register("emailFromAddress")} />
              <TextField label="SMS Sender ID" size="small" {...register("smsSenderId")} />
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Integration Status (Read-Only)</Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
              <Chip label={`Email: ${integrations?.emailConfigured ? "Configured" : "Not configured"}`} color={integrations?.emailConfigured ? "success" : "default"} />
              <Chip label={`M-Pesa: ${integrations?.mpesaConfigured ? "Configured" : "Not configured"}`} color={integrations?.mpesaConfigured ? "success" : "default"} />
              <Chip label={`SMS: ${integrations?.smsConfigured ? "Configured" : "Not configured"}`} color={integrations?.smsConfigured ? "success" : "default"} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              * Active credentials must be configured securely on the server environment. This system uses values from `.env` directly.
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={() => reset(school)} disabled={!isDirty}>Reset</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || !isDirty}>{isSubmitting ? "Saving…" : "Save Changes"}</Button>
        </Box>
      </CardContent>
    </Card>
  );
}
