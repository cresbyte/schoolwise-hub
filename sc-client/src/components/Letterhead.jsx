// @/components/Letterhead.jsx
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function Letterhead({ title }) {
  return (
    <Box sx={{ textAlign: "center", mb: 3, pb: 2, borderBottom: "2px solid #000" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        KIBARAA ELITES ACADEMY
      </Typography>
      <Typography variant="body2" color="text.secondary">
        P.O. Box 1234-00100, Nairobi | Tel: +254 700 123 456
      </Typography>
      <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
        {title}
      </Typography>
    </Box>
  );
}
