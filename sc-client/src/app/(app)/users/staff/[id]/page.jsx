"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { StaffFormDialog } from "@/components/users/StaffFormDialog";
import { StaffProfileView } from "@/components/users/StaffProfileView";
import { useAsync } from "@/hooks/useAsync";
import { userApi } from "@/lib/userApi";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { Alert, Button, Snackbar, Stack } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function StaffProfilePage() {
  return (
    <>
      <PageGuard permission="users.manage">
        <Content />
      </PageGuard>
    </>
  );
}

function Content() {
  const { id } = useParams();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
    key: 0,
  });

  const notify = (message, severity = "success") =>
    setSnack((s) => ({ open: true, message, severity, key: s.key + 1 }));

  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  const { data, loading, error, refetch } = useAsync(() => userApi.get(id), [id]);

  return (
    <>
      <PageHeader
        title={data?.name ?? "Staff"}
        subtitle="Staff profile"
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/users/staff")}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditOpen(true)}
              disabled={!data}
            >
              Edit
            </Button>
          </Stack>
        }
      />

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() => <StaffProfileView user={data} />}
      </DataState>

      <StaffFormDialog
        open={editOpen}
        mode="edit"
        user={data}
        onClose={() => setEditOpen(false)}
        onSaved={(msg) => {
          setEditOpen(false);
          notify(msg || "Saved.");
          refetch();
        }}
      />

      <Snackbar
        key={snack.key}
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={closeSnack}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
