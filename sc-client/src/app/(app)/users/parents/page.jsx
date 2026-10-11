"use client";

import { PageGuard } from "@/components/common/PageGuard";
import { DataState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { ParentFormDialog } from "@/components/users/ParentFormDialog";
import { SetPasswordDialog } from "@/components/users/SetPasswordDialog";
import { useAsync } from "@/hooks/useAsync";
import { userApi } from "@/lib/userApi";
import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import KeyIcon from "@mui/icons-material/Key";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function ParentsPage() {
  return (
    <>
      <PageGuard permission="users.manage">
        <PageHeader
          title="Parents"
          subtitle="Guardians linked to students. Manage accounts and children."
        />
        <ParentsContent />
      </PageGuard>
    </>
  );
}

function ParentsContent() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(null); // null | { mode, user? }
  const [pwdUser, setPwdUser] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
    key: 0,
  });

  const notify = (message, severity = "success") =>
    setSnack((s) => ({ open: true, message, severity, key: s.key + 1 }));

  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  const { data, loading, error, refetch } = useAsync(
    () =>
      userApi.listParents({
        is_active:
          activeFilter === "all" ? undefined : activeFilter === "active" ? "true" : "false",
        search: search.trim() || undefined,
      }),
    [activeFilter, search],
  );

  const list = Array.isArray(data) ? data : [];

  const stats = useMemo(() => {
    let inactive = 0;
    let withChildren = 0;
    let totalChildren = 0;
    list.forEach((u) => {
      if (!u.isActive) inactive += 1;
      if (u.childrenCount > 0) withChildren += 1;
      totalChildren += u.childrenCount || 0;
    });
    return { inactive, withChildren, totalChildren, total: list.length };
  }, [list]);

  const handleToggle = async (user) => {
    try {
      const res = await userApi.toggleActive(user.id);
      notify(`${user.name} is now ${res.isActive ? "active" : "inactive"}.`);
      refetch();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <>
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
          flexwrap="wrap"
          useFlexGap
        >
          <TextField
            size="small"
            placeholder="Search name, phone, email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 280 }}
          />

          <ToggleButtonGroup
            size="small"
            exclusive
            value={activeFilter}
            onChange={(_, v) => v && setActiveFilter(v)}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="inactive">Inactive</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ flex: 1 }} />

          <Stack direction="row" spacing={1} flexwrap="wrap" useFlexGap>
            <Chip size="small" variant="outlined" label={`${stats.total} parents`} />
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={`${stats.withChildren} with children`}
            />
            <Chip
              size="small"
              color="info"
              variant="outlined"
              label={`${stats.totalChildren} links`}
            />
            {stats.inactive > 0 && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={`${stats.inactive} inactive`}
              />
            )}
          </Stack>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen({ mode: "create" })}
          >
            Add parent
          </Button>
        </Stack>
      </Card>

      <DataState
        loading={loading}
        error={error}
        data={list}
        onRetry={refetch}
        isEmpty={() => list.length === 0}
        emptyMessage="No parents match these filters."
      >
        {() => (
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Children</TableCell>
                    <TableCell>Last login</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right" sx={{ width: 60 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((u) => (
                    <ParentRow
                      key={u.id}
                      user={u}
                      onView={() => router.push(`/users/parents/${u.id}`)}
                      onEdit={() => setFormOpen({ mode: "edit", user: u })}
                      onSetPassword={() => setPwdUser(u)}
                      onToggle={() => handleToggle(u)}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </DataState>

      <ParentFormDialog
        open={!!formOpen}
        mode={formOpen?.mode}
        user={formOpen?.user}
        onClose={() => setFormOpen(null)}
        onSaved={(msg) => {
          notify(msg || "Saved.");
          setFormOpen(null);
          refetch();
        }}
      />

      <SetPasswordDialog
        user={pwdUser}
        onClose={() => setPwdUser(null)}
        onSaved={() => {
          notify("Password updated.");
          setPwdUser(null);
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

function ParentRow({ user, onView, onEdit, onSetPassword, onToggle }) {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);

  const initials = (user.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <TableRow hover>
      <TableCell>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, fontSize: 13 }} src={user.photoUrl || undefined}>
            {!user.photoUrl && initials}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {user.name}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{user.phone}</Typography>
        {user.email && (
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        {user.childrenCount > 0 ? (
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={`${user.childrenCount} child${user.childrenCount === 1 ? "" : "ren"}`}
          />
        ) : (
          <Chip size="small" variant="outlined" label="None linked" />
        )}
      </TableCell>
      <TableCell>{user.lastLogin ? formatRelative(user.lastLogin) : "Never"}</TableCell>
      <TableCell>
        <Chip
          size="small"
          label={user.isActive ? "Active" : "Inactive"}
          color={user.isActive ? "success" : "default"}
          variant={user.isActive ? "filled" : "outlined"}
        />
      </TableCell>
      <TableCell align="right">
        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu anchorEl={anchor} open={!!anchor} onClose={close}>
          <MenuItem
            onClick={() => {
              close();
              onView();
            }}
          >
            <PersonIcon fontSize="small" sx={{ mr: 1 }} /> View profile
          </MenuItem>
          <MenuItem
            onClick={() => {
              close();
              onEdit();
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              close();
              onSetPassword();
            }}
          >
            <KeyIcon fontSize="small" sx={{ mr: 1 }} /> Set password
          </MenuItem>
          <MenuItem
            onClick={() => {
              close();
              onToggle();
            }}
          >
            {user.isActive ? (
              <>
                <BlockIcon fontSize="small" sx={{ mr: 1 }} /> Deactivate
              </>
            ) : (
              <>
                <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} /> Activate
              </>
            )}
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}

function formatRelative(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d ago`;
  return d.toLocaleDateString();
}
