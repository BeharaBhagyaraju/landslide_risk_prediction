import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'lw_token';
const EMAIL_KEY = 'lw_email';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
    const [userEmail, setUserEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || null);

    const login = useCallback((accessToken, email) => {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(EMAIL_KEY, email);
        setToken(accessToken);
        setUserEmail(email);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
        setToken(null);
        setUserEmail(null);
    }, []);

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ token, userEmail, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};
