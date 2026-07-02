"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { DataState } from "@/components/DataState";
import { useNotification } from "@/context/NotificationContext";

const GRADIENTS = [
  "linear-gradient(135deg, #1565C0 0%, #1976D2 100%)",
  "linear-gradient(135deg, #2E7D32 0%, #43A047 100%)",
  "linear-gradient(135deg, #C62828 0%, #E53935 100%)",
  "linear-gradient(135deg, #6A1B9A 0%, #8E24AA 100%)",
  "linear-gradient(135deg, #EF6C00 0%, #FB8C00 100%)",
];

export default function TestimonialsCmsPage() {
  const { data: testimonials, loading, refetch } = useAsync(api.getCmsTestimonials);
  const { showNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this testimonial?")) {
      await api.deleteTestimonial(id);
      showNotification("Testimonial deleted", "success");
      refetch();
    }
  };

  const handleSave = async () => {
    if (form.id) {
      await api.updateTestimonial(form.id, form);
      showNotification("Testimonial updated", "success");
    } else {
      await api.createTestimonial({ ...form, id: `test-${Date.now()}` });
      showNotification("Testimonial added", "success");
    }
    setOpen(false);
    refetch();
  };

  return (
    <DashboardLayout>
      <RoleGuard permission="settings.view">
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>Testimonials</Typography>
              <Typography variant="body2" color="text.secondary">What parents and alumni say about Primrose.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ name: "", role: "Parent", quote: "", gradient: GRADIENTS[0] }); setOpen(true); }}>
              Add Testimonial
            </Button>
          </Box>

          <DataState loading={loading} data={testimonials}>
            <Grid container spacing={3}>
              {testimonials?.map((t) => (
                <Grid size={{ xs: 12, sm: 6 }} key={t.id}>
                  <Card sx={{ height: "100%", position: "relative" }}>
                    <Box sx={{ height: 8, background: t.gradient }} />
                    <CardContent>
                      <FormatQuoteIcon sx={{ color: "primary.light", opacity: 0.3, fontSize: 40 }} />
                      <Typography variant="body1" sx={{ fontStyle: "italic", mb: 2, mt: -2 }}>
                        "{t.quote}"
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{t.role}</Typography>
                        </Box>
                        <Stack direction="row">
                          <IconButton size="small" color="primary" onClick={() => { setForm(t); setOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(t.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DataState>
        </Box>

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>{form?.id ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
          <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Name" fullWidth value={form?.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Role" fullWidth value={form?.role || ""} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Parent, Grade 4" />
            <TextField label="Testimonial" multiline rows={4} fullWidth value={form?.quote || ""} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
            <TextField select label="Accent Gradient" fullWidth value={form?.gradient || GRADIENTS[0]} onChange={(e) => setForm({ ...form, gradient: e.target.value })}>
              {GRADIENTS.map((g, i) => (
                <MenuItem key={i} value={g}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: 1, background: g }} />
                    Option {i + 1}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </RoleGuard>
    </DashboardLayout>
  );
}
