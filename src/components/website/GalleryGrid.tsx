/**
 * Filterable gallery grid with lightbox modal.
 * @module GalleryGrid
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { ImagePlaceholder } from "./ImagePlaceholder";
import type { GalleryItem } from "@/lib/website/data";

const FILTERS = ["All", "Campus", "Sports", "Arts", "Events", "Classroom"] as const;

/** Props for {@link GalleryGrid}. */
export interface GalleryGridProps {
  items: GalleryItem[];
  showFilters?: boolean;
  limit?: number;
}

/**
 * Responsive masonry-style gallery with album filters and lightbox.
 * @param props - Gallery items, filter toggle, and optional item limit
 */
export function GalleryGrid({ items, showFilters = true, limit }: GalleryGridProps) {
  const [filter, setFilter] = useState<string>("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = filter === "All" ? items : items.filter((i) => i.album === filter);
  const displayed = limit ? filtered.slice(0, limit) : filtered;

  const aspectMap = { landscape: "16/10", portrait: "3/4", square: "1/1" };

  return (
    <>
      {showFilters && (
        <Tabs
          value={filter}
          onChange={(_, v) => setFilter(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {FILTERS.map((f) => (
            <Tab key={f} label={f} value={f} sx={{ textTransform: "none", fontWeight: 600 }} />
          ))}
        </Tabs>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        {displayed.map((item, idx) => (
          <Box
            key={item.id}
            onClick={() => setLightbox(idx)}
            sx={{
              cursor: "pointer",
              borderRadius: 2,
              overflow: "hidden",
              position: "relative",
              "&:hover": { opacity: 0.9 },
            }}
          >
            <ImagePlaceholder
              src={item.image}
              aspectRatio={aspectMap[item.aspect]}
              alt={item.title}
              borderRadius={0}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                p: 1.5,
                background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              }}
            >
              <Typography variant="caption" sx={{ color: "common.white", fontWeight: 600 }}>
                {item.title}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Dialog open={lightbox !== null} onClose={() => setLightbox(null)} maxWidth="md" fullWidth>
        {lightbox !== null && displayed[lightbox] && (
          <DialogContent sx={{ p: 0, position: "relative" }}>
            <IconButton
              onClick={() => setLightbox(null)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 1,
                bgcolor: "rgba(0,0,0,0.5)",
                color: "common.white",
              }}
            >
              <CloseIcon />
            </IconButton>
            <ImagePlaceholder
              src={displayed[lightbox].image}
              height={480}
              alt={displayed[lightbox].title}
              borderRadius={0}
            />
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">{displayed[lightbox].title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {displayed[lightbox].album}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setLightbox((i) => (i! - 1 + displayed.length) % displayed.length)}
              sx={{ position: "absolute", left: 8, top: "50%" }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={() => setLightbox((i) => (i! + 1) % displayed.length)}
              sx={{ position: "absolute", right: 8, top: "50%" }}
            >
              <ChevronRightIcon />
            </IconButton>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
