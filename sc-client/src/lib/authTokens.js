/**
 * The one place that owns the access and refresh tokens.
 *
 * Every API call asks getValidAccessToken() for a token. If the token is
 * expired (or about to be), it is refreshed first.
 *
 * Only one refresh runs at a time. Refresh tokens can be used once (rotation +
 * blacklist), so two refreshes in parallel would make the second one fail and
 * log the user out.
 */

import { jwtDecode } from "jwt-decode";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://primapi.cresbyte.com/api").replace(
  /\/$/,
  "",
);

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const EXPIRY_BUFFER_MS = 30 * 1000; // refresh when less than 30 seconds are left

function isExpiring(token) {
  try {
    const { exp } = jwtDecode(token);
    return exp * 1000 - Date.now() < EXPIRY_BUFFER_MS;
  } catch {
    return true;
  }
}

let inFlight = null;

/** Gets a new access token. Calls made while a refresh is running share it. */
export function refreshAccessToken() {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) throw Object.assign(new Error("No refresh token"), { status: 401 });

    const res = await fetch(`${API_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      // Another tab may have refreshed a moment ago. If so, use its token.
      const latest = localStorage.getItem(ACCESS_KEY);
      if (latest && !isExpiring(latest)) return latest;
      throw Object.assign(new Error("Refresh failed"), { status: res.status });
    }

    const data = await res.json();
    localStorage.setItem(ACCESS_KEY, data.access);
    if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
    window.dispatchEvent(new CustomEvent("tokenRefreshed", { detail: { access: data.access } }));
    return data.access;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/** True when the refresh token itself was rejected, so the user must log in again. */
export function isSessionOver(error) {
  return error?.status === 400 || error?.status === 401;
}

/** Returns a token that is safe to use now, or null if the user is signed out. */
export async function getValidAccessToken() {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(ACCESS_KEY);
  if (!token) return null;
  if (!isExpiring(token)) return token;

  try {
    return await refreshAccessToken();
  } catch (error) {
    if (isSessionOver(error)) {
      window.dispatchEvent(new Event("authLogout"));
      return null;
    }
    // Network or server problem: stay signed in and let the request try.
    return token;
  }
}
