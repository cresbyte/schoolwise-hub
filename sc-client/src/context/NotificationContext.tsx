/**
 * Notification context providing snackbar/toast helpers.
 * @module NotificationContext
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

type NotifType = "info" | "success" | "warning" | "error";

interface NotificationContextValue {
  showNotification: (message: string, type?: NotifType) => void;
  showToast: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/** Provides app-wide snackbar notifications. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotifType>("info");

  const showNotification = useCallback((msg: string, t: NotifType = "info") => {
    setMessage(msg);
    setType(t);
    setOpen(true);
  }, []);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setType("info");
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ showNotification, showToast }), [showNotification, showToast]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setOpen(false)} severity={type} variant="filled" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

/** Access notification helpers. */
export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}