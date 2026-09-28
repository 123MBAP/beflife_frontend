import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    termsAccepted: false,
    marketingConsent: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register, authWithGoogle, loading, error, isAuthenticated, user, clearError } = useAuth();
  const navigate = useNavigate();

  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID ?? '';
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  const handleRedirect = () => {
    const isAdmin = user?.isAdmin || user?.role === 'ADMIN';
    navigate(isAdmin ? '/admin' : '/orders', { replace: true });
  };

  useEffect(() => {
    if (isAuthenticated) {
      handleRedirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

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
        // Immediately authenticate — backend will login existing users
        // or auto-register new ones as CUSTOMER.
        const result = await authWithGoogle({ idToken: credential });
        if (result.success) {
          toast.success('Welcome! Signed in with Google.');
        } else {
          toast.error(result.error || 'Google sign-in failed');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId, googleReady]);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }

    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (!formData.termsAccepted) {
      toast.error('Please accept the Terms of Service');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await register({
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      marketingConsent: formData.marketingConsent
    });

    if (result.success) {
      toast.success('Welcome! Your account has been created.');
      // Redirection handled by useEffect
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return { text: 'Weak', color: '#ef4444' };
    if (passwordStrength <= 4) return { text: 'Medium', color: '#f59e0b' };
    return { text: 'Strong', color: '#10b981' };
  };

  const strengthConfig = getPasswordStrengthText();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
          <p className="text-gray-500 text-sm">Join us to get started</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First name"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none transition-colors"
            />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last name"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Email */}
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none transition-colors"
          />

          {/* Phone */}
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Phone number"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none transition-colors"
          />

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength
                        ? passwordStrength <= 2
                          ? 'bg-red-400'
                          : passwordStrength <= 4
                            ? 'bg-orange-400'
                            : 'bg-green-500'
                        : 'bg-gray-100'
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strengthConfig.color }}>
                  Password strength: {strengthConfig.text}
                </p>
                <p className="text-xs text-gray-400">
                  Use 8+ chars with letters, numbers & symbols
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none transition-colors pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          {/* Password Match Hint */}
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-xs text-red-500 -mt-2">Passwords do not match</p>
          )}

          {/* Terms Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">
              I accept the <Link to="/terms" className="text-gray-900 underline">Terms</Link>
            </span>
          </label>

          {/* Marketing Consent */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="marketingConsent"
              checked={formData.marketingConsent}
              onChange={handleInputChange}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">
              Receive marketing emails
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Google Sign Up */}
        {!googleClientId ? (
          <button
            type="button"
            onClick={() => toast.error('Missing REACT_APP_GOOGLE_CLIENT_ID (frontend .env)')}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors"
          >
            Sign up with Google
          </button>
        ) : (
          <div className="w-full flex justify-center" ref={googleBtnRef} />
        )}

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Have an account?{' '}
          <Link to="/login" className="text-black font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;