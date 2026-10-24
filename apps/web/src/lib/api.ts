import { ApiClient } from '@ai-study/api-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = new ApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => {
    return localStorage.getItem('auth_token');
  },
  onUnauthorized: () => {
    localStorage.removeItem('auth_token');
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login';
    }
  }
});
