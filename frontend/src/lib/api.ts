import axios from 'axios';
import { mockAdapter } from './mock/server';

const TOKEN_KEY = 'ebd.token';

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* armazenamento indisponível */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* armazenamento indisponível */
    }
  },
};

export const UNAUTHORIZED_EVENT = 'ebd:unauthorized';

/** Modo demonstração: sem backend, as requisições são respondidas localmente. */
export const MODO_DEMO = import.meta.env.VITE_MOCK === 'true';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 20000,
});

if (MODO_DEMO) {
  api.defaults.adapter = mockAdapter;
}

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error?.config?.url ?? '';
    if (error?.response?.status === 401 && !url.includes('/auth/login')) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(err: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (!err.response) return 'Sem conexão com o servidor. Verifique sua internet.';
    if (err.response.status === 403) return 'Você não tem permissão para esta ação.';
  }
  return fallback;
}
