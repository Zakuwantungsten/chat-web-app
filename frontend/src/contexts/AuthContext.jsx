import React, { createContext, useContext, useReducer, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';

// Create auth context
const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING'
};

// Initial state
const getInitialToken = () => localStorage.getItem('token');

const initialState = {
  user: null,
  token: getInitialToken(),
  isAuthenticated: !!getInitialToken(),
  loading: true,
  error: null
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

// Set up axios defaults
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create API instance at module level with interceptors already configured
const api = axios.create({
  baseURL: API_URL
});

// Set up request interceptor immediately (not in useEffect)
api.interceptors.request.use(
  (config) => {
    // Always get the latest token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request with token:', config.method?.toUpperCase(), config.url);
    } else {
      console.log('API Request without token:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Store logout function reference for response interceptor
let logoutFn = null;

// Set up response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 for auth-related endpoints
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      const hasToken = localStorage.getItem('token');
      
      // Only auto-logout if token exists and it's an auth endpoint failure
      if (isAuthEndpoint && hasToken && logoutFn) {
        console.log('Authentication failed on auth endpoint, logging out user');
        logoutFn();
      }
    }
    return Promise.reject(error);
  }
);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Logout function - defined early so we can register it with the interceptor
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Register logout function with module-level interceptor
  useEffect(() => {
    logoutFn = logout;
    return () => {
      logoutFn = null;
    };
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Update the state with the token first
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { token, user: null }
          });
          
          // Then verify the token with the server
          const response = await api.get('/api/auth/me');
          
          dispatch({
            type: AUTH_ACTIONS.SET_USER,
            payload: response.data.user
          });
        } catch (error) {
          console.error('Token validation failed:', error.response?.data || error.message);
          // Only remove token if it's definitely invalid (401/403)
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('Token is invalid, removing and logging out');
            localStorage.removeItem('token');
            dispatch({ 
              type: AUTH_ACTIONS.LOGOUT
            });
          } else {
            // Network error or server error - keep trying but set loading to false
            console.log('Network error during auth check, keeping token');
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', token);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { token, user }
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await api.post('/api/auth/register', userData);

      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', token);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { token, user }
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/users/profile', profileData);
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: response.data.user
      });
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    api,
    token: state.token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;