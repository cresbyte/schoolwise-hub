import axios from "axios";

const rawBaseURL = process.env.NEXT_PUBLIC_API_URL;
const baseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error.response exists and status is 401
    // Do not redirect if we're already trying to log in or register
    const isAuthPath =
      originalRequest.url.includes("login") ||
      originalRequest.url.includes("register") ||
      originalRequest.url.includes("password-reset") ||
      originalRequest.url.includes("refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthPath
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const response = await axios.post(`${baseURL}auth/refresh/`, {
            refresh: refreshToken,
          });

          if (response.status === 200) {
            localStorage.setItem("accessToken", response.data.access);
            if (response.data.refresh) {
                localStorage.setItem("refreshToken", response.data.refresh);
            }
            api.defaults.headers.common["Authorization"] =
              `Bearer ${response.data.access}`;

            // Dispatch custom event to notify AuthContext of token refresh
            window.dispatchEvent(
              new CustomEvent("tokenRefreshed", {
                detail: { access: response.data.access },
              }),
            );

            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");

          // Dispatch logout event
          window.dispatchEvent(new Event("authLogout"));
          window.location.href = "/login";
        }
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Dispatch logout event
        window.dispatchEvent(new Event("authLogout"));
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
