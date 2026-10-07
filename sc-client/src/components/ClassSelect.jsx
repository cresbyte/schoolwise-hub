// @/components/ClassSelect.jsx
import { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { api } from "@/lib/MockExamsApi";

export function ClassSelect({ value, onChange, allOption = false, label = "Class" }) {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.getClasses().then(setClasses);
  }, []);

  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ width: 240 }}
    >
      {allOption && <MenuItem value="">All Classes</MenuItem>}
      {classes.map((c) => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
