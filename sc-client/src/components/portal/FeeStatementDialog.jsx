"use client";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SchoolIcon from "@mui/icons-material/School";

import { formatDate, formatKES } from "@/lib/utils";

export function FeeStatementDialog({ open, onClose, statement, loading, childName }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const student = statement?.student || {};
  const entries = statement?.entries || statement?.transactions || [];
  const balance = Number(statement?.balance || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? "100%" : "90vh",
        },
      }}
    >
      <DialogTitle
        className="no-print"
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "grey.50",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <ReceiptIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Official Fee Statement
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "primary.main",
            }}
          >
            Print / Save PDF
          </Button>
          <IconButton size="small" onClick={onClose} aria-label="close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <style>{statementPrintStyles}</style>

        {loading && !statement ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading official statement…
            </Typography>
          </Stack>
        ) : (
          <Box className="statement-document">
            {/* School Header */}
            <Box
              sx={{
                textAlign: "center",
                borderBottom: "2px solid",
                borderColor: "divider",
                pb: 2,
                mb: 2.5,
              }}
            >
              <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <SchoolIcon sx={{ color: "primary.main", fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                  SchoolWise Academy
                </Typography>
              </Stack>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  color: "text.secondary",
                }}
              >
                Official Student Fee Statement
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Generated on {new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}
              </Typography>
            </Box>

            {/* Student Meta Details */}
            <Box
              sx={{
                bgcolor: "grey.50",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                p: { xs: 1.5, sm: 2 },
                mb: 3,
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 1.5,
                  fontSize: 13,
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    STUDENT NAME
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {student.name || childName || "Student"}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    ADMISSION NO.
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                    {student.admissionNumber || "—"}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    CLASS / GRADE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {student.className || "—"}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    ACCOUNT STATUS
                  </Typography>
                  <Chip
                    size="small"
                    label={balance > 0 ? "Balance Outstanding" : balance < 0 ? "Credit Balance" : "Fully Cleared"}
                    color={balance > 0 ? "error" : "success"}
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
                  />
                </Stack>
              </Box>
            </Box>

            {/* Ledger Table */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
              Financial Transactions Ledger
            </Typography>

            <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Description & Ref</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>
                      Invoiced (+)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>
                      Paid (-)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>
                      Running Bal
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No transactions recorded on this account yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((e, idx) => {
                      const debit = Number(e.debit || 0);
                      const credit = Number(e.credit || 0);
                      const isInvoice = e.type === "invoice" || debit > 0;
                      return (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
                            {formatDate(e.date)}
                          </TableCell>
                          <TableCell sx={{ fontSize: 12.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12.5 }}>
                              {e.description || (isInvoice ? "Term Invoice" : "Payment")}
                            </Typography>
                            {e.reference && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontFamily: "monospace", display: "block" }}
                              >
                                Ref: {e.reference}
                              </Typography>
                            )}
                            {/* Invoice line item details if available */}
                            {e.details?.lines && e.details.lines.length > 0 && (
                              <Box sx={{ mt: 0.5, pl: 1, borderLeft: 2, borderColor: "grey.300" }}>
                                {e.details.lines.map((l, lIdx) => (
                                  <Typography key={lIdx} variant="caption" color="text.secondary" display="block">
                                    • {l.description}: {formatKES(l.amount)}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 12.5, fontWeight: 500 }}>
                            {debit > 0 ? formatKES(debit) : "—"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 12.5, fontWeight: 600, color: "success.main" }}>
                            {credit > 0 ? formatKES(credit) : "—"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 12.5, fontWeight: 700 }}>
                            {e.balance !== undefined ? formatKES(e.balance) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total Balance Summary Box */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: 1.5,
                borderColor: balance > 0 ? "error.light" : "success.light",
                bgcolor: balance > 0 ? "error.50" : "success.50",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 1.5,
                mb: 4,
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }} color="text.secondary">
                  Current Account Balance Due
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: balance > 0 ? "error.main" : "success.main",
                  }}
                >
                  {formatKES(balance)}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: { sm: "45%" } }}>
                {balance > 0
                  ? "Please ensure this outstanding balance is cleared before the end of the term."
                  : balance < 0
                    ? "Credit balance on account will be applied to future invoices."
                    : "Account is fully paid. Thank you!"}
              </Typography>
            </Box>

            {/* Signatures & Stamp */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-end"
              sx={{ pt: 3, borderTop: "1px dashed", borderColor: "divider" }}
            >
              <Box sx={{ textAlign: "center", width: 160 }}>
                <Box sx={{ borderBottom: "1px solid", borderColor: "text.primary", height: 28, mb: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: 10 }}>
                  Bursar / Accounts Office
                </Typography>
              </Box>

              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: "grey.400",
                  borderRadius: "50%",
                  px: 2,
                  py: 1.5,
                  transform: "rotate(-5deg)",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", fontSize: 10, display: "block" }}>
                  OFFICIAL STAMP
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                  SchoolWise Academy
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions className="no-print" sx={{ px: 3, py: 1.5, borderTop: 1, borderColor: "divider" }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print / Save PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const statementPrintStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .statement-document, .statement-document * {
      visibility: visible;
    }
    .statement-document {
      position: absolute;
      left: 0;
      top: 0;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;
