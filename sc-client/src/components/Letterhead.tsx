/**
 * Print-only school letterhead.
 * @module Letterhead
 */
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import SchoolIcon from "@mui/icons-material/School";
import { school } from "@/lib/mockData";
import { formatDateTime } from "@/lib/utils";
import Image from "next/image";


/** School header for printed documents. */
export function Letterhead({ title }: { title?: string }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "common.white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image src="/school-logo.png" alt="School Logo" width={60} height={60} priority />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
            {school.name}
          </Typography>
          <Typography variant="caption" sx={{ fontStyle: "italic" }}>
            {school.motto}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {school.postalAddress} · Tel: {school.phone} · {school.email}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Printed: {formatDateTime(new Date())}
        </Typography>
      </Box>
      {title && (
        <Typography
          variant="h6"
          sx={{ mt: 1.5, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}
        >
          {title}
        </Typography>
      )}
      <Divider sx={{ mt: 1, borderBottomWidth: 2, borderColor: "primary.main" }} />
    </Box>
  );
}

export default Letterhead;
