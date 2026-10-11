/**
 * Shared fetch helper for every API file (schoolApi, academicsApi, examsApi...).
 * Keep ONE copy of this. Each api file imports { request, toQuery } from "./http".
 */

import { getValidAccessToken, isSessionOver, refreshAccessToken } from "./authTokens";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://primapi.cresbyte.com/api";

export async function request(path, options = {}) {
  const send = (token) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    if (options.body instanceof FormData) delete headers["Content-Type"];
    return fetch(`${BASE_URL}${path}`, { ...options, headers });
  };

  // Refreshes first if the token is expired or about to be
  let token = await getValidAccessToken();
  let response = await send(token);

  // The server still rejected the token (for example another tab rotated it).
  // Refresh once and try again.
  if (response.status === 401 && token) {
    try {
      token = await refreshAccessToken();
      response = await send(token);
    } catch (error) {
      if (isSessionOver(error)) window.dispatchEvent(new Event("authLogout"));
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    // Surface field errors nicely
    let message = error.detail;
    if (!message) {
      const firstKey = Object.keys(error)[0];
      if (firstKey) {
        const val = error[firstKey];
        message = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
      }
    }
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) return null;
  const data = await response.json();
  return data.results || data;
}

export function toQuery(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "" && v !== "all",
    ),
  );
  const q = new URLSearchParams(clean).toString();
  return q ? `?${q}` : "";
}

export function toFormData(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (v instanceof Blob) {
      formData.append(k, v);
    } else if (typeof v === "object") {
      formData.append(k, JSON.stringify(v));
    } else {
      formData.append(k, String(v));
    }
  });
  return formData;
}

export { BASE_URL };
