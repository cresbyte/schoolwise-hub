"use client";
import { useState } from "react";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";
import { ReportCardDocument } from "./ReportCardDocument";

export function ReportCardDialog({ studentId, year, term, open, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="no-print"
      PaperProps={{
        sx: {
          maxHeight: "95vh",
          "@media print": {
            boxShadow: "none",
            maxHeight: "none",
            overflow: "visible",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0, overflow: "auto" }}>
        {studentId && year && term ? (
          <ReportCardDocument studentId={studentId} year={year} term={term} />
        ) : (
          <Box sx={{ p: 4, textAlign: "center" }}>Loading...</Box>
        )}
      </DialogContent>
      <DialogActions className="no-print" sx={{ p: 2, borderTop: "1px solid #eee" }}>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
        <Tooltip title="Print or Save as PDF">
          <Button variant="contained" onClick={handlePrint} startIcon={<PrintIcon />}>
            Print Report Card
          </Button>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
}

// Quick button to open the dialog from tables/lists
export function ViewReportCardButton({ studentId, year, term, label = "View" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ReportCardDialog
        open={open}
        onClose={() => setOpen(false)}
        studentId={studentId}
        year={year}
        term={term}
      />
    </>
  );
}
