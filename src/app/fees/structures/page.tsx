"use client";

/**
 * Fee structures by grade level / term.
 * @module fees/structures/page
 */
import { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { StatusChip } from "@/components/StatusChip";
import { RoleGuard } from "@/components/RoleGuard";
import { useAsync } from "@/hooks/useAsync";
import * as api from "@/lib/mockApi";
import { formatKES } from "@/lib/utils";

export default function FeeStructuresPage() {
  return (
    <DashboardLayout>
      <FeeStructuresContent />
    </DashboardLayout>
  );
}

/** Fee structures content. */
function FeeStructuresContent() {
  const router = useRouter();
  const [term, setTerm] = useState("2");
  const { data, loading, error, refetch } = useAsync(() => api.getFeeStructures({ year: 2026, term: Number(term) }), [term]);
  const list = data ?? [];
  return (
    <>
      <PageHeader
        title="Fee Structures"
        subtitle="Greenfield Private Academy · 2026"
        actions={
          <RoleGuard permission="finance.*">
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/fees/structures/new")}>
              Add Structure
            </Button>
          </RoleGuard>
        }
      />
      <Card sx={{ p: 2, mb: 2 }}>
        <TextField select size="small" label="Term" value={term} onChange={(e) => setTerm(e.target.value)} sx={{ width: 150 }}>
          <MenuItem value="1">Term 1</MenuItem>
          <MenuItem value="2">Term 2</MenuItem>
          <MenuItem value="3">Term 3</MenuItem>
        </TextField>
      </Card>
      <DataState loading={loading} error={error} data={list} onRetry={refetch} isEmpty={(d: any) => d.length === 0} emptyMessage="No fee structures for this term">
        {() => (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "repeat(3, 1fr)" } }}>
            {list.map((f: any) => (
              <Card key={f.id}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Box>
                      <Typography variant="h6">{f.gradeLevel}</Typography>
                      <Typography variant="caption" color="text.secondary">{f.name}</Typography>
                    </Box>
                    <StatusChip status={f.status} />
                  </Box>
                  <Chip size="small" variant="outlined" label={f.boardingStatus === "all" ? "All" : f.boardingStatus} sx={{ mb: 1.5 }} />
                  <Divider sx={{ mb: 1.5 }} />
                  {f.items.map((it: any) => (
                    <Box key={it.id} sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                      <Typography variant="body2" color="text.secondary">{it.name}{it.isOptional ? " (opt.)" : ""}</Typography>
                      <Typography variant="body2">{formatKES(it.amount)}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>{formatKES(f.totalAmount)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DataState>
    </>
  );
}
