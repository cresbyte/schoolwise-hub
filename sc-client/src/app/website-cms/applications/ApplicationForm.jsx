import { format } from "date-fns";
import Grid from "@mui/material/Grid";
import {
  Box,
  Chip,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { StudentFormFields } from "@/components/forms/StudentFormFields";

const STATUS_COLORS = {
  pending: "warning",
  interview_scheduled: "info",
  offered: "success",
  enrolled: "success",
  rejected: "error",
  withdrawn: "default",
};

export default function ApplicationForm({
  viewApp,
  isEditing,
  isOffering,
  isConverting,
  classList,
}) {
  const isFormMode = isEditing || isOffering || isConverting;
  const methods = useFormContext();

  if (!isFormMode) {
    return (
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="overline" color="text.secondary">
            Learner Details
          </Typography>
          <Typography variant="body1">
            <strong>First Name:</strong> {viewApp?.firstName}
          </Typography>
          <Typography variant="body1">
            <strong>Last Name:</strong> {viewApp?.lastName}
          </Typography>
          <Typography variant="body1">
            <strong>Other Name:</strong> {viewApp?.otherName || "N/A"}
          </Typography>
          <Typography variant="body1">
            <strong>DOB:</strong> {viewApp?.dob || viewApp?.dateOfBirth}
          </Typography>
          <Typography variant="body1">
            <strong>Gender:</strong> {viewApp?.gender}
          </Typography>
          <Typography variant="body1">
            <strong>Grade Applying:</strong> {viewApp?.gradeApplying}
          </Typography>
          <Typography variant="body1">
            <strong>Boarding:</strong> {viewApp?.boardingType === "day" ? "Day Scholar" : "Boarding"}
          </Typography>
          <Typography variant="body1">
            <strong>Curriculum:</strong> {viewApp?.curriculum || "CBC"}
          </Typography>
          <Typography variant="body1">
            <strong>NEMIS Number:</strong> {viewApp?.nemisNumber || "N/A"}
          </Typography>
          <Typography variant="body1">
            <strong>Birth Cert No:</strong> {viewApp?.birthCertNumber || "N/A"}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Previous School
            </Typography>
            <Typography variant="body1">
              <strong>School:</strong> {viewApp?.prevSchool || "N/A"}
            </Typography>
            <Typography variant="body1">
              <strong>Last Class:</strong> {viewApp?.prevClass || "N/A"}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="overline" color="text.secondary">
            Parent/Guardian
          </Typography>
          <Typography variant="body1">
            <strong>Name:</strong> {viewApp?.parentName}
          </Typography>
          <Typography variant="body1">
            <strong>Phone:</strong> {viewApp?.parentPhone}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {viewApp?.parentEmail || "N/A"}
          </Typography>
          <Typography variant="body1">
            <strong>Relation:</strong> {viewApp?.relationship}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="overline" color="text.secondary">
              System Status
            </Typography>
            <Box>
              <Chip
                label={viewApp?.status?.replace("_", " ")}
                color={STATUS_COLORS[viewApp?.status] || "default"}
              />
            </Box>
            {viewApp && (
              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                Submitted on {format(new Date(viewApp.submittedAt), "MMM dd, yyyy HH:mm")}
              </Typography>
            )}
            {viewApp?.reviewedBy && (
              <Typography variant="caption" sx={{ display: "block" }}>
                Last reviewed by {viewApp.reviewedBy}
              </Typography>
            )}
            {viewApp?.rejectionReason && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Reason: {viewApp.rejectionReason}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    );
  }

  // Edit / Offer / Convert Mode:
  const { control } = methods;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Required shared student fields */}
      <StudentFormFields classesData={classList} />

      {/* Application Specific Fields */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 2, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
          Application Notes & Records
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Controller name="prevSchool" control={control} render={({ field }) => <TextField {...field} label="Previous School" size="small" fullWidth />} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="prevClass" control={control} render={({ field }) => <TextField {...field} label="Previous Class" size="small" fullWidth />} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="curriculum" control={control} render={({ field }) => (
              <TextField {...field} select label="Curriculum" size="small" fullWidth>
                <MenuItem value="CBC">CBC</MenuItem>
                <MenuItem value="844">8-4-4</MenuItem>
              </TextField>
            )} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="nemisNumber" control={control} render={({ field }) => <TextField {...field} label="NEMIS Number" size="small" fullWidth />} />
          </Grid>
          <Grid item xs={12}>
            <Controller name="reason" control={control} render={({ field }) => <TextField {...field} multiline rows={2} label="Reason for Transfer" size="small" fullWidth />} />
          </Grid>
          <Grid item xs={12}>
            <Controller name="notes" control={control} render={({ field }) => <TextField {...field} multiline rows={2} label="Notes" size="small" fullWidth />} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
