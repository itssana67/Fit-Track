// Central Axios instance. Every request from React to the Express backend goes through here.
import axios from 'axios';

// Base URL comes from frontend/.env  ->  VITE_API_URL=http://localhost:5000/api
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send the httpOnly JWT cookie with every request
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// If any private request returns 401 (expired / missing token),
// tell AuthContext so it can log the user out and show the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      window.dispatchEvent(new Event('fittrack:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
