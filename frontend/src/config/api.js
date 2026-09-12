// Centralized API and Socket URL configuration for both local dev and production deployment
export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

export const SOCKET_URL = API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

// Helper to build full API path
export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (API_BASE_URL) {
    return `${API_BASE_URL}${cleanEndpoint}`;
  }
  return cleanEndpoint;
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  getApiUrl
};
