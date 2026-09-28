import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            toast.error('Please enter your email');
            return;
        }

        if (!apiBaseUrl) {
            toast.error('Missing REACT_APP_API_URL (frontend/.env)');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed }),
            });

            const data: any = await res.json().catch(() => ({}));
            if (!res.ok || !data?.ok) {
                throw new Error(data?.error || 'Failed to send reset code');
            }

            toast.success('If an account exists, a reset code has been sent.');
            navigate(`/reset-password?email=${encodeURIComponent(trimmed)}`);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Forgot password</h1>
                        <p className="text-slate-600 mt-2">We’ll email you a verification code.</p>
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-indigo-600 text-white py-2.5 font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending…' : 'Send verification code'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-600">
                        <span>Remembered it? </span>
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 no-underline">
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
