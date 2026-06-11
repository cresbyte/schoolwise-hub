import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SchuleSmart — School Management System" },
      { name: "description", content: "SchuleSmart: a complete school management system for Kenyan private schools." },
    ],
  }),
  component: Index,
});

/** Entry route — redirects to the role home or login. */
function Index() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) navigate({ to: ROLE_HOME[user.role] });
    else navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, user, navigate]);

  return (
    <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress />
    </Box>
  );
}
