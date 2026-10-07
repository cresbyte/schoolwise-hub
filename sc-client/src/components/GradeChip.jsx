// @/components/GradeChip.jsx
import Chip from '@mui/material/Chip';

const gradeColors = {
  'A': 'success',
  'B': 'primary',
  'C': 'info',
  'D': 'warning',
  'E': 'error',
};

export function GradeChip({ grade }) {
  return (
    <Chip
      label={grade}
      size="small"
      color={gradeColors[grade] || 'default'}
      variant="outlined"
    />
  );
}
