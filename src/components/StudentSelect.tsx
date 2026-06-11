/**
 * Autocomplete student search showing name, class and balance.
 * @module StudentSelect
 */
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useStudents } from "@/hooks/domain";
import type { Student } from "@/lib/types";
import { formatKES } from "@/lib/utils";

interface StudentSelectProps {
  value: Student | null;
  onChange: (student: Student | null) => void;
  label?: string;
}

/** Searchable student selector. */
export function StudentSelect({ value, onChange, label = "Search student" }: StudentSelectProps) {
  const { data, loading } = useStudents();
  return (
    <Autocomplete
      options={data ?? []}
      loading={loading}
      value={value}
      onChange={(_, v) => onChange(v)}
      getOptionLabel={(o) => `${o.firstName} ${o.lastName} (${o.admissionNumber})`}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderOption={(props, o) => (
        <li {...props} key={o.id}>
          <div>
            <div style={{ fontWeight: 600 }}>
              {o.firstName} {o.lastName}
            </div>
            <div style={{ fontSize: 12, color: "#5a6776" }}>
              {o.admissionNumber} · {o.className} · Bal: {formatKES(o.feeBalance)}
            </div>
          </div>
        </li>
      )}
      renderInput={(params) => <TextField {...params} label={label} size="small" />}
      sx={{ minWidth: 320 }}
    />
  );
}

export default StudentSelect;