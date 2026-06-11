/**
 * Contact and enquiry form for website pages.
 * @module ContactForm
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import SendIcon from "@mui/icons-material/Send";

const SUBJECTS = [
  "General Enquiry",
  "Admissions",
  "Fees & Accounts",
  "Transport",
  "Boarding",
  "Other",
];

/** Props for {@link ContactForm}. */
export interface ContactFormProps {
  submitLabel?: string;
}

/**
 * General contact form with mock submission.
 * @param props - Optional submit button label
 */
export function ContactForm({ submitLabel = "Send Message" }: ContactFormProps) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 800);
  };

  if (sent) {
    return (
      <Alert severity="success" sx={{ borderRadius: 2 }}>
        Thank you for your message! Our team will respond within 2 business days.
      </Alert>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        <TextField required label="Full Name" name="name" fullWidth />
        <TextField
          required
          label="Phone Number"
          name="phone"
          fullWidth
          placeholder="07XX XXX XXX"
        />
      </Box>
      <TextField required label="Email Address" name="email" type="email" fullWidth />
      <TextField select required label="Subject" name="subject" defaultValue="" fullWidth>
        {SUBJECTS.map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </TextField>
      <TextField required label="Message" name="message" multiline rows={5} fullWidth />
      <Button
        type="submit"
        variant="contained"
        size="large"
        startIcon={<SendIcon />}
        disabled={loading}
        sx={{ alignSelf: "flex-start", px: 4 }}
      >
        {loading ? "Sending…" : submitLabel}
      </Button>
    </Box>
  );
}
