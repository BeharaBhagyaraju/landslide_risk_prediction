import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ShieldAlert, Mail, Lock, UserPlus, Eye, EyeOff,
    Loader2, AlertCircle, CheckCircle2, KeyRound, ArrowLeft, RefreshCw
} from 'lucide-react';
import { sendOtp, registerUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

// ── Shared UI pieces ──────────────────────────────────────────────────────────
const PageShell = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-900/20 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-md">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-2xl"
                    style={{ backgroundColor: '#7c3aed' }}>
                    <ShieldAlert className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">LandslideWatch</h1>
                <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-widest">AI Early Warning System</p>
            </div>
            {children}
            <p className="text-center text-slate-600 text-xs mt-6">Confidential Disaster Monitoring Platform</p>
        </div>
    </div>
);

const ErrorBanner = ({ msg }) =>
    msg ? (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {msg}
        </div>
    ) : null;

const inputClass = "w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all";

// ── Step 1: email + password ────────────────────────────────────────────────
const StepOne = ({ onOtpSent }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const strength = password.length === 0 ? null : password.length < 6 ? 'weak' : password.length < 10 ? 'fair' : 'strong';
    const strengthColor = { weak: 'bg-red-500', fair: 'bg-amber-500', strong: 'bg-emerald-500' };
    const strengthWidth = { weak: 'w-1/3', fair: 'w-2/3', strong: 'w-full' };

    const handleSend = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password || !confirm) { setError('Please fill in all fields.'); return; }
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

        setLoading(true);
        try {
            const res = await sendOtp(email);
            // In dev mode, backend returns the OTP directly
            onOtpSent(email, password, res.dev_otp || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-1">Create Account</h2>
            <p className="text-slate-400 text-sm mb-6">Register to start monitoring landslide risks.</p>

            <ErrorBanner msg={error} />

            <form onSubmit={handleSend} className="space-y-4">
                {/* Email */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com" autoComplete="email"
                            className={`${inputClass} pl-10 pr-4`} />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="Min. 6 characters" autoComplete="new-password"
                            className={`${inputClass} pl-10 pr-11`} />
                        <button type="button" onClick={() => setShowPwd(v => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {strength && (
                        <div className="mt-2">
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${strengthColor[strength]} ${strengthWidth[strength]}`} />
                            </div>
                            <p className={`text-[11px] mt-1 capitalize font-medium ${strength === 'strong' ? 'text-emerald-400' : strength === 'fair' ? 'text-amber-400' : 'text-red-400'}`}>
                                {strength} password
                            </p>
                        </div>
                    )}
                </div>

                {/* Confirm */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Confirm Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type={showPwd ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                            placeholder="Re-enter password" autoComplete="new-password"
                            className={`${inputClass} pl-10 pr-11`} />
                        {confirm && password === confirm && (
                            <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                        )}
                    </div>
                </div>

                <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all mt-2 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {loading ? 'Sending OTP...' : 'Send Verification Code'}
                </button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Sign in</Link>
            </p>
        </div>
    );
};

// ── Step 2: OTP entry ──────────────────────────────────────────────────────
const StepTwo = ({ email, password, devOtp, onBack }) => {
    const [otp, setOtp] = useState(devOtp || '');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleVerify = async (e) => {
        e.preventDefault();
        setError(''); setInfo('');
        if (otp.trim().length !== 6) { setError('Please enter the 6-digit code.'); return; }
        setLoading(true);
        try {
            const data = await registerUser(email, password, otp.trim());
            login(data.access_token, data.email);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true); setError(''); setInfo('');
        try {
            const res = await sendOtp(email);
            if (res.dev_otp) {
                setOtp(res.dev_otp);
                setInfo(`Dev mode: OTP is ${res.dev_otp}`);
            } else {
                setInfo('A new code was sent to your email.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
            {/* Back button */}
            <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-5 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-3">
                    <KeyRound className="w-7 h-7 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Check Your Email</h2>
                <p className="text-slate-400 text-sm">
                    We sent a 6-digit verification code to<br />
                    <span className="text-purple-300 font-semibold">{email}</span>
                </p>
                {devOtp && (
                    <p className="text-amber-400 text-xs mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        ⚡ Dev mode — SMTP not configured. Code: <strong>{devOtp}</strong>
                    </p>
                )}
            </div>

            <ErrorBanner msg={error} />

            {info && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-3 mb-5 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {info}
                </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Verification Code
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white text-center text-3xl font-bold tracking-[1rem] placeholder:text-slate-700 placeholder:text-xl placeholder:tracking-normal focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        autoFocus
                    />
                    <p className="text-xs text-slate-500 mt-2 text-center">Code expires in 10 minutes</p>
                </div>

                <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {loading ? 'Creating account...' : 'Verify & Create Account'}
                </button>
            </form>

            <div className="text-center mt-5">
                <p className="text-slate-500 text-sm">Didn&apos;t receive the code?</p>
                <button onClick={handleResend} disabled={resending}
                    className="flex items-center gap-1.5 mx-auto mt-1.5 text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Resending...' : 'Resend code'}
                </button>
            </div>
        </div>
    );
};

// ── Main Signup component ────────────────────────────────────────────────────
const Signup = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [devOtp, setDevOtp] = useState(null);

    const handleOtpSent = (e, p, d) => {
        setEmail(e); setPassword(p); setDevOtp(d);
        setStep(2);
    };

    return (
        <PageShell>
            {step === 1
                ? <StepOne onOtpSent={handleOtpSent} />
                : <StepTwo email={email} password={password} devOtp={devOtp} onBack={() => setStep(1)} />
            }
        </PageShell>
    );
};

export default Signup;
