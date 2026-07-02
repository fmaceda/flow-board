import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // Required to send the HttpOnly refresh_token cookie on every request
  withCredentials: true,
});

// ── Request interceptor ────────────────────────────────────────────────────
// Attach the in-memory access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ───────────────────────────────────────────────────
// On 401, silently refresh the access token and retry the original request.
// A queue prevents multiple concurrent refreshes when several requests
// fire at the same time with an expired token.

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function flushQueue(token: string) {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;

    // Only attempt refresh for 401 responses on requests we haven't already retried.
    // If _retry is already set, the retry itself returned 401 — session is truly invalid.
    if (error.response?.status !== 401 || !config) {
      return Promise.reject(error);
    }

    if (config._retry) {
      // The retried request also returned 401 — refresh token is gone or invalid.
      // Clear state and send the user to login.
      useAuthStore.getState().clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    config._retry = true;

    if (isRefreshing) {
      // Park this request until the in-flight refresh resolves
      return new Promise<ReturnType<typeof api>>((resolve) => {
        refreshQueue.push((token: string) => {
          config.headers.Authorization = `Bearer ${token}`;
          resolve(api(config));
        });
      });
    }

    isRefreshing = true;

    try {
      // Use a plain axios call so we don't hit this interceptor recursively
      const { data } = await axios.post<{
        success: true;
        data: { accessToken: string };
      }>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newToken = data.data.accessToken;
      useAuthStore.getState().setAccessToken(newToken);
      flushQueue(newToken);

      config.headers.Authorization = `Bearer ${newToken}`;
      return api(config);
    } catch {
      // Refresh failed — clear local auth state and redirect to login
      useAuthStore.getState().clear();
      flushQueue('');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
