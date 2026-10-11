import { request, toQuery } from "./http";

/**
 * Accountant-specific aggregations. Everything here is derived from the
 * existing /fees/ endpoints — no new models.
 */
export const accountantApi = {
  /** Term-to-date totals for the dashboard cards. */
  dashboard: (yearId, termId) =>
    request(`/fees/dashboard/${toQuery({ year: yearId, term: termId })}`)
      .catch(() => null),

  /** Daily collection totals, grouped by method. */
  collectionsByDay: (from, to) =>
    request(`/fees/collections-by-day/${toQuery({ from, to })}`)
      .catch(() => []),

  /** Outstanding balances grouped by grade. */
  outstandingByGrade: (yearId) =>
    request(`/fees/outstanding-by-grade/${toQuery({ year: yearId })}`)
      .catch(() => []),

  /** Pending / failed M-Pesa payments for reconciliation. */
 mpesaPending: () =>
  request(`/fees/payments/${toQuery({ method: "mpesa", status: "pending" })}`)
    .catch(() => []),
mpesaFailed: () =>
  request(`/fees/payments/${toQuery({ method: "mpesa", status: "failed" })}`)
    .catch(() => []),


  /** Manually confirm a pending M-Pesa payment with the receipt number. */
  reconcileMpesa: (paymentId, receipt, amount) =>
    request(`/fees/reconciliation/mpesa/${paymentId}/confirm/`, {
      method: "POST",
      body: JSON.stringify({ receipt, amount }),
    }),

  /** Bulk age report for the reports page. */
  agingReport: (yearId, asOf) =>
    request(`/fees/reports/aging/${toQuery({ year: yearId, as_of: asOf })}`)
      .catch(() => []),
};
