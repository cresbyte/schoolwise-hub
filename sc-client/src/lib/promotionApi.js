import { request, toQuery } from "./http";

/**
 * Promotion API.
 *
 * The promotion flow is batch-based:
 *   1. suggest-mapping   → default stream mapping for a grade
 *   2. POST /batches/    → creates a PREVIEWED batch (no writes yet)
 *   3. PATCH row         → per-student outcome overrides
 *   4. execute           → applies the batch (writes enrollments)
 *   5. undo              → reverses an executed batch (24h window)
 */

export const promotionApi = {
  suggestMapping: (fromYear, toYear, fromGrade) =>
    request("/academics/promotions/suggest-mapping/", {
      method: "POST",
      body: JSON.stringify({ fromYear, toYear, fromGrade }),
    }),

  listBatches: () =>
    request("/academics/promotions/batches/").catch(() => []),

  createBatch: (payload) =>
    request("/academics/promotions/batches/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getBatch: (id) => request(`/academics/promotion-batches/${id}/`),

  updateRow: (batchId, rowId, payload) =>
    request(`/academics/promotion-batches/${batchId}/students/${rowId}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  execute: (batchId) =>
    request(`/academics/promotion-batches/${batchId}/execute/`, {
      method: "POST",
    }),

  undo: (batchId, windowHours = 24) =>
    request(`/academics/promotion-batches/${batchId}/undo/`, {
      method: "POST",
      body: JSON.stringify({ windowHours }),
    }),
};

export const PROMOTION_STATUS = {
  previewed: { label: "Previewed", color: "info" },
  executed: { label: "Executed", color: "success" },
  undone: { label: "Undone", color: "default" },
};

export const PROMOTION_OUTCOME = {
  promoted: { label: "Promote", color: "primary" },
  repeated: { label: "Repeat", color: "warning" },
  graduated: { label: "Graduate", color: "success" },
  skipped: { label: "Skip", color: "default" },
};
