import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ResetPassword() {
    const [params] = useSearchParams();
    const [email, setEmail] = useState(() => (params.get('email') ?? '').trim());
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();

    const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);

    const handleResend = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            toast.error('Please enter your email first');
            return;
        }

        if (!apiBaseUrl) {
            toast.error('Missing REACT_APP_API_URL (frontend/.env)');
            return;
        }

        setResending(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed }),
            });

            const data: any = await res.json().catch(() => ({}));
            if (!res.ok || !data?.ok) {
                throw new Error(data?.error || 'Failed to resend code');
            }

            toast.success('Verification code sent.');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = email.trim().toLowerCase();
        const trimmedCode = code.trim();

        if (!trimmedEmail || !trimmedCode || !newPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!apiBaseUrl) {
            toast.error('Missing REACT_APP_API_URL (frontend/.env)');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: trimmedEmail,
                    code: trimmedCode,
                    newPassword,
                }),
            });

            const data: any = await res.json().catch(() => ({}));
            if (!res.ok || !data?.ok) {
                throw new Error(data?.error || 'Failed to reset password');
            }

            toast.success('Password updated. You can now login.');
            navigate('/login', { replace: true });
        } catch (err: any) {
            toast.error(err?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Reset password</h1>
                        <p className="text-slate-600 mt-2">Enter the verification code from your email.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                autoComplete="email"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">
                                    Verification Code
                                </label>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {resending ? 'Resending…' : 'Resend code'}
                                </button>
                            </div>
                            <input
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="6-digit code"
                                required
                                inputMode="numeric"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Create a new password"
                                required
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your new password"
                                required
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-indigo-600 text-white py-2.5 font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Updating…' : 'Update password'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-600">
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 no-underline">
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
