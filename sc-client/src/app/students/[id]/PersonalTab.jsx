"use client";

import { formatDate } from "@/lib/utils";
import { Box, Card, Divider, Typography } from "@mui/material";

function Detail({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

/** Personal Info tab on the student detail page. */
export function PersonalTab({ s }) {
  const bioData = [
    ["First Name", s.firstName],
    ["Last Name", s.lastName],
    ["Other Name", s.otherName],
    ["Gender", s.gender],
    ["Date of Birth", formatDate(s.dateOfBirth)],
    ["Birth Cert No.", s.birthCertNumber],
    ["Home Location", s.homeLocation],
    ["Admission Date", formatDate(s.admissionDate)],
  ];
  const parents = s.parents ?? [];

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Bio Data
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {bioData.map(([label, value]) => (
          <Detail key={label} label={label} value={value} />
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Parents
      </Typography>
      {parents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No parents on record.
        </Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {parents.map((p) => (
            <Card key={p.id} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                {p.relationship.toUpperCase()}
              </Typography>
              <Detail label="Name" value={p.name} />
              <Detail label="Phone" value={p.phone} />
              <Detail label="Email" value={p.email} />
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
