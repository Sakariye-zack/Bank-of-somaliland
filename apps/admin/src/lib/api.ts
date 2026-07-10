import type {
  AdminUser,
  AuditLogEntry,
  ExchangeRatesLatestResponse,
  InstitutionsResponse,
} from '@bos/shared-types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/v1';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.code || 'UNKNOWN', body?.error?.message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.access_token;
    return true;
  } catch {
    return false;
  }
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false),
  logout: () => request<void>('/auth/logout', { method: 'POST' }, false),
  refresh: tryRefresh,
  me: () => request<{ sub: string; email: string; role: string }>('/admin/me'),

  latestRates: () => request<ExchangeRatesLatestResponse>('/exchange-rates/latest'),
  createRate: (payload: { currency_code: string; rate_to_ssh: string; rate_date: string }) =>
    request('/admin/exchange-rates', { method: 'POST', body: JSON.stringify(payload) }),
  updateRate: (id: string, rate_to_ssh: string) =>
    request(`/admin/exchange-rates/${id}`, { method: 'PUT', body: JSON.stringify({ rate_to_ssh }) }),

  institutions: (params: { type?: string; status?: string; q?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    return request<InstitutionsResponse>(`/institutions${qs.toString() ? `?${qs}` : ''}`);
  },
  createInstitution: (payload: {
    name: string;
    institution_type: string;
    license_number?: string;
    headquarters?: string;
    license_date?: string;
  }) => request('/admin/institutions', { method: 'POST', body: JSON.stringify(payload) }),
  updateInstitutionStatus: (id: string, status: 'active' | 'revoked') =>
    request(`/admin/institutions/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  users: () => request<{ results: AdminUser[] }>('/admin/users'),
  createUser: (payload: { name: string; email: string; password: string; role: string }) =>
    request('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),

  auditLog: (limit = 50) => request<{ results: AuditLogEntry[] }>(`/admin/audit-log?limit=${limit}`),
};
