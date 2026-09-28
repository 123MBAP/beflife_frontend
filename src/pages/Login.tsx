import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, authWithGoogle, loading, error, isAuthenticated, user, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [authFlash, setAuthFlash] = useState<string | null>(null);

  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID ?? '';
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  const handleRedirect = () => {
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/') {
      navigate(from, { replace: true });
    } else {
      const isAdmin = user?.isAdmin || user?.role === 'ADMIN';
      navigate(isAdmin ? '/admin' : '/orders', { replace: true });
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      handleRedirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate, location]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    const flash = localStorage.getItem('belife-auth-flash');
    if (flash) {
      localStorage.removeItem('belife-auth-flash');
      setAuthFlash(flash);
      return;
    }

    const from = (location.state as any)?.from?.pathname;
    if (from) {
      setAuthFlash('Please login to continue.');
    }
  }, [location.state]);

  useEffect(() => {
    if (!googleClientId) return;

    const existing = document.querySelector('script[data-google-identity="true"]');
    if (existing) {
      setGoogleReady(true);
      return;
    }

    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.dataset.googleIdentity = 'true';
    s.onload = () => setGoogleReady(true);
    s.onerror = () => toast.error('Failed to load Google sign-in');
    document.body.appendChild(s);
  }, [googleClientId]);

  useEffect(() => {
    if (!googleClientId) return;
    if (!googleReady) return;
    if (googleInitializedRef.current) return;
    if (!googleBtnRef.current) return;
    if (!(window as any).google?.accounts?.id) return;

    (window as any).google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response: any) => {
        const credential = response?.credential;
        if (!credential) {
          toast.error('Google sign-in did not return a credential');
          return;
        }

        const result = await authWithGoogle({ idToken: credential });
        if (result.success) {
          toast.success('Login successful!');
          // redirect handled by effect
        } else {
          toast.error(result.error || 'Google login failed');
        }
      },
    });

    (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      width: 320,
      text: 'continue_with',
    });

    googleInitializedRef.current = true;
  }, [googleClientId, googleReady, authWithGoogle]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Login successful!');
      // Redirection handled by useEffect
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  const handleGoogleMissingConfig = () => {
    if (!googleClientId) toast.error('Missing REACT_APP_GOOGLE_CLIENT_ID (frontend .env)');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-600 mt-2">Sign in to your Belife account</p>
          </div>

          {authFlash && (
            <div className="mb-5 rounded-lg bg-amber-50 text-amber-900 text-sm p-3 ring-1 ring-amber-200">
              {authFlash}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 no-underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 text-white py-2.5 font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          <div className="my-6">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-sm">or continue with</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="mt-4 flex gap-3">
              {!googleClientId ? (
                <button
                  type="button"
                  onClick={handleGoogleMissingConfig}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Continue with Google
                </button>
              ) : (
                <div className="flex-1 flex justify-center" ref={googleBtnRef} />
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 no-underline">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;