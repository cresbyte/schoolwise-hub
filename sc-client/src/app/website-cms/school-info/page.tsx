"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import SaveIcon from "@mui/icons-material/Save";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { DataState } from "@/components/DataState";
import { useNotification } from "@/context/NotificationContext";

export default function SchoolInfoCmsPage() {
  const { data: info, loading, refetch } = useAsync(api.getCmsSchoolInfo);
  const { showNotification } = useNotification();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (info) setForm(info);
  }, [info]);

  const handleSave = async () => {
    await api.updateSchoolInfo(form);
    showNotification("School identity updated successfully", "success");
    refetch();
  };

  return (
    <DashboardLayout>
      <RoleGuard permission="settings.view">
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>School Identity</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Manage core school information and contact details across the website.
          </Typography>

          <DataState loading={loading} data={info}>
            <Card sx={{ maxWidth: 900 }}>
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Basic Information</Typography>
                    <Stack spacing={2}>
                      <TextField label="Full School Name" fullWidth value={form?.name || ""} onChange={(e) => setForm({...form, name: e.target.value})} />
                      <TextField label="Short Name" fullWidth value={form?.shortName || ""} onChange={(e) => setForm({...form, shortName: e.target.value})} />
                      <TextField label="Motto" fullWidth value={form?.motto || ""} onChange={(e) => setForm({...form, motto: e.target.value})} />
                      <TextField label="Tagline" fullWidth value={form?.tagline || ""} onChange={(e) => setForm({...form, tagline: e.target.value})} />
                      <TextField label="Founded Year" fullWidth value={form?.founded || ""} onChange={(e) => setForm({...form, founded: e.target.value})} />
                      <TextField label="KNEC Code" fullWidth value={form?.knecCode || ""} onChange={(e) => setForm({...form, knecCode: e.target.value})} />
                    </Stack>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Contact & Location</Typography>
                    <Stack spacing={2}>
                      <TextField label="Address" fullWidth value={form?.address || ""} onChange={(e) => setForm({...form, address: e.target.value})} />
                      <TextField label="Postal Address" fullWidth value={form?.postal || ""} onChange={(e) => setForm({...form, postal: e.target.value})} />
                      <TextField label="Phone Number" fullWidth value={form?.phone || ""} onChange={(e) => setForm({...form, phone: e.target.value})} />
                      <TextField label="WhatsApp Number" fullWidth value={form?.whatsapp || ""} onChange={(e) => setForm({...form, whatsapp: e.target.value})} />
                      <TextField label="Primary Email" fullWidth value={form?.email || ""} onChange={(e) => setForm({...form, email: e.target.value})} />
                      <TextField label="Admissions Email" fullWidth value={form?.admissionsEmail || ""} onChange={(e) => setForm({...form, admissionsEmail: e.target.value})} />
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Administration</Typography>
                    <TextField label="Principal Name" fullWidth value={form?.principal || ""} onChange={(e) => setForm({...form, principal: e.target.value})} />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                      <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave}>
                        Save All Changes
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </DataState>
        </Box>
      </RoleGuard>
    </DashboardLayout>
  );
}
