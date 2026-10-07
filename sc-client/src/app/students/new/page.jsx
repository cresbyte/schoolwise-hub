"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StudentForm } from "./StudentForm";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from "@mui/material";

export default function NewStudentPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [pendingData, setPendingData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function admitStudent(data, autoCreateInvoice = true) {
    await api.createStudent({
      ...data,
      status: "active",
      feeBalance: 0,
      boardingStatus: "day",
      autoCreateInvoice,
    });
    showNotification(`${data.firstName} ${data.lastName} admitted successfully`, "success");
    router.push("/students");
  }

  function handleSubmit(data) {
    setPendingData(data);
    setConfirmOpen(true);
  }

  async function handleConfirm(createInvoice) {
    await admitStudent(pendingData, createInvoice);
    setConfirmOpen(false);
    setPendingData(null);
  }

  return (
    <DashboardLayout>
      <PageHeader title="Add Student" subtitle="Register a new student" />
      <StudentForm onSave={handleSubmit} submitLabel="Admit Student" cancelPath="/students" />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Invoice for Current Term?</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            An active fee structure exists for {new Date().getFullYear()}. Would you like to
            automatically create an invoice for the current term?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            You can always create invoices manually later from the Finance section.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirm(false)} color="inherit">
            Skip Invoice
          </Button>
          <Button onClick={() => handleConfirm(true)} variant="contained">
            Create Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
