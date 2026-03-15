const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Request a 6-digit OTP to be sent to the given email.
 * Returns { status, message, dev_otp? }
 */
export const sendOtp = async (email) => {
    const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ email }),
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        throw new Error(`Server returned HTML (likely a tunnel warning). Please open ${BASE_URL} in your browser and click 'Continue' first.`);
    }

    if (!res.ok) throw new Error(data.detail || 'Failed to send OTP.');
    return data;
};

/**
 * Register a new user with email, password, and verified OTP.
 */
export const registerUser = async (email, password, otp) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ email, password, otp }),
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        throw new Error(`Server returned HTML. Please open ${BASE_URL} in your browser and click 'Continue' first.`);
    }

    if (!res.ok) throw new Error(data.detail || 'Registration failed.');
    return data;
};

/**
 * Login with email and password.
 */
export const loginUser = async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ email, password }),
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        throw new Error(`Server returned HTML. Please open ${BASE_URL} in your browser and click 'Continue' first.`);
    }

    if (!res.ok) throw new Error(data.detail || 'Login failed.');
    return data;
};

