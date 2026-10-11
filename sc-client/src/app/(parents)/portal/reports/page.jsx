"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import { ChildSelector } from "@/components/portal/ChildSelector";
import { ReportCard } from "@/components/exams/ReportCard";
import { useAsync } from "@/hooks/useAsync";
import { portalApi } from "@/lib/portalApi";

export default function PortalReportsPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <PortalReportsContent />
    </Suspense>
  );
}

function PortalReportsContent() {
  const searchParams = useSearchParams();
  const initialChild = searchParams.get("child") || "";

  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState(initialChild);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    portalApi.getChildren().then((kids) => {
      const list = Array.isArray(kids) ? kids : [];
      setChildren(list);
      if (!childId && list.length > 0) setChildId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset report detail view when child changes
  useEffect(() => {
    setSelectedExam(null);
  }, [childId]);

  const { data: exams, loading } = useAsync(async () => {
    if (!childId) return [];
    const list = await portalApi.getExamsForStudent(childId);
    return (Array.isArray(list) ? list : []).filter((e) => e.status === "released");
  }, [childId]);

  const child = children.find((c) => c.id === childId);

  const { data: reportCard, loading: cardLoading } = useAsync(async () => {
    if (!childId || !selectedExam) return null;
    return portalApi.getStudentReportCard(childId, selectedExam.id);
  }, [childId, selectedExam]);

  return (
    <Stack spacing={2.5}>
      {/* Child Switcher */}
      <ChildSelector
        children={children}
        selectedId={childId}
        onSelect={(id) => {
          setChildId(id);
          setSelectedExam(null);
        }}
      />

      {/* If an exam is selected, render the Mobile Detail View (NO DIALOG) */}
      {selectedExam ? (
        <Box>
          {/* Mobile Back Header Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 2.5,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setSelectedExam(null)}
              size="small"
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              All Reports
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              disabled={!reportCard}
              onClick={() =>
                window.open(`/print/exam/${selectedExam.id}/student/${childId}`, "_blank")
              }
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Download PDF
            </Button>
          </Paper>

          {/* Report Card Viewer */}
          {cardLoading || !reportCard ? (
            <Card sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
              <CircularProgress size={36} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Loading academic report for {child?.name}...
              </Typography>
            </Card>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <ReportCard card={reportCard} />
            </Box>
          )}
        </Box>
      ) : (
        /* Report Cards List */
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Published Academic Reports
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Official assessment records published by the school for {child?.name || "your child"}
            </Typography>
          </Box>

          {loading ? (
            <LinearProgress sx={{ borderRadius: 1 }} />
          ) : !exams || exams.length === 0 ? (
            <Card sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
              <Typography variant="body1" color="text.secondary">
                No report cards have been released yet for this term.
              </Typography>
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {exams.map((exam) => (
                <Card
                  key={exam.id}
                  elevation={1}
                  sx={{
                    borderRadius: 2.5,
                    border: 1,
                    borderColor: "divider",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    "&:hover": { boxShadow: 3 },
                  }}
                >
                  <CardActionArea
                    onClick={() => setSelectedExam(exam)}
                    sx={{ p: { xs: 2, sm: 2.5 } }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          bgcolor: "primary.light",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <DescriptionIcon />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                          {exam.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
                          {exam.termLabel || exam.term || "Academic Term"}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        color="success"
                        label="Released"
                        sx={{ fontWeight: 700, height: 22, fontSize: "0.7rem" }}
                      />
                      <ArrowForwardIosIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                    </Stack>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Stack>
  );
}
