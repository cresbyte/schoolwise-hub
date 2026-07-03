/**
 * Responsive website image with cover fit and optional overlay.
 * @module ImagePlaceholder
 */
import Box from "@mui/material/Box";

/** Props for {@link ImagePlaceholder}. */
export interface ImagePlaceholderProps {
  src: string;
  alt: string;
  aspectRatio?: string;
  height?: number | string;
  borderRadius?: number;
  priority?: boolean;
  overlay?: boolean;
}

/**
 * Renders a cover-fit image for card, banner, and gallery layouts.
 * @param props - Image source, accessibility label, and layout options
 */
export function ImagePlaceholder({
  src,
  alt,
  aspectRatio = "16/9",
  height,
  borderRadius = 0,
  priority = false,
  overlay = false,
}: ImagePlaceholderProps) {
  return (
    <Box
      sx={{
        width: "100%",
        height: height ?? "auto",
        aspectRatio: height ? undefined : aspectRatio,
        borderRadius,
        position: "relative",
        overflow: "hidden",
        bgcolor: "grey.200",
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          ...(height ? { position: "absolute", inset: 0 } : {}),
        }}
      />
      {overlay && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.25) 100%)",
            pointerEvents: "none",
          }}
        />
      )}
    </Box>
  );
}
