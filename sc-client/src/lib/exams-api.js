/**
 * Exams, Scores & Report Cards API integration.
 * Keep this separate from the main api.js to avoid bloating.
 */

// Import the shared request function from your main api file
import { request } from "./api";

export const api.exams = {
  // ==========================================
  // 1. Exams Management
  // ==========================================
  /**
   * List exams. Optional params: { year, term, status }
   */
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/exams/${query ? `?${query}` : ""}`);
  },

  /** Get a single exam with its subjects */
  get: (id) => request(`/exams/${id}/`),

  /** Create a new exam (auto-creates ExamSubjects based on SubjectAssignment) */
  create: (data) => request("/exams/", { method: "POST", body: JSON.stringify(data) }),

  /** Update exam details */
  update: (id, data) => request(`/exams/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  /** Delete an exam (only allowed if status is 'draft' or 'upcoming') */
  delete: (id) => request(`/exams/${id}/`, { method: "DELETE" }),

  // ==========================================
  // 2. Score Entry (Per Exam Subject)
  // ==========================================
  /** Get all scores for a specific exam subject */
  getExamSubjectScores: (examSubjectId) =>
    request(`/exam-subjects/${examSubjectId}/scores/`),

  /** Bulk save scores for an exam subject */
  saveExamSubjectScores: (examSubjectId, scores) =>
    request(`/exam-subjects/${examSubjectId}/scores/`, {
      method: "POST",
      body: JSON.stringify({ scores }),
    }),

  // ==========================================
  // 3. Report Cards
  // ==========================================
  /** Get a computed report card for a specific student, year, and term */
  getStudentReportCard: (studentId, year, term) =>
    request(`/students/${studentId}/report-card/?year=${year}&term=${term}`),

  /** Get a list of all available report card terms for a student */
  getStudentReportCardsList: (studentId) =>
    request(`/students/${studentId}/report-cards/`),

  /** Get a summary of report cards for an entire class (for staff view) */
  getClassReportCards: (classId, year, term) =>
    request(`/report-cards/class/?class_id=${classId}&year=${year}&term=${term}`),

  // ==========================================
  // 4. Teacher Comments
  // ==========================================
  /** Get the class teacher's comment for a student for a specific term */
  getStudentComment: (studentId, year, term) =>
    request(`/students/${studentId}/comment/?year=${year}&term=${term}`),

  /** Save or update the class teacher's comment */
  saveStudentComment: (studentId, year, term, comment) =>
    request(`/students/${studentId}/comment/?year=${year}&term=${term}`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  // ==========================================
  // 5. Legacy / Performance Analytics (moved from main api.js)
  // ==========================================
  getClassPerformanceReport: (classId, examId) =>
    request(`/performance/?class_room=${classId}&exam=${examId}`).catch(() => ({ subjectStats: [] })),

  getSchoolPerformanceTrend: () =>
    request("/performance/trend/").catch(() => []),

  getKNEC7Best: (classId, examId) =>
    request(`/exams/knec7/?class_room=${classId}&exam=${examId}`).catch(() => []),
};
