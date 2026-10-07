/**
 * Fixed grade names used everywhere (classes, subjects, fee structures).
 * Always pick from this list instead of typing, so "PP1" never becomes "pp1" or "PP 1".
 * Remove the grades your school does not offer.
 */
export const GRADE_LEVELS = [
  "PP1",
  "PP2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

/** Same roles the backend allows for a class teacher. */
export const TEACHER_ROLES = ["teacher", "headteacher", "deputy", "hod", "class_teacher"];

/** Position of a grade in GRADE_LEVELS. Unknown names sort last. */
export function gradeRank(name) {
  const index = GRADE_LEVELS.indexOf(name);
  return index === -1 ? 999 : index;
}

/** Keep only staff who can teach. If the staff list has no role field, keep everyone. */
export function getTeachers(staff) {
  const list = Array.isArray(staff) ? staff : [];
  return list.filter((s) => !s.role || TEACHER_ROLES.includes(s.role));
}
