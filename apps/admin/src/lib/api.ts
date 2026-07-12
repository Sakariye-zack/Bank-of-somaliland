import type {
  AdminUser,
  AuditLogEntry,
  ExchangeRatesLatestResponse,
  InstitutionsResponse,
  ContentPageSummary,
  ContentPageDetail,
  LanguageCode,
  PressRelease,
  UploadMediaResponse,
  Publication,
  LawRegulation,
  NavItem,
  HeroSlide,
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

async function uploadRequest<T>(path: string, formData: FormData, retry = true): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: formData,
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return uploadRequest<T>(path, formData, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.code || 'UNKNOWN', body?.error?.message || `Upload failed: ${res.status}`);
  }
  return res.json();
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

  contentPages: () => request<{ results: ContentPageSummary[] }>('/admin/content-pages'),
  contentPage: (id: string) => request<ContentPageDetail>(`/admin/content-pages/${id}`),
  updateContent: (
    id: string,
    payload: { language_code: LanguageCode; title?: string; body?: string; status?: 'draft' | 'published' }
  ) => request(`/admin/content/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  uploadMedia: (images: File[], video: File | null, document: File | null = null) => {
    const formData = new FormData();
    for (const img of images) formData.append('images', img);
    if (video) formData.append('video', video);
    if (document) formData.append('document', document);
    return uploadRequest<UploadMediaResponse>('/admin/uploads', formData);
  },
  pressReleases: () => request<{ results: PressRelease[] }>('/press-releases?page=1&page_size=50'),
  createPressRelease: (payload: {
    title: string;
    body?: string;
    publish_date: string;
    featured?: boolean;
    images?: string[];
    video_url?: string | null;
  }) => request<PressRelease>('/admin/press-releases', { method: 'POST', body: JSON.stringify(payload) }),

  publications: () => request<{ results: Publication[] }>('/publications'),
  createPublication: (payload: {
    title: string;
    file_url: string;
    category: string;
    publish_date: string;
  }) => request<Publication>('/admin/publications', { method: 'POST', body: JSON.stringify(payload) }),

  lawsRegulations: () => request<{ results: LawRegulation[] }>('/laws-regulations'),
  createLawRegulation: (payload: {
    title: string;
    file_url: string;
    law_number?: string;
    effective_date?: string;
  }) => request<LawRegulation>('/admin/laws-regulations', { method: 'POST', body: JSON.stringify(payload) }),

  navItems: () =>
    request<{ results: (NavItem & { parent_id: string | null; is_active: boolean })[] }>('/admin/nav-items'),
  createNavItem: (payload: { label: string; path: string; parent_id?: string | null; sort_order?: number }) =>
    request<NavItem>('/admin/nav-items', { method: 'POST', body: JSON.stringify(payload) }),
  updateNavItem: (
    id: string,
    payload: Partial<{ label: string; path: string; parent_id: string | null; sort_order: number; is_active: boolean }>
  ) => request<NavItem>(`/admin/nav-items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteNavItem: (id: string) => request<void>(`/admin/nav-items/${id}`, { method: 'DELETE' }),

  heroSlides: () => request<{ results: (HeroSlide & { is_active: boolean })[] }>('/admin/hero-slides'),
  createHeroSlide: (payload: {
    title: string;
    subtitle?: string;
    image_url?: string | null;
    video_url?: string | null;
    link_url?: string;
    sort_order?: number;
  }) => request<HeroSlide>('/admin/hero-slides', { method: 'POST', body: JSON.stringify(payload) }),
  updateHeroSlide: (
    id: string,
    payload: Partial<{
      title: string;
      subtitle: string | null;
      image_url: string | null;
      video_url: string | null;
      link_url: string | null;
      sort_order: number;
      is_active: boolean;
    }>
  ) => request<HeroSlide>(`/admin/hero-slides/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteHeroSlide: (id: string) => request<void>(`/admin/hero-slides/${id}`, { method: 'DELETE' }),
};
