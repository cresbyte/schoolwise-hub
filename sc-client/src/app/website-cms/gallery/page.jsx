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
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { DataState } from "@/components/DataState";
import { useNotification } from "@/context/NotificationContext";

export default function GalleryCmsPage() {
  const { data: items, loading, refetch } = useAsync(api.getCmsGallery);
  const { showNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [filter, setFilter] = useState("All");

  const albums = ["All", ...Array.from(new Set(items?.map((i) => i.album) || []))];
  const filtered = filter === "All" ? items : items?.filter((i) => i.album === filter);

  const handleDelete = async (id) => {
    if (confirm("Delete this photo?")) {
      await api.deleteGalleryItem(id);
      showNotification("Item deleted", "success");
      refetch();
    }
  };

  const handleSave = async () => {
    if (form.id) {
      await api.updateGalleryItem(form.id, form);
      showNotification("Item updated", "success");
    } else {
      await api.createGalleryItem({ ...form, id: `gal-${Date.now()}` });
      showNotification("Item added", "success");
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
              <Typography variant="h4" sx={{ fontWeight: 700 }}>Gallery Manager</Typography>
              <Typography variant="body2" color="text.secondary">Manage photos for the public gallery.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ title: "", album: "Campus", image: "", aspect: "landscape" }); setOpen(true); }}>
              Add Photo
            </Button>
          </Box>

          <Box sx={{ mb: 3, display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
            {albums.map((a) => (
              <Chip key={a} label={a} onClick={() => setFilter(a)} color={filter === a ? "primary" : "default"} variant={filter === a ? "filled" : "outlined"} />
            ))}
          </Box>

          <DataState loading={loading} data={items}>
            <Grid container spacing={3}>
              {filtered?.map((item) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                  <Card sx={{ height: "100%" }}>
                    <Box sx={{ height: 180, bgcolor: "action.hover", backgroundImage: `url(${item.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.album}</Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" color="primary" onClick={() => { setForm(item); setOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteIcon fontSize="small" /></IconButton>
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
          <DialogTitle>{form?.id ? "Edit Photo" : "Add Photo"}</DialogTitle>
          <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Title" fullWidth value={form?.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField select label="Album" fullWidth value={form?.album || "Campus"} onChange={(e) => setForm({ ...form, album: e.target.value })}>
              {["Campus", "Sports", "Arts", "Events", "Classroom"].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
            <TextField select label="Aspect Ratio" fullWidth value={form?.aspect || "landscape"} onChange={(e) => setForm({ ...form, aspect: e.target.value })}>
              {["landscape", "portrait", "square"].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
            <TextField label="Image URL" fullWidth value={form?.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
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
