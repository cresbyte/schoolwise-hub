import { jwtDecode } from "jwt-decode";
import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import api from "../services/axios";
import { PERMISSIONS } from "@/lib/constants";
import { getValidAccessToken, refreshAccessToken, isSessionOver } from "@/lib/authTokens";

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

const REFRESH_BEFORE_EXPIRY_MS = 60 * 1000; // refresh 1 minute before expiry
const RETRY_DELAY_MS = 30 * 1000; // retry after a network error
const MAX_TIMEOUT_MS = 2 ** 31 - 1; // setTimeout upper limit

// Build the user object from a decoded JWT
const mapTokenToUser = (decoded) => ({
    id: decoded.user_id,
    name: decoded.name,
    firstName: decoded.firstName || "",
    lastName: decoded.lastName || "",
    gender: decoded.gender || "",
    birthDate: decoded.birthDate || "",
    phone: decoded.phone,
    role: decoded.role,
    photo: decoded.photo,
    staffId: decoded.staffId,
    studentIds: decoded.studentIds || [],
    classTeacherOf: decoded.classTeacherOf || [],
    subjectsTaught: decoded.subjectsTaught || [],
    email: decoded.email || "",
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const refreshTimeoutRef = useRef(null);

    const clearRefreshTimer = useCallback(() => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = null;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        clearRefreshTimer();
        setUser(null);
        setIsAuthenticated(false);
    }, [clearRefreshTimer]);

    // Proactively refresh the token shortly before it expires.
    // Uses the same shared refreshAccessToken() as the axios interceptor, so
    // concurrent refreshes are de-duplicated and the refresh token is never
    // reused by two requests at once.
    const scheduleTokenRefresh = useCallback(
        (token, delayOverride) => {
            clearRefreshTimer();

            let delay;
            if (typeof delayOverride === "number") {
                delay = delayOverride;
            } else {
                try {
                    const decoded = jwtDecode(token);
                    delay = decoded.exp * 1000 - Date.now() - REFRESH_BEFORE_EXPIRY_MS;
                } catch (error) {
                    console.error("Error scheduling refresh:", error);
                    return;
                }
            }
            delay = Math.min(Math.max(delay, 0), MAX_TIMEOUT_MS);

            refreshTimeoutRef.current = setTimeout(async () => {
                try {
                    const access = await refreshAccessToken();
                    // Listener below updates user state and schedules the next refresh
                    window.dispatchEvent(new CustomEvent("tokenRefreshed", { detail: { access } }));
                } catch (error) {
                    console.error("Proactive token refresh failed:", error);
                    if (isSessionOver(error)) {
                        logout();
                    } else {
                        // Network error or server hiccup: keep the session and try again
                        scheduleTokenRefresh(token, RETRY_DELAY_MS);
                    }
                }
            }, delay);
        },
        [clearRefreshTimer, logout]
    );

    // Rebuild user state from the current (valid) token
    const refreshUser = useCallback(async () => {
        if (!localStorage.getItem("accessToken")) return;

        try {
            // Refreshes first if the token is expired or about to expire
            const token = await getValidAccessToken();
            if (!token) {
                logout();
                return;
            }

            const decoded = jwtDecode(token);
            setUser(mapTokenToUser(decoded));
            setIsAuthenticated(true);
            scheduleTokenRefresh(token);
        } catch (error) {
            console.error("Failed to restore session:", error);
            // Only end the session when it is truly over (invalid or rejected token).
            // A network error keeps the tokens so the next attempt can succeed.
            if (isSessionOver(error) || error?.name === "InvalidTokenError") {
                logout();
            }
        }
    }, [logout, scheduleTokenRefresh]);

    useEffect(() => {
        let cancelled = false;

        const initializeAuth = async () => {
            try {
                await refreshUser();
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        initializeAuth();

        const handleTokenRefresh = () => {
            refreshUser();
        };

        const handleAuthLogout = () => {
            logout();
        };

        window.addEventListener("tokenRefreshed", handleTokenRefresh);
        window.addEventListener("authLogout", handleAuthLogout);

        return () => {
            cancelled = true;
            window.removeEventListener("tokenRefreshed", handleTokenRefresh);
            window.removeEventListener("authLogout", handleAuthLogout);
            clearRefreshTimer();
        };
    }, [refreshUser, logout, clearRefreshTimer]);

    const login = useCallback(
        async (phone, password) => {
            try {
                const response = await api.post("auth/login/", { phone, password });
                const { access, refresh, user: userData } = response.data;

                localStorage.setItem("accessToken", access);
                localStorage.setItem("refreshToken", refresh);

                // Use the same user shape as refreshUser so state is consistent
                let nextUser = userData;
                try {
                    nextUser = mapTokenToUser(jwtDecode(access));
                } catch {
                    // fall back to the user object returned by the API
                }

                setUser(nextUser);
                setIsAuthenticated(true);
                scheduleTokenRefresh(access);

                return { success: true, user: nextUser };
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.detail || "Login failed",
                };
            }
        },
        [scheduleTokenRefresh]
    );

    const register = useCallback(async (userData) => {
        try {
            await api.post("auth/register/", userData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data || "Registration failed" };
        }
    }, []);

    const requestPasswordReset = useCallback(async (phone) => {
        try {
            await api.post("auth/password-reset/request/", { phone });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || "Request failed. Try again." };
        }
    }, []);

    const confirmPasswordReset = useCallback(async (phone, code, new_password) => {
        try {
            await api.post("auth/password-reset/confirm/", { phone, code, new_password });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || "Reset failed. Try again." };
        }
    }, []);

    const updateProfile = useCallback(async (userData) => {
        try {
            const res = await api.patch("auth/me/", userData);
            const updatedUser = res.data;
            setUser((prev) => ({ ...prev, ...updatedUser }));
            return { success: true, data: updatedUser };
        } catch (error) {
            return { success: false, error: error.response?.data || "Update failed" };
        }
    }, []);

    const changePassword = useCallback(async (passwordData) => {
        try {
            await api.post("auth/change-password/", passwordData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data || "Change password failed" };
        }
    }, []);

    const hasPermission = useCallback(
        (permission) => {
            if (!user || typeof permission !== "string") return false;
            const perms = PERMISSIONS[user.role];
            if (!perms) return false;
            if (perms.includes("*")) return true;
            if (perms.includes(permission)) return true;
            const [module] = permission.split(".");
            return perms.includes(`${module}.*`);
        },
        [user]
    );

    const hasRole = useCallback((role) => user?.role === role, [user]);

    const hasAnyRole = useCallback((roles) => !!user && roles.includes(user.role), [user]);

    const isClassTeacher = useCallback(
        (classId) => {
            if (!user || !user.classTeacherOf || user.classTeacherOf.length === 0) return false;
            if (classId) return user.classTeacherOf.includes(classId);
            return true;
        },
        [user]
    );

    const value = useMemo(
        () => ({
            user,
            isAuthenticated,
            isLoading: loading,
            login,
            register,
            logout,
            requestPasswordReset,
            confirmPasswordReset,
            updateProfile,
            changePassword,
            hasPermission,
            hasRole,
            hasAnyRole,
            isClassTeacher,
        }),
        [
            user,
            isAuthenticated,
            loading,
            login,
            register,
            logout,
            requestPasswordReset,
            confirmPasswordReset,
            updateProfile,
            changePassword,
            hasPermission,
            hasRole,
            hasAnyRole,
            isClassTeacher,
        ]
    );

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
