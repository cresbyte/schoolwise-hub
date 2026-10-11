"use client";

import Link from "next/link";
import {
  Avatar,
  Box,
  Card,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const REL_LABEL = {
  father: "Father",
  mother: "Mother",
  guardian: "Guardian",
};

export function ParentProfileView({ user, children = [] }) {
  if (!user) return null;

  const initials = (user.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Avatar sx={{ width: 88, height: 88, fontSize: 32 }} src={user.photoUrl || undefined}>
            {!user.photoUrl && initials}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {user.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label="Parent" color="success" size="small" />
              <Chip
                label={user.isActive ? "Active" : "Inactive"}
                color={user.isActive ? "success" : "default"}
                size="small"
                variant={user.isActive ? "filled" : "outlined"}
              />
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Field label="Phone" value={user.phone} />
          <Field label="Email" value={user.email} />
          <Field label="Gender" value={user.gender} />
          <Field label="Date of birth" value={user.birthDate} />
          <Field
            label="Last login"
            value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
          />
          <Field
            label="Added"
            value={user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
          />
        </Stack>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Linked children
        </Typography>
        {children.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No children linked yet. Click Edit to add them.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Admission #</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Relationship</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {children.map((c) => (
                  <TableRow key={c.studentId} hover>
                    <TableCell>
                      <Link
                        href={`/students/${c.studentId}`}
                        style={{
                          color: "inherit",
                          fontWeight: 500,
                        }}
                      >
                        {c.studentName}
                      </Link>
                    </TableCell>
                    <TableCell>{c.admissionNumber || "—"}</TableCell>
                    <TableCell>{c.className || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={REL_LABEL[c.relationship] ?? c.relationship}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Stack>
  );
}

function Field({ label, value }) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
}
