import { jwtDecode } from "jwt-decode";
import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import api from '../services/axios';
import { PERMISSIONS } from "@/lib/constants";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const refreshTimeoutRef = useRef(null);

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsAuthenticated(false);
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }
    }, []);

    // Function to proactively refresh the token
    const scheduleTokenRefresh = useCallback((token) => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        try {
            const decoded = jwtDecode(token);
            const expiryTime = decoded.exp * 1000;
            const currentTime = Date.now();

            // Refresh 1 minute before expiry
            const refreshTime = expiryTime - currentTime - (60 * 1000);

            if (refreshTime > 0) {
                refreshTimeoutRef.current = setTimeout(async () => {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        try {
                            const rawBaseURL = process.env.NEXT_PUBLIC_API_URL;
                            const baseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;
                            const response = await fetch(`${baseURL}auth/refresh/`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ refresh: refreshToken })
                            });
                            if (!response.ok) throw new Error('Refresh failed');
                            const data = await response.json();

                            localStorage.setItem('accessToken', data.access);
                            if (data.refresh) localStorage.setItem('refreshToken', data.refresh);

                            window.dispatchEvent(
                              new CustomEvent("tokenRefreshed", {
                                detail: { access: data.access },
                              })
                            );
                        } catch (error) {
                            console.error("Proactive token refresh failed:", error);
                            logout();
                        }
                    }
                }, refreshTime);
            }
        } catch (error) {
            console.error("Error scheduling refresh:", error);
        }
    }, [logout]);

    // Function to refresh user state from current token
    const refreshUser = useCallback(async () => {
        let token = localStorage.getItem('accessToken');
        if (token) {
            try {
                let decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        try {
                            const rawBaseURL = process.env.NEXT_PUBLIC_API_URL;
                            const baseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;
                            const response = await fetch(`${baseURL}auth/refresh/`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ refresh: refreshToken })
                            });
                            if (!response.ok) throw new Error('Refresh failed');
                            const data = await response.json();

                            token = data.access;
                            localStorage.setItem('accessToken', token);
                            if (data.refresh) localStorage.setItem('refreshToken', data.refresh);

                            decoded = jwtDecode(token);
                        } catch (err) {
                            console.error("Failed to silently refresh expired token:", err);
                            logout();
                            return;
                        }
                    } else {
                        logout();
                        return;
                    }
                }

                setIsAuthenticated(true);
                // Map full user profile from token
                setUser({
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
                // Schedule next refresh
                scheduleTokenRefresh(token);
            } catch (error) {
                console.error("Invalid token:", error);
                logout();
            }
        }
    }, [logout, scheduleTokenRefresh]);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                refreshUser();
            }
            setLoading(false);
        };

        initializeAuth();

        const handleTokenRefresh = () => {
            console.log("Token refreshed, updating user state");
            refreshUser();
        };

        const handleAuthLogout = () => {
            console.log("Auth logout event received");
            logout();
        };

        window.addEventListener('tokenRefreshed', handleTokenRefresh);
        window.addEventListener('authLogout', handleAuthLogout);

        return () => {
            window.removeEventListener('tokenRefreshed', handleTokenRefresh);
            window.removeEventListener('authLogout', handleAuthLogout);
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [refreshUser]);

    const login = async (phone, password) => {
        try {
            const response = await api.post('auth/login/', { phone, password });
            const { access, refresh, user: userData } = response.data;

            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);

            setUser(userData);
            setIsAuthenticated(true);
            scheduleTokenRefresh(access);

            return { success: true, user: userData };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            await api.post('auth/register/', userData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data || 'Registration failed' };
        }
    };

    const resetPassword = async (email) => {
        try {
            await api.post('auth/password-reset/', { email });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Request failed' };
        }
    };

    const confirmPasswordReset = async (uid, token, new_password) => {
        try {
            await api.post('auth/password-reset-confirm/', { uid, token, new_password });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Reset failed' };
        }
    };

    const updateProfile = async (userData) => {
        try {
            const res = await api.patch('auth/me/', userData);
            const updatedUser = res.data;
            setUser(prev => ({ ...prev, ...updatedUser }));
            return { success: true, data: updatedUser };
        } catch (error) {
            return { success: false, error: error.response?.data || 'Update failed' };
        }
    };

    const changePassword = async (passwordData) => {
        try {
            await api.post('auth/change-password/', passwordData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data || 'Change password failed' };
        }
    };



    const hasPermission = useCallback((permission) => {
        if (!user) return false;
        const perms = PERMISSIONS[user.role];
        if (!perms) return false;
        if (perms.includes("*")) return true;
        if (perms.includes(permission)) return true;
        const [module] = permission.split(".");
        return perms.includes(`${module}.*`);
    }, [user]);

    const hasRole = useCallback((role) => user?.role === role, [user]);

    const hasAnyRole = useCallback((roles) => !!user && roles.includes(user.role), [user]);

    const isClassTeacher = useCallback((classId) => {
        if (!user || !user.classTeacherOf || user.classTeacherOf.length === 0) return false;
        if (classId) return user.classTeacherOf.includes(classId);
        return true;
    }, [user]);

    const value = useMemo(() => ({
        user,
        isAuthenticated,
        isLoading: loading,
        login,
        register,
        logout,
        resetPassword,
        confirmPasswordReset,
        updateProfile,
        changePassword,
        hasPermission,
        hasRole,
        hasAnyRole,
        isClassTeacher
    }), [user, isAuthenticated, loading, logout, hasPermission, hasRole, hasAnyRole, isClassTeacher]);

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
