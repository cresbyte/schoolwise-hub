"use client";

/**
 * Fee structures by grade level / term.
 * @module fees/structures/page
 */
import { useState, useMemo } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Collapse from "@mui/material/Collapse";
import AddIcon from "@mui/icons-material/Add";
import PrintIcon from "@mui/icons-material/Print";
import HistoryIcon from "@mui/icons-material/History";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { PageGuard } from "@/components/common/PageGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatKES } from "@/lib/utils";

interface FeeStructure {
  id: number;
  name: string;
  gradeLevel: string;
  year: number;
  term: number;
  totalAmount: number;
  breakdown: Record<string, number>;
  isActive: boolean;
  version: number;
  createdById?: number;
  createdByName?: string;
  createdAt: string;
  versionHistory: Array<{
    version: number;
    totalAmount: number;
    createdAt: string | null;
    createdByName: string | null;
  }>;
}

export default function FeeStructuresPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="fees.view">
        <FeeStructuresContent />
      </PageGuard>
    </DashboardLayout>
  );
}

function FeeStructuresContent() {
  const router = useRouter();
  const [term, setTerm] = useState("2");
  const [year, setYear] = useState("2026");

  const { data, loading, error, refetch } = useAsync(
    () => api.api.getFeeStructures({ year: Number(year), term: Number(term), is_active: true }) as Promise<FeeStructure[]>,
    [term, year]
  );
  const list = data ?? [];

  // Group by grade level for printing
  const gradeLevels = useMemo(() => {
    return [...new Set(list.map((f: FeeStructure) => f.gradeLevel))].sort();
  }, [list]);

  const handlePrintAll = () => {
    // Print all for the current term/year
    router.push(`/fees/structures/print?year=${year}&term=${term}`);
  };

  const handlePrintGrade = (gradeLevel: string) => {
    router.push(`/fees/structures/print?gradeLevel=${encodeURIComponent(gradeLevel)}&year=${year}`);
  };

  return (
    <>
      <PageHeader
        title="Fee Structures"
        subtitle={`Primrose Private Academy · ${year}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Print all fee structures">
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintAll}>
                Print
              </Button>
            </Tooltip>
            <RoleGuard permission="finance.*">
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/fees/structures/new")}>
                Add Structure
              </Button>
            </RoleGuard>
          </Stack>
        }
      />
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField select size="small" label="Year" value={year} onChange={(e) => setYear(e.target.value)} sx={{ width: 120 }}>
            <MenuItem value="2025">2025</MenuItem>
            <MenuItem value="2026">2026</MenuItem>
            <MenuItem value="2027">2027</MenuItem>
          </TextField>
          <TextField select size="small" label="Term" value={term} onChange={(e) => setTerm(e.target.value)} sx={{ width: 150 }}>
            <MenuItem value="1">Term 1</MenuItem>
            <MenuItem value="2">Term 2</MenuItem>
            <MenuItem value="3">Term 3</MenuItem>
          </TextField>
          <Chip label={`${list.length} structures`} size="small" variant="outlined" />
        </Stack>
      </Card>
      <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d: FeeStructure[]) => d.length === 0} emptyMessage="No fee structures for this term">
        {() => (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "repeat(3, 1fr)" } }}>
            {list.map((f: FeeStructure) => (
              <FeeStructureCard key={f.id} structure={f} onPrint={() => handlePrintGrade(f.gradeLevel)} />
            ))}
          </Box>
        )}
      </DataState>
    </>
  );
}

function FeeStructureCard({ structure, onPrint }: { structure: FeeStructure; onPrint: () => void }) {
  const [showHistory, setShowHistory] = useState(false);
  const hasHistory = structure.versionHistory && structure.versionHistory.length > 0;

  // Convert breakdown to items array
  const items = Object.entries(structure.breakdown || {}).map(([name, amount]) => ({
    name,
    amount: Number(amount),
  }));

  return (
    <Card sx={{ position: "relative" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box>
            <Typography variant="h6">{structure.gradeLevel}</Typography>
            <Typography variant="caption" color="text.secondary">{structure.name}</Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Print">
              <IconButton size="small" onClick={onPrint}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Chip size="small" variant="outlined" label={`Term ${structure.term}`} />
          <Chip size="small" label={`v${structure.version}`} color={structure.version > 1 ? "primary" : "default"} variant="outlined" />
          {structure.isActive && <Chip size="small" label="Active" color="success" />}
        </Stack>

        {/* Version info */}
        {structure.version > 1 && structure.createdByName && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Last updated by {structure.createdByName}
          </Typography>
        )}

        <Divider sx={{ mb: 1.5 }} />
        {items.map((it) => (
          <Box key={it.name} sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
            <Typography variant="body2" color="text.secondary">{it.name}</Typography>
            <Typography variant="body2">{formatKES(it.amount)}</Typography>
          </Box>
        ))}
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>{formatKES(structure.totalAmount)}</Typography>
        </Box>

        {/* Version history - on-screen only, not printed */}
        {hasHistory && (
          <Box className="no-print" sx={{ mt: 2 }}>
            <Button
              size="small"
              startIcon={<HistoryIcon />}
              endIcon={<ExpandMoreIcon sx={{ transform: showHistory ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />}
              onClick={() => setShowHistory(!showHistory)}
            >
              Version History ({structure.versionHistory.length})
            </Button>
            <Collapse in={showHistory}>
              <Paper variant="outlined" sx={{ mt: 1, p: 1.5 }}>
                {structure.versionHistory.map((h, idx) => (
                  <Box key={idx} sx={{ mb: idx < structure.versionHistory.length - 1 ? 1 : 0, pb: idx < structure.versionHistory.length - 1 ? 1 : 0, borderBottom: idx < structure.versionHistory.length - 1 ? 1 : 0, borderColor: "divider" }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Version {h.version}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      — {h.createdByName || "Unknown"}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2">{formatKES(h.totalAmount)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
