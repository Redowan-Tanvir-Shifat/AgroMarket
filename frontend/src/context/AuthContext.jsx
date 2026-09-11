import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('agromarket_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('agromarket_token') || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

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
