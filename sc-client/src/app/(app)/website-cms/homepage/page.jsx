"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import SaveIcon from "@mui/icons-material/Save";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { DataState } from "@/components/DataState";
import { useNotification } from "@/context/NotificationContext";

export default function HomepageCmsPage() {
  const [tab, setTab] = useState(0);
  const { showNotification } = useNotification();

  const { data: slides, loading: sl, refetch: rs } = useAsync(api.getCmsHeroSlides);
  const { data: stats, loading: stl, refetch: rst } = useAsync(api.getCmsSchoolStats);
  const { data: features, loading: fl, refetch: rf } = useAsync(api.getCmsWhyChooseUs);

  const [localStats, setLocalStats] = useState([]);
  const [localFeatures, setLocalFeatures] = useState([]);

  useEffect(() => {
    if (stats) setLocalStats(stats);
  }, [stats]);

  useEffect(() => {
    if (features) setLocalFeatures(features);
  }, [features]);

  const handleUpdateSlide = async (id, patch) => {
    await api.updateHeroSlide(id, patch);
    showNotification("Slide updated", "success");
    rs();
  };

  const handleSaveStats = async () => {
    await api.updateSchoolStats(localStats);
    showNotification("Statistics updated", "success");
    rst();
  };

  const handleSaveFeatures = async () => {
    await api.updateWhyChooseUs(localFeatures);
    showNotification("Features updated", "success");
    rf();
  };

  return (
    <DashboardLayout>
      <RoleGuard permission="settings.view">
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Homepage Content</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Edit the key sections of your school homepage.
          </Typography>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 4, borderBottom: 1, borderColor: "divider" }}>
            <Tab label="Hero Slides" />
            <Tab label="School Stats" />
            <Tab label="Why Choose Us" />
          </Tabs>

          {tab === 0 && (
            <DataState loading={sl} data={slides}>
              <Stack spacing={4}>
                {slides?.map((slide) => (
                  <Card key={slide.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 700 }}>Slide {slide.id}</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField label="Title" fullWidth size="small" defaultValue={slide.title} onBlur={(e) => handleUpdateSlide(slide.id, { title: e.target.value })} sx={{ mb: 2 }} />
                          <TextField label="Subtitle" fullWidth size="small" multiline rows={2} defaultValue={slide.subtitle} onBlur={(e) => handleUpdateSlide(slide.id, { subtitle: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField label="CTA Label" fullWidth size="small" defaultValue={slide.cta?.label} onBlur={(e) => handleUpdateSlide(slide.id, { cta: { ...slide.cta, label: e.target.value } })} sx={{ mb: 2 }} />
                          <TextField label="Image URL" fullWidth size="small" defaultValue={slide.image} onBlur={(e) => handleUpdateSlide(slide.id, { image: e.target.value })} />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </DataState>
          )}

          {tab === 1 && (
            <DataState loading={stl} data={stats}>
              <Box>
                <Grid container spacing={2}>
                  {(localStats.length > 0 ? localStats : stats || []).map((stat, idx) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                      <Card variant="outlined">
                        <CardContent>
                          <TextField label="Label" fullWidth size="small" value={stat.label} onChange={(e) => {
                            const ns = [...(localStats.length > 0 ? localStats : stats)];
                            ns[idx].label = e.target.value;
                            setLocalStats(ns);
                          }} sx={{ mb: 2 }} />
                          <Stack direction="row" spacing={1}>
                            <TextField label="Value" fullWidth size="small" type="number" value={stat.value} onChange={(e) => {
                              const ns = [...(localStats.length > 0 ? localStats : stats)];
                              ns[idx].value = parseFloat(e.target.value);
                              setLocalStats(ns);
                            }} />
                            <TextField label="Suffix" sx={{ width: 80 }} size="small" value={stat.suffix} onChange={(e) => {
                              const ns = [...(localStats.length > 0 ? localStats : stats)];
                              ns[idx].suffix = e.target.value;
                              setLocalStats(ns);
                            }} />
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Button variant="contained" startIcon={<SaveIcon />} sx={{ mt: 3 }} onClick={handleSaveStats}>Save Statistics</Button>
              </Box>
            </DataState>
          )}

          {tab === 2 && (
            <DataState loading={fl} data={features}>
              <Box>
                <Grid container spacing={3}>
                  {(localFeatures.length > 0 ? localFeatures : features || []).map((f, idx) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                      <Card variant="outlined">
                        <CardContent>
                          <TextField label="Title" fullWidth size="small" value={f.title} onChange={(e) => {
                            const nf = [...(localFeatures.length > 0 ? localFeatures : features)];
                            nf[idx].title = e.target.value;
                            setLocalFeatures(nf);
                          }} sx={{ mb: 2 }} />
                          <TextField label="Description" fullWidth size="small" multiline rows={3} value={f.description} onChange={(e) => {
                            const nf = [...(localFeatures.length > 0 ? localFeatures : features)];
                            nf[idx].description = e.target.value;
                            setLocalFeatures(nf);
                          }} sx={{ mb: 2 }} />
                          <TextField label="Icon Name (Material)" fullWidth size="small" value={f.icon} onChange={(e) => {
                            const nf = [...(localFeatures.length > 0 ? localFeatures : features)];
                            nf[idx].icon = e.target.value;
                            setLocalFeatures(nf);
                          }} />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Button variant="contained" startIcon={<SaveIcon />} sx={{ mt: 3 }} onClick={handleSaveFeatures}>Save Features</Button>
              </Box>
            </DataState>
          )}
        </Box>
      </RoleGuard>
    </DashboardLayout>
  );
}
