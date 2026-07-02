/**
 * Page-level permission guard component.
 * Wrap page content with this to show a "Access Denied" screen
 * instead of an empty page when a user lacks a specific permission.
 * 
 * Use alongside DashboardLayout's useRouteGuard for defense-in-depth.
 * This is the second layer — useRouteGuard handles role-level blocking,
 * PageGuard handles permission-level blocking within allowed roles.
 */
"use client";
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface PageGuardProps {
  permission: string;
  children: React.ReactNode;
}

export function PageGuard({ permission, children }: PageGuardProps) {
  const { hasPermission, user } = useAuth();
  const router = useRouter();

  if (!hasPermission(permission)) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 2,
          textAlign: "center",
        }}
      >
        <LockIcon sx={{ fontSize: 64, color: "text.disabled" }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Access Denied
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
          You don't have permission to view this page.
          {user?.role === "parent"
            ? " Please use the Parent Portal to view your child's information."
            : " Contact your administrator if you believe this is an error."}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
          {user?.role === "parent" && (
            <Button variant="outlined" onClick={() => router.push("/portal")}>
              Go to Parent Portal
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
}
