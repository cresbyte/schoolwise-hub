/**
 * School module API integration for SchoolWise Hub.
 * Handles: Academic Years, Terms, Grade Levels, Calendar Events, Current Period.
 */

import { request, toQuery } from "./http";


// ============================================================
// School API
// ============================================================

export const schoolApi = {
  // ============================================================
  // Current Period (replaces School.current_term / current_year)
  // ============================================================
  getCurrentPeriod: () =>
    request("/school/current-period/").catch(() => ({
      academic_year: null,
      term: null,
    })),

  // ============================================================
  // Academic Years
  // ============================================================
  getAcademicYears: (filters) => request(`/school/academic-years/${toQuery(filters)}`),
  getAcademicYear: (id) => request(`/school/academic-years/${id}/`),
  createAcademicYear: (data) =>
    request("/school/academic-years/", { method: "POST", body: JSON.stringify(data) }),
  updateAcademicYear: (id, data) =>
    request(`/school/academic-years/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAcademicYear: (id) =>
    request(`/school/academic-years/${id}/`, { method: "DELETE" }),
  activateAcademicYear: (id) =>
    request(`/school/academic-years/${id}/activate/`, { method: "POST" }),
  closeAcademicYear: (id) =>
    request(`/school/academic-years/${id}/close/`, { method: "POST" }),

  // ============================================================
  // Terms
  // ============================================================
  getTerms: (filters) => request(`/school/terms/${toQuery(filters)}`),
  getTerm: (id) => request(`/school/terms/${id}/`),
  createTerm: (data) =>
    request("/school/terms/", { method: "POST", body: JSON.stringify(data) }),
  updateTerm: (id, data) =>
    request(`/school/terms/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTerm: (id) => request(`/school/terms/${id}/`, { method: "DELETE" }),
  setCurrentTerm: (id) =>
    request(`/school/terms/${id}/set-current/`, { method: "POST" }),

  // ============================================================
  // Grade Levels
  // ============================================================
  getGradeLevels: () => request("/school/grade-levels/"),
  getGradeLevel: (id) => request(`/school/grade-levels/${id}/`),
  createGradeLevel: (data) =>
    request("/school/grade-levels/", { method: "POST", body: JSON.stringify(data) }),
  updateGradeLevel: (id, data) =>
    request(`/school/grade-levels/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteGradeLevel: (id) =>
    request(`/school/grade-levels/${id}/`, { method: "DELETE" }),

  // ============================================================
  // Calendar Events
  // ============================================================
  getCalendarEvents: (filters) =>
    request(`/school/calendar-events/${toQuery(filters)}`).catch(() => []),
  getCalendarEvent: (id) => request(`/school/calendar-events/${id}/`),
  createCalendarEvent: (data) =>
    request("/school/calendar-events/", { method: "POST", body: JSON.stringify(data) }),
  updateCalendarEvent: (id, data) =>
    request(`/school/calendar-events/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCalendarEvent: (id) =>
    request(`/school/calendar-events/${id}/`, { method: "DELETE" }),
  approveCalendarEvent: (id) =>
    request(`/school/calendar-events/${id}/approve/`, { method: "POST" }),
  rejectCalendarEvent: (id, reason) =>
    request(`/school/calendar-events/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// ============================================================
// Constants / label maps (used across the pages)
// ============================================================

export const YEAR_STATUS = {
  draft: { label: "Draft", color: "warning" },
  active: { label: "Active", color: "success" },
  closed: { label: "Closed", color: "default" },
};

export const EVENT_CATEGORY = {
  exam: { label: "Exam", color: "error" },
  holiday: { label: "Holiday", color: "info" },
  closure: { label: "Closure", color: "default" },
  meeting: { label: "Meeting", color: "secondary" },
  activity: { label: "Activity", color: "primary" },
  trip: { label: "Trip", color: "primary" },
  deadline: { label: "Deadline", color: "warning" },
  other: { label: "Other", color: "default" },
};

export const EVENT_SCOPE = {
  school: { label: "School-wide" },
  grade: { label: "Grade level(s)" },
};

export const APPROVAL_STATUS = {
  pending: { label: "Pending", color: "warning" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "error" },
};
