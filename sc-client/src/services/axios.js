import axios from "axios";
import { getValidAccessToken, isSessionOver, refreshAccessToken } from "@/lib/authTokens";

const rawBaseURL = process.env.NEXT_PUBLIC_API_URL;
const baseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;

const api = axios.create({
  baseURL,
});

// Login, password reset and refresh never need a token, and a 401 there is a real answer
const isAuthPath = (url = "") =>
  ["login", "register", "password-reset", "refresh"].some((p) => url.includes(p));

const endSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("authLogout"));
  window.location.href = "/parent-portal";
};

// Refreshes the token first if it is expired or about to be
api.interceptors.request.use(async (config) => {
  if (!isAuthPath(config.url)) {
    const token = await getValidAccessToken();
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// If the server still says 401, refresh once and retry the same request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthPath(original.url)
    ) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers["Authorization"] = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        if (isSessionOver(refreshError)) endSession();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
