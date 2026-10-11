"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import ArticleIcon from "@mui/icons-material/Article";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import MailIcon from "@mui/icons-material/Mail";
import ForumIcon from "@mui/icons-material/Forum";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { DataState } from "@/components/DataState";
import { format } from "date-fns";

export default function WebsiteCmsOverview() {
  const { data: news, loading: nl } = useAsync(api.getCmsNews);
  const { data: contacts, loading: cl } = useAsync(() => api.getContactSubmissions("unread"));
  const { data: apps, loading: al } = useAsync(() => api.getApplications("pending"));
  const { data: gallery, loading: gl } = useAsync(api.getCmsGallery);

  const stats = [
    { label: "News Articles", value: news?.length ?? 0, icon: <ArticleIcon />, color: "primary.main", href: "/website-cms/news" },
    { label: "Gallery Photos", value: gallery?.length ?? 0, icon: <PhotoLibraryIcon />, color: "success.main", href: "/website-cms/gallery" },
    { label: "New Applications", value: apps?.length ?? 0, icon: <AssignmentIndIcon />, color: "warning.main", href: "/website-cms/applications" },
    { label: "Unread Messages", value: contacts?.length ?? 0, icon: <MailIcon />, color: "error.main", href: "/website-cms/contacts" },
  ];

  const sections = [
    { title: "News & Events", icon: <ArticleIcon />, href: "/website-cms/news", count: news?.length },
    { title: "Gallery", icon: <PhotoLibraryIcon />, href: "/website-cms/gallery", count: gallery?.length },
    { title: "Testimonials", icon: <ForumIcon />, href: "/website-cms/testimonials", count: "Managed" },
    { title: "Homepage Layout", icon: <HomeIcon />, href: "/website-cms/homepage", count: "Slides & Stats" },
    { title: "School Identity", icon: <BusinessIcon />, href: "/website-cms/school-info", count: "Contact & Info" },
    { title: "Admissions", icon: <AssignmentIndIcon />, href: "/website-cms/applications", count: apps?.length },
  ];

  const loading = nl || cl || al || gl;

  return (
    <DashboardLayout>
      <RoleGuard permission="settings.view">
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
            Website Manager
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Manage your school's public-facing website content and visitor submissions.
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
                <Card sx={{ height: "100%", transition: "0.3s", "&:hover": { transform: "translateY(-4px)", boxShadow: 4 } }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {loading ? "..." : stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.label}
                        </Typography>
                      </Box>
                      <Button component={Link} href={stat.href} variant="outlined" size="small" sx={{ textTransform: "none" }}>
                        View All
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Applications</Typography>
                    <Button component={Link} href="/website-cms/applications" size="small">View All</Button>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Grade</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {!apps || apps.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                              No pending applications.
                            </TableCell>
                          </TableRow>
                        ) : (
                          apps.slice(0, 5).map((app) => (
                            <TableRow key={app.id}>
                              <TableCell sx={{ fontWeight: 600 }}>{app.firstName} {app.lastName}</TableCell>
                              <TableCell>{app.gradeApplying}</TableCell>
                              <TableCell>
                                <Chip label={app.boardingType} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>{format(new Date(app.submittedAt), "MMM dd")}</TableCell>
                              <TableCell align="right">
                                <IconButton size="small" component={Link} href="/website-cms/applications">
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Management Sections</Typography>
                <Grid container spacing={2}>
                  {sections.map((sec) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={sec.title}>
                      <Card variant="outlined" sx={{ height: "100%", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                        <CardContent component={Link} href={sec.href} sx={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 2 }}>
                          <Box sx={{ color: "primary.main" }}>{sec.icon}</Box>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{sec.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{sec.count} items</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Recent Inquiries</Typography>
                  <Stack spacing={2}>
                    {!contacts || contacts.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                        All messages read.
                      </Typography>
                    ) : (
                      contacts.slice(0, 5).map((msg) => (
                        <Box key={msg.id} sx={{ p: 1.5, borderRadius: 1, bgcolor: "action.hover", borderLeft: 4, borderColor: "error.main" }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{msg.subject}</Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>{msg.name} — {msg.message}</Typography>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(msg.submittedAt), "MMM dd, h:mm a")}
                            </Typography>
                            <Button size="small" component={Link} href="/website-cms/contacts" sx={{ minWidth: 0, p: 0 }}>View</Button>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Stack>
                  <Button fullWidth variant="outlined" sx={{ mt: 2 }} component={Link} href="/website-cms/contacts">View All Messages</Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </RoleGuard>
    </DashboardLayout>
  );
}
