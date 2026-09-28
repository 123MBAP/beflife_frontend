import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';

function getJwtExpMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    const obj = JSON.parse(json) as { exp?: number };
    if (!obj?.exp || typeof obj.exp !== 'number') return null;
    return obj.exp * 1000;
  } catch {
    return null;
  }
}

type AuthUser = {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  role?: 'ADMIN' | 'CUSTOMER' | string;
  [key: string]: any;
} | null;

type AuthState = {
  user: AuthUser;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; token: string } }
  | { type: 'UPDATE_USER'; payload: { user: AuthUser } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { name: string; email: string; password: string;[key: string]: any }) => Promise<{ success: boolean; error?: string }>;
  authWithGoogle: (input: { idToken: string; phone?: string }) => Promise<{ success: boolean; error?: string; code?: string }>;
  logout: (reason?: 'expired') => void;
  setUser: (nextUser: any) => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload.user,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const apiBaseUrl = (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, '');

  const logout = useCallback((reason?: 'expired') => {
    if (reason === 'expired') {
      localStorage.setItem('belife-auth-flash', 'Session expired. Please login again.');
    }
    localStorage.removeItem('belife-token');
    localStorage.removeItem('belife-user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Check for token on mount
  useEffect(() => {
    const token = localStorage.getItem('belife-token');
    const user = localStorage.getItem('belife-user');

    if (token && user) {
      try {
        const expMs = getJwtExpMs(token);
        if (expMs !== null && expMs <= Date.now()) {
          logout('expired');
          return;
        }
        const userData = JSON.parse(user);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: userData, token }
        });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        logout();
      }
    }
  }, [logout]);

  // Auto logout when token expires
  useEffect(() => {
    const token = state.token;
    if (!token) return;
    const expMs = getJwtExpMs(token);
    if (expMs === null) return;

    const now = Date.now();
    if (expMs <= now) {
      logout('expired');
      return;
    }

    const timeoutMs = expMs - now;
    const id = window.setTimeout(() => {
      logout('expired');
    }, timeoutMs);

    return () => window.clearTimeout(id);
  }, [state.token, logout]);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!apiBaseUrl) {
        throw new Error('Missing REACT_APP_API_URL (frontend/.env)');
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Invalid email or password');
      }

      const backendUser = data?.user;
      const token = data?.token;
      if (!backendUser?.id || !backendUser?.email || !token) {
        throw new Error('Invalid login response from server');
      }

      const userForUi = {
        ...backendUser,
        name: backendUser.name || backendUser.email.split('@')[0],
        isAdmin: backendUser.role === 'ADMIN',
      };

      localStorage.setItem('belife-token', token);
      localStorage.setItem('belife-user', JSON.stringify(userForUi));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userForUi, token } });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const authWithGoogle = async (input: { idToken: string; phone?: string }) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      if (!input?.idToken) {
        throw new Error('Missing Google credential');
      }

      if (!apiBaseUrl) {
        throw new Error('Missing REACT_APP_API_URL');
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: input.idToken, phone: input.phone }),
      });

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        const errorMessage = data?.error || 'Google authentication failed';
        const code = data?.code;
        dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
        return { success: false, error: errorMessage, code };
      }

      const backendUser = data?.user;
      const token = data?.token;
      if (!backendUser?.id || !backendUser?.email || !token) {
        throw new Error('Invalid Google login response from server');
      }

      const userForUi = {
        ...backendUser,
        name: backendUser.name || backendUser.email.split('@')[0],
        isAdmin: backendUser.role === 'ADMIN',
      };

      localStorage.setItem('belife-token', token);
      localStorage.setItem('belife-user', JSON.stringify(userForUi));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userForUi, token } });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || 'Google authentication failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: { name: string; email: string; password: string; phone?: string;[key: string]: any }) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Name, email and password are required');
      }

      if (!apiBaseUrl) {
        throw new Error('Missing REACT_APP_API_URL');
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email.toLowerCase(),
          password: userData.password,
          name: userData.name,
          phone: userData.phone
        }),
      });

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Registration failed');
      }

      const backendUser = data?.user;
      const token = data?.token;
      if (!backendUser?.id || !token) {
        throw new Error('Invalid registration response from server');
      }

      const userForUi = {
        ...backendUser,
        isAdmin: backendUser.role === 'ADMIN',
      };

      localStorage.setItem('belife-token', token);
      localStorage.setItem('belife-user', JSON.stringify(userForUi));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userForUi, token } });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || 'Registration failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const setUser = useCallback((nextUser: any) => {
    try {
      if (!nextUser) return;
      localStorage.setItem('belife-user', JSON.stringify(nextUser));
      dispatch({ type: 'UPDATE_USER', payload: { user: nextUser } });
    } catch {
      // ignore
    }
  }, []);

  const value: AuthContextValue = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    authWithGoogle,
    logout,
    setUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};