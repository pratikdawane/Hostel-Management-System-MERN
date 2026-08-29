import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiEnvelope } from '@/types/api';
import type { AuthResult } from '@/types/auth';
import { getAccessToken, setAccessToken } from './tokenStore';
import { emitSessionExpired } from './authEvents';

const baseURL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<ApiEnvelope<AuthResult>>(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    setAccessToken(data.data.accessToken);
    return data.data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const isAuthBootstrapEndpoint = /\/auth\/(login|register|refresh)$/.test(
      originalRequest?.url ?? '',
    );

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthBootstrapEndpoint
    ) {
      originalRequest._retry = true;

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
        return api(originalRequest);
      }

      emitSessionExpired();
    }

    return Promise.reject(error);
  },
);
