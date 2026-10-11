import { request, toQuery } from "./http";

/**
 * Attendance API.
 *
 * Two write paths:
 *   - bulk-save  → the whole class for one day, idempotent upsert
 *   - delete     → admin-only removal of a single row
 *
 * Reads are all GET. Summaries are pre-aggregated server-side.
 */

export const attendanceApi = {
  // ---- roster + bulk save ---------------------------------------------
  getRoster: (classRoom, date) =>
    request(`/attendance/roster/${toQuery({ class_room: classRoom, date })}`),

  bulkSave: (payload) =>
    request("/attendance/bulk-save/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // ---- list + delete ---------------------------------------------------
  listAttendance: (filters = {}) =>
    request(`/attendance/${toQuery(filters)}`).catch(() => []),

  deleteAttendance: (id) =>
    request(`/attendance/${id}/`, { method: "DELETE" }),

  // ---- summaries -------------------------------------------------------
  getClassSummary: (classId, from, to) =>
    request(`/attendance/summary/class/${classId}/${toQuery({ from, to })}`),

  getDaySummary: (date, classRoom = null) =>
    request(`/attendance/summary/day/${toQuery({ date, class_room: classRoom })}`),

  getStudentSummary: (studentId, from, to) =>
    request(`/attendance/summary/student/${studentId}/${toQuery({ from, to })}`),

  getAtRisk: (filters = {}) =>
    request(`/attendance/at-risk/${toQuery(filters)}`).catch(() => ({ students: [] })),
};

// Human labels + colors for status pills.
export const ATTENDANCE_STATUS = {
  present: { label: "Present", color: "success" },
  absent: { label: "Absent", color: "error" },
  late: { label: "Late", color: "warning" },
  excused: { label: "Excused", color: "info" },
};

export const ABSENCE_REASONS = [
  { value: "sick", label: "Sick" },
  { value: "family", label: "Family emergency" },
  { value: "transport", label: "Transport problem" },
  { value: "school_activity", label: "School activity" },
  { value: "medical", label: "Medical appointment" },
  { value: "fees", label: "Fee-related" },
  { value: "unknown", label: "Unknown" },
  { value: "other", label: "Other" },
];

// Convenience: today's date in YYYY-MM-DD, local time.
export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
