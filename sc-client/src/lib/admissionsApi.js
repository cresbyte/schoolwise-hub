import { request, toQuery } from "./http";

/**
 * Admissions API.
 *
 * An Application moves through: submitted → under_review → interview_scheduled
 * → offered → accepted → (converted) OR rejected/withdrawn.
 *
 * `convertApplication(id, classId)` is the moment a Student row is born.
 * The backend creates the Student, the parent Users, and the initial Enrollment.
 */

export const admissionsApi = {
  // ---- public (no auth) -------------------------------------------------
  submitApplication: async (data) => {
    // Bypass `request()` on purpose: it always attaches whatever token is in
    // localStorage, and a stale token causes SimpleJWT to 401 before the
    // public endpoint is even reached.
    const BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://primapi.cresbyte.com/api";
    const response = await fetch(`${BASE_URL}/applications/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Submission failed" }));
      throw new Error(error.detail || "Submission failed");
    }
    return response.json();
  },

  // ---- staff ------------------------------------------------------------
  getApplications: (filters = {}) =>
    request(`/applications/${toQuery(filters)}`).catch(() => []),

  getApplication: (id) => request(`/applications/${id}/`),

  updateApplication: (id, data) =>
    request(`/applications/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /**
   * Move an application to a non-terminal status.
   * `extra` may carry { interviewDate, interviewNotes, offeredGrade, ... }.
   */
  setApplicationStatus: (id, status, extra = {}) =>
    request(`/applications/${id}/status/`, {
      method: "POST",
      body: JSON.stringify({ status, ...extra }),
    }),

  /**
   * Convert an offered application into a real student.
   * The class must belong to the current academic year.
   */
  convertApplication: (id, classId) =>
    request(`/applications/${id}/convert/`, {
      method: "POST",
      body: JSON.stringify({ classId }),
    }),
};

// Human labels + colors for the status pill.
export const APPLICATION_STATUS = {
  submitted: { label: "Submitted", color: "default" },
  under_review: { label: "Under review", color: "info" },
  interview_scheduled: { label: "Interview scheduled", color: "warning" },
  offered: { label: "Offered", color: "primary" },
  accepted: { label: "Accepted", color: "success" },
  rejected: { label: "Rejected", color: "error" },
  withdrawn: { label: "Withdrawn", color: "default" },
  enrolled: { label: "Enrolled", color: "success" },
};

export const APPLICATION_SOURCE = {
  website: "Website",
  walk_in: "Walk-in",
  phone: "Phone",
  referral: "Referral",
  other: "Other",
};
