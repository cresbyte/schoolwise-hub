"use client";

/**
 * Edit staff member form.
 * @module staff/[id]/edit/page
 */
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useStaffMember } from "@/hooks/domain";
import { useNotification } from "@/context/NotificationContext";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { CONTRACT_TYPES } from "@/lib/constants";

const schema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  gender: z.enum(["Male", "Female"]),
  dateOfBirth: z.string().min(1, "Required"),
  phone: z.string().regex(/^(07|01)\d{8}$/, "Use format 07XXXXXXXX"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  idNumber: z.string().min(5, "Required"),
  kraPin: z.string().min(11, "Invalid KRA PIN"),
  nssfNumber: z.string().optional(),
  shifNumber: z.string().optional(),
  contractType: z.string().min(1, "Required"),
  designation: z.string().min(2, "Required"),
  department: z.string().optional(),
  dateJoined: z.string().min(1, "Required"),
  basicSalary: z.coerce.number().min(0),
  houseAllowance: z.coerce.number().min(0),
  transportAllowance: z.coerce.number().min(0),
  otherAllowances: z.coerce.number().min(0),
  nextOfKinName: z.string().min(2, "Required"),
  nextOfKinRelationship: z.string().min(2, "Required"),
  nextOfKinPhone: z.string().regex(/^(07|01)\d{8}$/, "Use format 07XXXXXXXX"),
  status: z.enum(["active", "on_leave", "suspended", "terminated"]),
  subjectsTeaching: z.array(z.string()),
});

export default function EditStaffPage() {
  const params = useParams();
  const id = params.id;
  const staff = useStaffMember(id);

  return (
    <DashboardLayout>
      <PageHeader title="Edit Staff" subtitle={staff.data ? `Updating ${staff.data.firstName} ${staff.data.lastName}` : "Updating staff information"} />
      <DataState loading={staff.loading} error={staff.error} data={staff.data} onRetry={staff.refetch}>
        {(s) => <EditStaffForm staff={s} />}
      </DataState>
    </DashboardLayout>
  );
}

function EditStaffForm({ staff }) {
  const router = useRouter();
  const { showNotification } = useNotification();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: staff.firstName,
      lastName: staff.lastName,
      gender: staff.gender,
      dateOfBirth: staff.dateOfBirth,
      phone: staff.phone,
      email: staff.email || "",
      idNumber: staff.idNumber,
      kraPin: staff.kraPin,
      nssfNumber: staff.nssfNumber || "",
      shifNumber: staff.shifNumber || "",
      contractType: staff.contractType,
      designation: staff.designation,
      department: staff.department || "",
      dateJoined: staff.dateJoined,
      basicSalary: staff.basicSalary,
      houseAllowance: staff.houseAllowance,
      transportAllowance: staff.transportAllowance,
      otherAllowances: staff.otherAllowances,
      nextOfKinName: staff.nextOfKin?.name ?? "",
      nextOfKinRelationship: staff.nextOfKin?.relationship ?? "",
      nextOfKinPhone: staff.nextOfKin?.phone ?? "",
      status: staff.status,
      subjectsTeaching: staff.subjectsTeaching || [],
    },
  });

  const subjects = useAsync(() => api.getSubjects(), []);
  const designations = useAsync(() => api.getDesignations(staff.id), [staff.id]);

  const onSubmit = handleSubmit(async (v) => {
    const payload = {
      firstName: v.firstName,
      lastName: v.lastName,
      gender: v.gender,
      dateOfBirth: v.dateOfBirth,
      phone: v.phone,
      email: v.email || undefined,
      idNumber: v.idNumber,
      kraPin: v.kraPin,
      nssfNumber: v.nssfNumber,
      shifNumber: v.shifNumber,
      contractType: v.contractType,
      designation: v.designation,
      department: v.department,
      dateJoined: v.dateJoined,
      status: v.status,
      basicSalary: v.basicSalary,
      subjectsTeaching: v.subjectsTeaching,
      houseAllowance: v.houseAllowance,
      transportAllowance: v.transportAllowance,
      otherAllowances: v.otherAllowances,
      nextOfKin: {
        ...(staff.nextOfKin ?? {}),
        name: v.nextOfKinName,
        relationship: v.nextOfKinRelationship,
        phone: v.nextOfKinPhone,
      },
    };
    await api.updateStaff(staff.id, payload);
    showNotification(`Staff member updated successfully`, "success");
    router.push("/staff");
  });

  return (
    <Card component="form" onSubmit={onSubmit}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Personal Details</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" } }}>
          <Controller name="firstName" control={control} render={({ field }) => <TextField {...field} label="First Name" size="small" error={!!errors.firstName} helperText={errors.firstName?.message} />} />
          <Controller name="lastName" control={control} render={({ field }) => <TextField {...field} label="Last Name" size="small" error={!!errors.lastName} helperText={errors.lastName?.message} />} />
          <Controller name="gender" control={control} render={({ field }) => <TextField {...field} select label="Gender" size="small"><MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem></TextField>} />
          <Controller name="dateOfBirth" control={control} render={({ field }) => <TextField {...field} type="date" label="Date of Birth" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message} />} />
          <Controller name="phone" control={control} render={({ field }) => <TextField {...field} label="Phone Number" size="small" error={!!errors.phone} helperText={errors.phone?.message} />} />
          <Controller name="email" control={control} render={({ field }) => <TextField {...field} label="Email Address" size="small" error={!!errors.email} helperText={errors.email?.message} />} />
        </Box>

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Employment Details</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" } }}>
          <Controller name="idNumber" control={control} render={({ field }) => <TextField {...field} label="ID Number" size="small" error={!!errors.idNumber} helperText={errors.idNumber?.message} />} />
          <Controller name="kraPin" control={control} render={({ field }) => <TextField {...field} label="KRA PIN" size="small" error={!!errors.kraPin} helperText={errors.kraPin?.message} />} />
          <Controller name="nssfNumber" control={control} render={({ field }) => <TextField {...field} label="NSSF Number" size="small" />} />
          <Controller name="shifNumber" control={control} render={({ field }) => <TextField {...field} label="SHIF Number" size="small" />} />
          <Controller name="contractType" control={control} render={({ field }) => (
            <TextField {...field} select label="Contract Type" size="small" error={!!errors.contractType} helperText={errors.contractType?.message}>
              {CONTRACT_TYPES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </TextField>
          )} />
          <Controller name="designation" control={control} render={({ field }) => (
            <TextField {...field} select label="Designation" size="small" error={!!errors.designation} helperText={errors.designation?.message}>
              {(designations.data || []).map((d) => (
                <MenuItem key={d.label} value={d.label} disabled={d.isTaken}>
                  {d.label} {d.isTaken ? "(Assigned)" : ""}
                </MenuItem>
              ))}
              {/* Allow free text if none of the above match, though unique ones are usually controlled */}
              {!designations.data?.some(d => d.label === field.value) && <MenuItem value={field.value}>{field.value}</MenuItem>}
            </TextField>
          )} />
          <Controller name="department" control={control} render={({ field }) => <TextField {...field} label="Department" size="small" />} />

          <Box sx={{ gridColumn: { lg: "span 3" } }}>
            <Controller
              name="subjectsTeaching"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  id="subjects-teaching"
                  options={subjects.data || []}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  value={(subjects.data || []).filter((s) => field.value?.includes(s.id))}
                  onChange={(_, val) => field.onChange(val.map((v) => v.id))}
                  renderInput={(params) => (
                    <TextField {...params} label="Subjects Teaching" placeholder="Select subjects..." size="small" />
                  )}
                />
              )}
            />
          </Box>
          <Controller name="dateJoined" control={control} render={({ field }) => <TextField {...field} type="date" label="Date Joined" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.dateJoined} helperText={errors.dateJoined?.message} />} />
          <Controller name="status" control={control} render={({ field }) => (
            <TextField {...field} select label="Work Status" size="small">
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
            </TextField>
          )} />
        </Box>

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Remuneration</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" } }}>
          <Controller name="basicSalary" control={control} render={({ field }) => <TextField {...field} type="number" label="Basic Salary" size="small" error={!!errors.basicSalary} helperText={errors.basicSalary?.message} />} />
          <Controller name="houseAllowance" control={control} render={({ field }) => <TextField {...field} type="number" label="House Allowance" size="small" />} />
          <Controller name="transportAllowance" control={control} render={({ field }) => <TextField {...field} type="number" label="Transport Allowance" size="small" />} />
          <Controller name="otherAllowances" control={control} render={({ field }) => <TextField {...field} type="number" label="Other Allowances" size="small" />} />
        </Box>

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Next of Kin</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" } }}>
          <Controller name="nextOfKinName" control={control} render={({ field }) => <TextField {...field} label="Full Name" size="small" error={!!errors.nextOfKinName} helperText={errors.nextOfKinName?.message} />} />
          <Controller name="nextOfKinRelationship" control={control} render={({ field }) => <TextField {...field} label="Relationship" size="small" error={!!errors.nextOfKinRelationship} helperText={errors.nextOfKinRelationship?.message} />} />
          <Controller name="nextOfKinPhone" control={control} render={({ field }) => <TextField {...field} label="Phone Number" size="small" error={!!errors.nextOfKinPhone} helperText={errors.nextOfKinPhone?.message} />} />
        </Box>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={() => router.push("/staff")}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Changes"}</Button>
        </Box>
      </CardContent>
    </Card>
  );
}
