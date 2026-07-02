/**
 * Styled download button for parent resources and documents.
 * @module DownloadButton
 */
import Button from "@mui/material/Button";
import DownloadIcon from "@mui/icons-material/Download";

/** Props for {@link DownloadButton}. */
export interface DownloadButtonProps {
  title: string;
  fileType?: string;
  size?: string;
  onClick?: () => void;
}

/**
 * Download CTA button with mock download behaviour.
 * @param props - Document title and optional click handler
 */
export function DownloadButton({ title, fileType = "PDF", size, onClick }: DownloadButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    // Mock download — alert in lieu of real file
    window.alert(`Download started: ${title}.${fileType.toLowerCase()}${size ? ` (${size})` : ""}`);
  };

  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<DownloadIcon />}
      onClick={handleClick}
      sx={{ textTransform: "none", fontWeight: 600 }}
    >
      Download {fileType}
    </Button>
  );
}
