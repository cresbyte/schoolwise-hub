/**
 * Renders loading / error / empty / data states consistently.
 * @module DataState
 */
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InboxIcon from "@mui/icons-material/Inbox";

interface DataStateProps<T> {
  loading: boolean;
  error: Error | null;
  data: T | null | undefined;
  onRetry?: () => void;
  isEmpty?: (data: T) => boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}

/** Generic state-machine wrapper for data-fetching UI. */
export function DataState<T>({
  loading,
  error,
  data,
  onRetry,
  isEmpty,
  emptyMessage = "No records found",
  emptyAction,
  skeleton,
  children,
}: DataStateProps<T>) {
  if (loading) {
    return (
      <Box>
        {skeleton ?? (
          <Stack spacing={1.5}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={52} />
            ))}
          </Stack>
        )}
      </Box>
    );
  }
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      >
        {error.message || "Something went wrong while loading data."}
      </Alert>
    );
  }
  if (data == null || (isEmpty && isEmpty(data))) {
    return (
      <Stack alignItems="center" spacing={1.5} sx={{ py: 8, color: "text.secondary" }}>
        <InboxIcon sx={{ fontSize: 56, opacity: 0.4 }} />
        <Typography variant="body1">{emptyMessage}</Typography>
        {emptyAction}
      </Stack>
    );
  }
  return <>{children(data)}</>;
}

export default DataState;