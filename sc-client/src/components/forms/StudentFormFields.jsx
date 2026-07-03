"use client";

import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

export const studentSchema = z.object({
  photo: z.any()
    .refine((file) => !file || typeof file === "string" || file.size <= 2000000, "Max image size is 2MB.")
    .refine(
      (file) => !file || typeof file === "string" || ["image/jpeg", "image/png"].includes(file.type),
      "Only .jpg and .png formats are supported."
    )
    .optional(),
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  otherName: z.string().optional(),
  gender: z.enum(["Male", "Female"]),
  dateOfBirth: z.string().min(1, "Required"),
  birthCertNumber: z.string().optional(),
  homeLocation: z.string().min(2, "Required"),
  classId: z.string().min(1, "Select a class"),
  boardingStatus: z.enum(["day", "boarding", "part_boarding"]),
  admissionDate: z.string().min(1, "Required"),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  primaryContactName: z.string().min(2, "Required"),
  primaryContactPhone: z.string().regex(/^(07|01)\d{8}$/, "Use format 07XXXXXXXX"),
});

export function StudentFormFields({ classesData = [] }) {
  const { control, formState: { errors } } = useFormContext();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Bio Data Section */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Bio Data
        </Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Box sx={{ gridColumn: "1 / -1", display: "flex", gap: 2, alignItems: "center" }}>
            <Controller
              name="photo"
              control={control}
              render={({ field }) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Box
                    sx={{
                      width: 120,
                      height: 150, // 4:5 aspect ratio passport size
                      bgcolor: "action.hover",
                      border: "1px dashed",
                      borderColor: errors.photo ? "error.main" : "divider",
                      borderRadius: 1,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      "&:hover .photo-overlay": { opacity: 1 },
                    }}
                  >
                    {field.value ? (
                      <img src={typeof field.value === "string" ? field.value : URL.createObjectURL(field.value)} alt="Student" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <PhotoCameraIcon color={errors.photo ? "error" : "action"} fontSize="large" />
                    )}
                    
                    {/* Hover Overlay */}
                    <Box
                      className="photo-overlay"
                      sx={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        bgcolor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <Button component="label" variant="text" sx={{ color: "white" }}>
                        Upload
                        <input
                          type="file"
                          hidden
                          accept="image/jpeg, image/png"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              field.onChange(e.target.files[0]);
                            }
                          }}
                        />
                      </Button>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color={errors.photo ? "error" : "text.secondary"} sx={{ mb: 1 }}>
                      {errors.photo ? errors.photo.message : "Upload passport-sized photo (approx. 4x5)"}
                    </Typography>
                    {field.value && (
                      <Button size="small" color="error" onClick={() => field.onChange("")}>
                        Remove Photo
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            />
          </Box>
          <Controller name="firstName" control={control} render={({ field }) => <TextField {...field} label="First Name" size="small" error={!!errors.firstName} helperText={errors.firstName?.message} />} />
          <Controller name="lastName" control={control} render={({ field }) => <TextField {...field} label="Last Name" size="small" error={!!errors.lastName} helperText={errors.lastName?.message} />} />
          <Controller name="otherName" control={control} render={({ field }) => <TextField {...field} label="Other Name" size="small" />} />
          <Controller name="gender" control={control} render={({ field }) => <TextField {...field} select label="Gender" size="small"><MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem></TextField>} />
          <Controller name="dateOfBirth" control={control} render={({ field }) => <TextField {...field} type="date" label="Date of Birth" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message} />} />
          <Controller name="birthCertNumber" control={control} render={({ field }) => <TextField {...field} label="Birth Cert. Number" size="small" />} />
          <Controller name="homeLocation" control={control} render={({ field }) => <TextField {...field} label="Home Location" size="small" error={!!errors.homeLocation} helperText={errors.homeLocation?.message} />} />
        </Box>
      </Box>

      {/* Class & Boarding */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Class & Boarding
        </Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Controller name="classId" control={control} render={({ field }) => (
            <TextField {...field} select label="Class" size="small" error={!!errors.classId} helperText={errors.classId?.message}>
              {classesData.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          )} />
          <Controller name="boardingStatus" control={control} render={({ field }) => (
            <TextField {...field} select label="Boarding Status" size="small">
              <MenuItem value="day">Day Scholar</MenuItem>
              <MenuItem value="boarding">Boarder</MenuItem>
              <MenuItem value="part_boarding">Part Boarding</MenuItem>
            </TextField>
          )} />
          <Controller name="admissionDate" control={control} render={({ field }) => <TextField {...field} type="date" label="Admission Date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.admissionDate} helperText={errors.admissionDate?.message} />} />
        </Box>
      </Box>

      {/* Parent / Guardian */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Parent / Guardian
        </Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Controller name="fatherName" control={control} render={({ field }) => <TextField {...field} label="Father's Name" size="small" />} />
          <Controller name="motherName" control={control} render={({ field }) => <TextField {...field} label="Mother's Name" size="small" />} />
          <Controller name="primaryContactName" control={control} render={({ field }) => <TextField {...field} label="Primary Contact Name" size="small" error={!!errors.primaryContactName} helperText={errors.primaryContactName?.message} />} />
          <Controller name="primaryContactPhone" control={control} render={({ field }) => <TextField {...field} label="Primary Contact Phone" size="small" placeholder="0712345678" error={!!errors.primaryContactPhone} helperText={errors.primaryContactPhone?.message} />} />
        </Box>
      </Box>
    </Box>
  );
}
