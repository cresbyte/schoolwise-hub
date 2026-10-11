"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { ParentFormDialog } from "@/components/users/ParentFormDialog";
import { ParentProfileView } from "@/components/users/ParentProfileView";
import { useAsync } from "@/hooks/useAsync";
import { userApi } from "@/lib/userApi";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { Alert, Button, Snackbar, Stack } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ParentProfilePage() {
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

  const { data, loading, error, refetch } = useAsync(async () => {
    const [user, children] = await Promise.all([userApi.get(id), userApi.getParentChildren(id)]);
    return { user, children: Array.isArray(children) ? children : [] };
  }, [id]);

  return (
    <>
      <PageHeader
        title={data?.user?.name ?? "Parent"}
        subtitle="Parent profile"
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/users/parents")}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditOpen(true)}
              disabled={!data?.user}
            >
              Edit
            </Button>
          </Stack>
        }
      />

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {() => <ParentProfileView user={data.user} children={data.children} />}
      </DataState>

      <ParentFormDialog
        open={editOpen}
        mode="edit"
        user={data?.user}
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
