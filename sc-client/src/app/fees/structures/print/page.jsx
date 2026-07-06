"use client";

/**
 * Printable fee structures page - per grade, per term, or full year.
 * Uses browser print via CSS classes matching existing print patterns.
 */
import { useState, useMemo, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageGuard } from "@/components/common/PageGuard";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatKES } from "@/lib/utils";


export default function PrintableFeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gradeLevel = searchParams.get("gradeLevel");
  const year = searchParams.get("year");
  const term = searchParams.get("term");

  return (
    <DashboardLayout>
      <PageGuard permission="fees.view">
        <PrintableFeesContent
          gradeLevel={gradeLevel || undefined}
          year={year ? parseInt(year) : undefined}
          term={term ? parseInt(term) : undefined}
          onBack={() => router.push("/fees/structures")}
        />
      </PageGuard>
    </DashboardLayout>
  );
}

function PrintableFeesContent({
  gradeLevel,
  year,
  term,
  onBack
}) {
  const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
  const [selectedGrade, setSelectedGrade] = useState(gradeLevel || "");

  // Fetch school info
  const { data: school, loading: schoolLoading } = useAsync(() => api.getSchool(), []);

  // Fetch fee structures
  const fetchParams = useMemo(() => {
    const params = { year: selectedYear, is_active: true };
    if (selectedGrade) params.gradeLevel = selectedGrade;
    if (term) params.term = term;
    return params;
  }, [selectedYear, selectedGrade, term]);

  const { data: structures, loading: structuresLoading, error } = useAsync(
    async () => {
      if (!selectedGrade) {
        // If no grade selected, get all structures for the year
        const queryParams = { year: selectedYear, is_active: 1 };
        if (term) queryParams.term = term;
        return api.getFeeStructures(queryParams);
      }
      if (term) {
        return api.getFeeStructuresForPrint(selectedGrade, selectedYear, term);
      }
      return api.getFeeStructuresForPrint(selectedGrade, selectedYear);
    },
    [fetchParams]
  );

  const structuresList = (structures || []);

  // Group by term for full-year view
  const structuresByTerm = useMemo(() => {
    if (term) {
      return { [term]: structuresList };
    }
    const grouped = { 1: [], 2: [], 3: [] };
    structuresList.forEach((s) => {
      if (!grouped[s.term]) grouped[s.term] = [];
      grouped[s.term].push(s);
    });
    return grouped;
  }, [structuresList, term]);

  // Calculate grand total for full year
  const grandTotal = useMemo(() => {
    if (term || !selectedGrade) return 0;
    return structuresList.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  }, [structuresList, term, selectedGrade]);

  // Available grades from data
  const availableGrades = useMemo(() => {
    if (!structuresList) return [];
    return [...new Set(structuresList.map((s) => s.gradeLevel))].sort();
  }, [structuresList]);

  const isLoading = schoolLoading || structuresLoading;
  const schoolData = school || {
    name: "Primrose Private Academy",
    motto: "Excellence in Education",
    address: "",
    physical_address: "",
    phone: "",
    email: "",
    county: "",
    sub_county: "",
  };

  const handlePrint = () => {
    window.print();
  };

  // Format address
  const addressLine = [
    schoolData.physical_address || schoolData.address,
    schoolData.county ? `${schoolData.county} County` : "",
    schoolData.sub_county ? `${schoolData.sub_county} Sub-County` : ""
  ].filter(Boolean).join(", ");

  // Title based on scope
  const pageTitle = selectedGrade
    ? `${selectedGrade} Fee Structures - ${selectedYear}`
    : term
      ? `Term ${term} Fee Structures - ${selectedYear}`
      : `Fee Structures - ${selectedYear}`;

  return (
    <Box>
      {/* On-screen controls - hidden when printing */}
      <Box className="no-print" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
            Back to Fee Structures
          </Button>
          <Stack direction="row" spacing={2} alignItems="center">
            {!gradeLevel && (
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="caption" color="text.secondary">
                  Filter by Grade (optional)
                </Typography>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 6, width: "100%" }}
                >
                  <option value="">All Grades</option>
                  {["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </Box>
            )}
            <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={handlePrint}>
              Print
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Printable document */}
      <Card className="print-letterhead" sx={{ p: 3, bgcolor: "background.paper" }}>
        <CardContent>
          {/* School Letterhead - shown only when printing */}
          <Box className="print-letterhead" sx={{ display: "none", mb: 3, textAlign: "center" }}>
            {schoolData.logo && (
              <img src={schoolData.logo} alt="School Logo" style={{ width: 80, height: 80, objectFit: "contain", margin: "0 auto 16px" }} />
            )}
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{schoolData.name}</Typography>
            <Typography variant="subtitle1" color="text.secondary">{schoolData.motto}</Typography>
            <Typography variant="body2" color="text.secondary">{addressLine}</Typography>
            <Typography variant="body2" color="text.secondary">{schoolData.phone} | {schoolData.email}</Typography>
            {schoolData.registration_number && (
              <Typography variant="caption" color="text.secondary">Reg No: {schoolData.registration_number}</Typography>
            )}
            <Divider sx={{ my: 2 }} />
          </Box>

          {/* On-screen header */}
          <Box className="no-print">
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>{schoolData.name}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{pageTitle}</Typography>
          </Box>

          {/* Printed title */}
          <Box className="print-only" sx={{ display: "none", mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{pageTitle}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Generated on {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>{error.message}</Alert>
          )}

          {isLoading ? (
            <Box>
              {[1, 2, 3].map(i => (
                <Box key={i} sx={{ mb: 3 }}>
                  <Skeleton variant="text" width={200} height={40} />
                  <Skeleton variant="rectangular" height={200} />
                </Box>
              ))}
            </Box>
          ) : structuresList.length === 0 ? (
            <Alert severity="info">No fee structures found for the selected criteria.</Alert>
          ) : (
            <Box>
              {/* Single term view */}
              {term && structuresByTerm[term] && (
                <FeeBreakdownTable
                  structures={structuresByTerm[term]}
                  school={schoolData}
                  term={term}
                  year={selectedYear}
                />
              )}

              {/* Full year view - grouped by term */}
              {!term && Object.entries(structuresByTerm).map(([termNum, termStructures]) => (
                termStructures.length > 0 && (
                  <Box key={termNum} className="fee-structure-print" sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
                      Term {termNum}
                    </Typography>
                    <FeeBreakdownTable
                      structures={termStructures}
                      school={schoolData}
                      term={parseInt(termNum)}
                      year={selectedYear}
                    />
                  </Box>
                )
              ))}

              {/* Grand total for full year */}
              {!term && grandTotal > 0 && selectedGrade && (
                <Box sx={{ mt: 4, pt: 3, borderTop: 2, borderColor: "primary.main" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Annual Total for {selectedGrade}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>{formatKES(grandTotal)}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Total across all three terms
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: "divider", textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              {schoolData.name} — {schoolData.motto}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function FeeBreakdownTable({
  structures,
  school,
  term,
  year
}) {
  // If single grade, show detailed breakdown
  // If multiple grades, show summary table
  const isSingleGrade = structures.every((s, _, arr) => s.gradeLevel === arr[0].gradeLevel);

  if (isSingleGrade && structures.length === 1) {
    const structure = structures[0];
    const items = Object.entries(structure.breakdown || {}).map(([name, amount]) => ({
      name,
      amount: Number(amount),
    }));

    return (
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          {structure.gradeLevel}
        </Typography>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
          <Box sx={{ p: 2, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Fee Item</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Amount (KES)</Typography>
            </Box>
          </Box>
          {items.map((item) => (
            <Box key={item.name} sx={{ p: 2, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">{item.name}</Typography>
                <Typography variant="body2">{formatKES(item.amount)}</Typography>
              </Box>
            </Box>
          ))}
          <Box sx={{ p: 2, bgcolor: "primary.main", display: "flex", justifyContent: "space-between" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "white" }}>Total</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "white" }}>{formatKES(structure.totalAmount)}</Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Multiple grades - show summary table
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
      <Box sx={{ p: 2, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Grade Level</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: "right" }}>Term {term} Total</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: "right" }}>Per Item</Typography>
        </Box>
      </Box>
      {structures.map((structure) => {
        const items = Object.entries(structure.breakdown || {});
        return (
          <Box key={structure.id} sx={{ p: 2, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{structure.gradeLevel}</Typography>
              <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 700, color: "primary.main" }}>{formatKES(structure.totalAmount)}</Typography>
              <Typography variant="body2" sx={{ textAlign: "right" }}>{items.length} items</Typography>
            </Box>
            <Box sx={{ mt: 1, pl: 2 }}>
              {items.map(([name, amount]) => (
                <Box key={name} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">{name}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatKES(Number(amount))}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        );
      })}
      <Box sx={{ p: 2, bgcolor: "primary.main" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "white" }}>Total</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "white" }}>
            {formatKES(structures.reduce((sum, s) => sum + Number(s.totalAmount), 0))}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
