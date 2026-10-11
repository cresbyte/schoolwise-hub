import { request, toQuery } from "./http";

/**
 * Parent portal API.
 *
 * All endpoints respect the parent's JWT — the backend checks that a
 * parent can only see their own children's data.
 */

export const portalApi = {
  getChildren: () => request("/portal/children/").catch(() => []),

  // Reuse existing endpoints — they already allow parents:
  getStudent: (id) => request(`/students/${id}/`),
  getStudentAttendance: (id, from, to) =>
    request(`/attendance/summary/student/${id}/${toQuery({ from, to })}`),
  getStudentEnrollments: (id) =>
    request(`/academics/enrollments/${toQuery({ student: id })}`).catch(() => []),

  getStudentFeeSummary: (id) => request(`/fees/students/${id}/summary/`),
  getStudentStatement: (id) => request(`/fees/students/${id}/statement/`),
  getStudentInvoices: (studentId) =>
    request(`/fees/invoices/${toQuery({ student: studentId })}`).catch(() => []),

  // Exams: released report cards for a child
  getExamsForStudent: (studentId) =>
  request(`/exams/released-for-student/${studentId}/`).catch(() => []),


// Report card for one exam
getStudentReportCard: (studentId, examId) =>
  request(`/exams/${examId}/report-card/${studentId}/`),

  // Calendar events (all parents see the same school calendar)
  getCalendarEvents: (filters = {}) =>
    request(`/school/calendar-events/${toQuery(filters)}`).catch(() => []),

  // M-Pesa
  /**
   * Initiate an STK push for a student.
   * @param {object} data - { studentId, phone, amount, chargeId? }
   *   chargeId: optional — if provided, on payment success the student is
   *   automatically opted into that optional charge and an invoice line is created.
   */
  initiateStkPush: (data) =>
    request("/fees/mpesa/stk-push/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  checkMpesaStatus: (checkoutRequestId) =>
    request(`/fees/mpesa/status/${checkoutRequestId}/`),


  // lib/portalApi.js — inside portalApi object

  getPendingCharges: (studentId) =>
    request(`/fees/students/${studentId}/pending-charges/`),

  optInCharge: (chargeId, studentId) =>
    request(`/fees/charges/${chargeId}/opt-in/`, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),

  optOutCharge: (chargeId, studentId) =>
    request(`/fees/charges/${chargeId}/opt-out/`, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),
};



