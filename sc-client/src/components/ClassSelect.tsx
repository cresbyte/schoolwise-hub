/**
 * Class dropdown loaded from the mock API.
 * @module ClassSelect
 */
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { useClasses } from "@/hooks/domain";

interface ClassSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  allOption?: boolean;
  width?: number | string;
  disabled?: boolean;
}

/** Dropdown of all classes. */
export function ClassSelect({
  value,
  onChange,
  label = "Class",
  allOption = true,
  width = 200,
  disabled = false,
}: ClassSelectProps) {
  const { data } = useClasses();
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ width }}
      disabled={disabled}
    >
      {allOption && <MenuItem value="">All Classes</MenuItem>}
      {(data ?? []).map((c) => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default ClassSelect;
