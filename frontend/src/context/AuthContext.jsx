import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const isTokenExpired = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') return true;
  try {
    const parts = rawToken.split('.');
    if (parts.length < 2) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch (e) {
    return false;
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
    if (savedToken && isTokenExpired(savedToken)) {
      localStorage.removeItem('agromarket_token');
      localStorage.removeItem('token');
      localStorage.removeItem('agromarket_user');
      return null;
    }
    return savedToken || null;
  });

  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
    if (!savedToken || isTokenExpired(savedToken)) {
      return null;
    }
    const savedUser = localStorage.getItem('agromarket_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Interceptor to auto-logout on 401 expired token
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          const msg = (error.response.data?.message || '').toLowerCase();
          if (msg.includes('expired') || msg.includes('token') || msg.includes('authorization') || msg.includes('not found')) {
            console.warn('Session expired or unauthorized token detected. Resetting session.');
            logoutUser();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const loginUser = async (identifier, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { identifier, password });
      const { token: jwtToken, user: userData } = res.data;
      
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('agromarket_token', jwtToken);
      localStorage.setItem('agromarket_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (formData) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', formData);
      const { token: jwtToken, user: userData } = res.data;
      
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('agromarket_token', jwtToken);
      localStorage.setItem('agromarket_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('agromarket_token');
    localStorage.removeItem('agromarket_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (newUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...newUserData };
      localStorage.setItem('agromarket_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, registerUser, logoutUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
