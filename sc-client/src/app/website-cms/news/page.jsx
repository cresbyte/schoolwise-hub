"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { DataState } from "@/components/DataState";
import { format } from "date-fns";
import { useNotification } from "@/context/NotificationContext";

export default function NewsCmsPage() {
  const [tab, setTab] = useState(0);
  const { data: news, loading: nl, refetch: rn } = useAsync(api.getCmsNews);
  const { data: events, loading: el, refetch: re } = useAsync(api.getCmsEvents);
  const { showNotification } = useNotification();

  const [openNews, setOpenNews] = useState(false);
  const [newsForm, setNewsForm] = useState(null);
  const [openEvent, setOpenEvent] = useState(false);
  const [eventForm, setEventForm] = useState(null);

  const handleDeleteNews = async (slug) => {
    if (confirm("Delete this article?")) {
      await api.deleteNewsArticle(slug);
      showNotification("Article deleted", "success");
      rn();
    }
  };

  const handleDeleteEvent = async (id) => {
    if (confirm("Delete this event?")) {
      await api.deleteEvent(id);
      showNotification("Event deleted", "success");
      re();
    }
  };

  const handleSaveNews = async () => {
    if (newsForm.slug) {
      await api.updateNewsArticle(newsForm.slug, newsForm);
      showNotification("Article updated", "success");
    } else {
      await api.createNewsArticle({ ...newsForm, slug: newsForm.title.toLowerCase().replace(/ /g, "-") });
      showNotification("Article created", "success");
    }
    setOpenNews(false);
    rn();
  };

  const handleSaveEvent = async () => {
    if (eventForm.id) {
      await api.updateEvent(eventForm.id, eventForm);
      showNotification("Event updated", "success");
    } else {
      await api.createEvent(eventForm);
      showNotification("Event created", "success");
    }
    setOpenEvent(false);
    re();
  };

  return (
    <DashboardLayout>
      <RoleGuard permission="settings.view">
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>News & Events</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Manage public announcements and the school calendar.
          </Typography>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
            <Tab label="News Articles" />
            <Tab label="Upcoming Events" />
          </Tabs>

          {tab === 0 && (
            <DataState loading={nl} data={news}>
              <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setNewsForm({ title: "", category: "News", date: format(new Date(), "yyyy-MM-dd"), author: "Admin", content: "", excerpt: "" }); setOpenNews(true); }}>
                  Create Article
                </Button>
              </Box>
              <TableContainer component={Card}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {news?.map((n) => (
                      <TableRow key={n.slug}>
                        <TableCell sx={{ fontWeight: 600 }}>{n.title}</TableCell>
                        <TableCell><Chip label={n.category} size="small" variant="outlined" /></TableCell>
                        <TableCell>{n.date}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" href={`/news/${n.slug}`} target="_blank"><VisibilityIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="primary" onClick={() => { setNewsForm(n); setOpenNews(true); }}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteNews(n.slug)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DataState>
          )}

          {tab === 1 && (
            <DataState loading={el} data={events}>
              <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEventForm({ title: "", date: format(new Date(), "MMM dd, yyyy"), time: "8:00 AM", location: "School Hall" }); setOpenEvent(true); }}>
                  Add Event
                </Button>
              </Box>
              <TableContainer component={Card}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events?.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{e.title}</TableCell>
                        <TableCell>{e.date}</TableCell>
                        <TableCell>{e.location}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => { setEventForm(e); setOpenEvent(true); }}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteEvent(e.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DataState>
          )}
        </Box>

        {/* News Dialog */}
        <Dialog open={openNews} onClose={() => setOpenNews(false)} fullWidth maxWidth="md">
          <DialogTitle>{newsForm?.slug ? "Edit Article" : "Create Article"}</DialogTitle>
          <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Title" fullWidth value={newsForm?.title || ""} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField select label="Category" fullWidth value={newsForm?.category || "News"} onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}>
                {["News", "Events", "Achievements", "Announcements"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField label="Date" type="date" fullWidth value={newsForm?.date || ""} onChange={(e) => setNewsForm({ ...newsForm, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            </Box>
            <TextField label="Author" fullWidth value={newsForm?.author || ""} onChange={(e) => setNewsForm({ ...newsForm, author: e.target.value })} />
            <TextField label="Excerpt" fullWidth multiline rows={2} value={newsForm?.excerpt || ""} onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })} />
            <TextField label="Content" multiline rows={6} fullWidth value={newsForm?.content || ""} onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNews(false)}>Cancel</Button>
            <Button onClick={handleSaveNews} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

        {/* Event Dialog */}
        <Dialog open={openEvent} onClose={() => setOpenEvent(false)} fullWidth maxWidth="sm">
          <DialogTitle>{eventForm?.id ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Event Title" fullWidth value={eventForm?.title || ""} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
            <TextField label="Date (e.g. June 15, 2026)" fullWidth value={eventForm?.date || ""} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
            <TextField label="Time" fullWidth value={eventForm?.time || ""} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} />
            <TextField label="Location" fullWidth value={eventForm?.location || ""} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEvent(false)}>Cancel</Button>
            <Button onClick={handleSaveEvent} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </RoleGuard>
    </DashboardLayout>
  );
}
