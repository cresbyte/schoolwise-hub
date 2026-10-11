import { request, toQuery } from "./http";

export const feesApi = {
  // ---- fee structures --------------------------------------------------
  listStructures: (filters = {}) =>
    request(`/fees/structures/${toQuery(filters)}`).catch(() => []),
  getStructure: (id) => request(`/fees/structures/${id}/`),
  createStructure: (data) =>
    request("/fees/structures/", { method: "POST", body: JSON.stringify(data) }),
  updateStructure: (id, data) =>
    request(`/fees/structures/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStructure: (id) =>
    request(`/fees/structures/${id}/`, { method: "DELETE" }),

  copyStructuresForward: (fromYear, toYear, overwrite = false) =>
  request("/fees/structures/copy-forward/", {
    method: "POST",
    body: JSON.stringify({ fromYear, toYear, overwrite }),
  }),

  // ---- charges ---------------------------------------------------------
  listCharges: (filters = {}) =>
    request(`/fees/charges/${toQuery(filters)}`).catch(() => []),
  getCharge: (id) => request(`/fees/charges/${id}/`),
  createCharge: (data) =>
    request("/fees/charges/", { method: "POST", body: JSON.stringify(data) }),
  updateCharge: (id, data) =>
    request(`/fees/charges/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCharge: (id) =>
    request(`/fees/charges/${id}/`, { method: "DELETE" }),
  activateCharge: (id) =>
    request(`/fees/charges/${id}/activate/`, { method: "POST" }),
  cancelCharge: (id, reason = "") =>
    request(`/fees/charges/${id}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  optInCharge: (id, studentId) =>
    request(`/fees/charges/${id}/opt-in/`, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),
    previewCharge: (id) => request(`/fees/charges/${id}/preview/`),

    // lib/feesApi.js — inside feesApi object

  getChargeRoster: (id, filters = {}) =>
    request(`/fees/charges/${id}/roster/${toQuery(filters)}`),
  optOutCharge: (id, studentId) =>
    request(`/fees/charges/${id}/opt-out/`, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),
  // optInCharge already exists — no change needed

  // ---- invoices --------------------------------------------------------
  listInvoices: (filters = {}) =>
    request(`/fees/invoices/${toQuery(filters)}`).catch(() => []),
  getInvoice: (id) => request(`/fees/invoices/${id}/`),
  generateInvoices: (year, term) =>
    request("/fees/invoices/generate/", {
      method: "POST",
      body: JSON.stringify({ year, term }),
    }),

  // ---- payments --------------------------------------------------------
  listPayments: (filters = {}) =>
    request(`/fees/payments/${toQuery(filters)}`).catch(() => []),
  recordPayment: (data) =>
    request("/fees/payments/", { method: "POST", body: JSON.stringify(data) }),

  // ---- summaries -------------------------------------------------------
  getOutstanding: (filters = {}) =>
    request(`/fees/outstanding/${toQuery(filters)}`).catch(() => []),
  getCollectionSummary: (filters = {}) =>
    request(`/fees/summary/${toQuery(filters)}`).catch(() => ({})),
  getStudentSummary: (studentId) =>
    request(`/fees/students/${studentId}/summary/`),
  getStudentStatement: (studentId) =>
    request(`/fees/students/${studentId}/statement/`),

  // ---- M-Pesa ----------------------------------------------------------
  initiateStkPush: (data) =>
    request("/fees/mpesa/stk-push/", { method: "POST", body: JSON.stringify(data) }),
  checkMpesaStatus: (checkoutRequestId) =>
    request(`/fees/mpesa/status/${checkoutRequestId}/`),
};

export const PAYMENT_METHODS = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

export const CHARGE_SCOPES = [
  { value: "school", label: "Whole school" },
  { value: "grade", label: "Grade level(s)" },
  { value: "class", label: "Class(es)" },
  { value: "students", label: "Specific students" },
];

export function formatKES(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}
