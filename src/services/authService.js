const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Request a 6-digit OTP to be sent to the given email.
 * Returns { status, message, dev_otp? }
 */
export const sendOtp = async (email) => {
    const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to send OTP.');
    return data;
};

/**
 * Register a new user with email, password, and verified OTP.
 */
export const registerUser = async (email, password, otp) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed.');
    return data;
};

/**
 * Login with email and password.
 */
export const loginUser = async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed.');
    return data;
};

