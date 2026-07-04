"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { DataState } from "@/components/DataState";
import { useAsync } from "@/hooks/useAsync";
import { useNotification } from "@/context/NotificationContext";
import { api } from "@/lib/api";

export default function SubjectSettingsPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { data, loading, error, refetch } = useAsync(() => api.getSubjectById(id), [id]);
  const [rules, setRules] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  if (data && !isInitialized) {
    setRules(data.gradingSystem || []);
    setIsInitialized(true);
  }

  const addRule = () => {
    setRules([...rules, { grade: "", min: 0, max: 0, color: "#757575", comment: "" }]);
  };

  const removeRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const save = async () => {
    try {
      await api.updateSubject(id, { gradingSystem: rules });
      showNotification("Grading system updated", "success");
      refetch();
    } catch (err) {
      showNotification(err.message || "Failed to update grading system", "error");
    }
  };

  return (
    <>
      <PageHeader
        title={data ? `${data.name} Settings` : "Subject Settings"}
        subtitle="Manage grading system and color coding"
        actions={<Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/settings/classes/subjects")}>Back</Button>}
      />

      <DataState loading={loading} error={error} data={data} onRetry={refetch}>
        {(s) => (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Grading System</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Define the mark ranges and associated grades for this subject.
                  These will be used for auto-grading during marks entry and in report cards.
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Grade (e.g. A)</TableCell>
                      <TableCell>Min Mark</TableCell>
                      <TableCell>Max Mark</TableCell>
                      <TableCell>Color</TableCell>
                      <TableCell>Comment (Optional)</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rules.map((rule, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField size="small" value={rule.grade} onChange={(e) => updateRule(index, "grade", e.target.value)} sx={{ width: 80 }} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" type="number" value={rule.min} onChange={(e) => updateRule(index, "min", Number(e.target.value))} sx={{ width: 80 }} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" type="number" value={rule.max} onChange={(e) => updateRule(index, "max", Number(e.target.value))} sx={{ width: 80 }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <input type="color" value={rule.color || "#757575"} onChange={(e) => updateRule(index, "color", e.target.value)} style={{ width: 32, height: 32, border: "none", padding: 0, cursor: "pointer" }} />
                            <Typography variant="caption">{rule.color || "#757575"}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField size="small" fullWidth value={rule.comment || ""} onChange={(e) => updateRule(index, "comment", e.target.value)} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton color="error" onClick={() => removeRule(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                  <Button startIcon={<AddIcon />} onClick={addRule}>Add Grade Level</Button>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={save}>Save Changes</Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </DataState>
    </>
  );
}
