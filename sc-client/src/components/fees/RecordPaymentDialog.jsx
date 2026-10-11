"use client";

import { useState, useEffect } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { feesApi, PAYMENT_METHODS, formatKES } from "@/lib/feesApi";
import { studentApi } from "@/lib/studentApi";

export function RecordPaymentDialog({
  open,
  onClose,
  studentId,
  studentName,
  suggestedAmount,
  onSaved,
  onError,
}) {
  const needsPicker = !studentId;

  const [form, setForm] = useState({
    amount: "",
    method: "mpesa",
    reference: "",
    paid_on: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  // Student picker state
  const [student, setStudent] = useState(null);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searching, setSearching] = useState(false);

  // Reset the form every time the dialog opens
  useEffect(() => {
    if (!open) return;
    setForm({
      amount: suggestedAmount ? String(suggestedAmount) : "",
      method: "mpesa",
      reference: "",
      paid_on: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setStudent(null);
    setOptions([]);
    setInputValue("");
  }, [open, suggestedAmount]);

  // Debounced server-side search
  useEffect(() => {
    if (!needsPicker) return;
    if (!inputValue || inputValue.trim().length < 2) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await studentApi.getStudents({
          search: inputValue.trim(),
          status: "active",
          limit: 20,
        });
        if (!cancelled) setOptions(Array.isArray(results) ? results : []);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250); // debounce

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inputValue, needsPicker]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    const targetId = studentId || student?.id;
    if (!targetId) return onError("Pick a student.");
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) === 0) {
      return onError("Enter a valid amount.");
    }

    setBusy(true);
    try {
      await feesApi.recordPayment({
        student: targetId,
        amount: form.amount,
        method: form.method,
        reference: form.reference,
        paid_on: form.paid_on,
        notes: form.notes,
      });
      onSaved();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Record payment</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {needsPicker ? (
            <Autocomplete
              options={options}
              loading={searching}
              value={student}
              inputValue={inputValue}
              onInputChange={(_, v) => setInputValue(v)}
              onChange={(_, v) => setStudent(v)}
              filterOptions={(x) => x} // disable client-side filter, server already filtered
              getOptionLabel={(s) => `${s.firstName} ${s.lastName} · ${s.admissionNumber}`}
              isOptionEqualToValue={(a, b) => a?.id === b?.id}
              noOptionsText={
                inputValue.length < 2
                  ? "Type at least 2 characters to search"
                  : searching
                    ? "Searching…"
                    : "No students found"
              }

              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Student"
                  placeholder="Type a name or admission number"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps?.input,
                      endAdornment: (
                        <>
                          {searching ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                          {params.slotProps?.input?.endAdornment ?? params.InputProps?.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              For <strong>{studentName}</strong>
              {suggestedAmount ? ` · balance ${formatKES(suggestedAmount)}` : ""}
            </Typography>
          )}

          <TextField
            label="Amount (KES)"
            type="number"
            value={form.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            autoFocus={!needsPicker}
            fullWidth
            inputProps={{ min: 0, step: "0.01" }}
          />

          <FormControl fullWidth>
            <InputLabel>Method</InputLabel>
            <Select
              value={form.method}
              label="Method"
              onChange={(e) => handleChange("method", e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(form.method === "mpesa" || form.method === "bank" || form.method === "cheque") && (
            <TextField
              label={form.method === "mpesa" ? "M-Pesa receipt code" : "Reference"}
              value={form.reference}
              onChange={(e) => handleChange("reference", e.target.value)}
              fullWidth
              helperText={
                form.method === "mpesa"
                  ? "The code from the parent's M-Pesa confirmation SMS."
                  : "Any reference that helps you find this payment later."
              }
            />
          )}

          <TextField
            label="Paid on"
            type="date"
            value={form.paid_on}
            onChange={(e) => handleChange("paid_on", e.target.value)}
            inputlabelprops={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Notes (optional)"
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          <Alert severity="info">
            A payment applies to unpaid invoices automatically, oldest first. Any overpayment
            becomes a credit on the student's account.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={busy}>
          {busy ? "Saving…" : "Record payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
