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
  BankBranch,
  ContactMessagesResponse,
  JobPosting,
  Tender,
  SiteSettings,
  Currency,
  PublicationCategoryOption,
  Faq,
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

async function blobRequest(path: string, retry = true): Promise<Blob> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return blobRequest(path, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.code || 'UNKNOWN', body?.error?.message || `Request failed: ${res.status}`);
  }
  return res.blob();
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
  login: (email: string, password: string, totp_code?: string) =>
    request<{ access_token?: string; user?: AdminUser; requires_totp?: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, totp_code }),
    }, false),
  logout: () => request<void>('/auth/logout', { method: 'POST' }, false),
  refresh: tryRefresh,
  me: () => request<{ sub: string; email: string; role: string }>('/admin/me'),
  forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }, false),
  resetPassword: (token: string, password: string) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }, false),

  changeMyPassword: (current_password: string, new_password: string) =>
    request('/admin/me/password', { method: 'PUT', body: JSON.stringify({ current_password, new_password }) }),
  changeMyEmail: (new_email: string, current_password: string) =>
    request<{ email: string }>('/admin/me/email', { method: 'PUT', body: JSON.stringify({ new_email, current_password }) }),
  setup2fa: () => request<{ secret: string; qr_data_url: string }>('/admin/me/2fa/setup', { method: 'POST' }),
  verify2fa: (code: string) => request('/admin/me/2fa/verify', { method: 'POST', body: JSON.stringify({ code }) }),
  disable2fa: (current_password: string) =>
    request('/admin/me/2fa/disable', { method: 'POST', body: JSON.stringify({ current_password }) }),
  adminResetUserPassword: (id: string) => request(`/admin/users/${id}/reset-password`, { method: 'POST' }),
  adminReset2fa: (id: string) => request(`/admin/users/${id}/2fa/reset`, { method: 'POST' }),

  latestRates: () => request<ExchangeRatesLatestResponse>('/exchange-rates/latest'),
  createRate: (payload: { currency_code: string; buying_rate: string; selling_rate: string; rate_date: string }) =>
    request('/admin/exchange-rates', { method: 'POST', body: JSON.stringify(payload) }),
  updateRate: (id: string, buying_rate: string, selling_rate: string) =>
    request(`/admin/exchange-rates/${id}`, { method: 'PUT', body: JSON.stringify({ buying_rate, selling_rate }) }),

  currencies: () => request<{ results: Currency[] }>('/admin/currencies'),
  createCurrency: (payload: { code: string; name: string; name_so?: string; name_ar?: string; flag_url?: string }) =>
    request<Currency>('/admin/currencies', { method: 'POST', body: JSON.stringify(payload) }),
  updateCurrency: (
    code: string,
    payload: Partial<{
      name: string;
      name_so: string | null;
      name_ar: string | null;
      flag_url: string | null;
      is_active: boolean;
      sort_order: number;
    }>
  ) => request<Currency>(`/admin/currencies/${code}`, { method: 'PUT', body: JSON.stringify(payload) }),

  siteSettings: () => request<SiteSettings>('/admin/site-settings'),
  updateSiteSettings: (payload: Partial<SiteSettings>) =>
    request<SiteSettings>('/admin/site-settings', { method: 'PUT', body: JSON.stringify(payload) }),

  publicationCategories: () => request<{ results: PublicationCategoryOption[] }>('/publication-categories'),
  createPublicationCategory: (payload: { name: string; name_so?: string; name_ar?: string }) =>
    request<PublicationCategoryOption>('/admin/publication-categories', { method: 'POST', body: JSON.stringify(payload) }),

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
  updateInstitutionBranding: (id: string, payload: { logo_url?: string | null; website_url?: string | null }) =>
    request(`/admin/institutions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  users: () => request<{ results: AdminUser[] }>('/admin/users'),
  createUser: (payload: { name: string; email: string; password: string; role: string }) =>
    request('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  deleteUser: (id: string) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  auditLog: (limit = 50) => request<{ results: AuditLogEntry[] }>(`/admin/audit-log?limit=${limit}`),

  contentPages: () => request<{ results: ContentPageSummary[] }>('/admin/content-pages'),
  contentPage: (id: string) => request<ContentPageDetail>(`/admin/content-pages/${id}`),
  createContentPage: (payload: { slug: string; title: string; body?: string }) =>
    request<{ id: string; slug: string }>('/admin/content-pages', { method: 'POST', body: JSON.stringify(payload) }),
  deleteContentPage: (id: string) => request<void>(`/admin/content-pages/${id}`, { method: 'DELETE' }),
  updateContent: (
    id: string,
    payload: {
      language_code: LanguageCode;
      title?: string;
      subtitle?: string | null;
      body?: string;
      status?: 'draft' | 'published';
      banner_image_url?: string | null;
      banner_video_url?: string | null;
      animation_style?: string | null;
    }
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

  publications: () => request<{ results: Publication[] }>('/admin/publications'),
  createPublication: (payload: {
    title: string;
    file_url: string;
    category: string;
    publish_date: string;
    thumbnail_url?: string;
    is_downloadable?: boolean;
  }) => request<Publication>('/admin/publications', { method: 'POST', body: JSON.stringify(payload) }),
  setPublicationStatus: (id: string, status: 'draft' | 'published') =>
    request<Publication>(`/admin/publications/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deletePublication: (id: string) => request<void>(`/admin/publications/${id}`, { method: 'DELETE' }),

  lawsRegulations: () => request<{ results: LawRegulation[] }>('/admin/laws-regulations'),
  createLawRegulation: (payload: {
    title: string;
    file_url: string;
    law_number?: string;
    effective_date?: string;
    thumbnail_url?: string;
    is_downloadable?: boolean;
  }) => request<LawRegulation>('/admin/laws-regulations', { method: 'POST', body: JSON.stringify(payload) }),
  setLawStatus: (id: string, status: 'draft' | 'published') =>
    request<LawRegulation>(`/admin/laws-regulations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteLawRegulation: (id: string) => request<void>(`/admin/laws-regulations/${id}`, { method: 'DELETE' }),

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

  bankBranches: () => request<{ results: (BankBranch & { is_active: boolean })[] }>('/admin/bank-branches'),
  createBankBranch: (payload: {
    name: string;
    city: string;
    address?: string;
    phone?: string;
    is_headquarters?: boolean;
    sort_order?: number;
    manager_name?: string;
    manager_title?: string;
    email?: string;
    photo_url?: string;
  }) => request<BankBranch>('/admin/bank-branches', { method: 'POST', body: JSON.stringify(payload) }),
  updateBankBranch: (
    id: string,
    payload: Partial<{
      name: string;
      city: string;
      address: string | null;
      phone: string | null;
      is_headquarters: boolean;
      sort_order: number;
      is_active: boolean;
      manager_name: string | null;
      manager_title: string | null;
      email: string | null;
      photo_url: string | null;
    }>
  ) => request<BankBranch>(`/admin/bank-branches/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBankBranch: (id: string) => request<void>(`/admin/bank-branches/${id}`, { method: 'DELETE' }),

  contactMessages: () => request<ContactMessagesResponse>('/admin/contact-messages'),
  markMessageRead: (id: string) => request(`/admin/contact-messages/${id}/read`, { method: 'PUT' }),

  jobPostings: (status: 'open' | 'closed') =>
    request<{ results: JobPosting[] }>(`/job-postings?status=${status}`),
  createJobPosting: (payload: { title: string; department?: string; closing_date: string }) =>
    request<JobPosting>('/admin/job-postings', { method: 'POST', body: JSON.stringify(payload) }),
  updateJobPostingStatus: (id: string, status: 'open' | 'closed') =>
    request<JobPosting>(`/admin/job-postings/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  tenders: () => request<{ results: Tender[] }>('/tenders'),
  createTender: (payload: { title: string; reference_number: string; closing_date: string; file_url?: string }) =>
    request<Tender>('/admin/tenders', { method: 'POST', body: JSON.stringify(payload) }),

  faqs: () => request<{ results: (Faq & { question_so?: string | null; question_ar?: string | null; answer_so?: string | null; answer_ar?: string | null; sort_order: number; is_active: boolean })[] }>('/admin/faqs'),
  createFaq: (payload: {
    question: string;
    question_so?: string;
    question_ar?: string;
    answer: string;
    answer_so?: string;
    answer_ar?: string;
    sort_order?: number;
  }) => request<Faq>('/admin/faqs', { method: 'POST', body: JSON.stringify(payload) }),
  updateFaq: (
    id: string,
    payload: Partial<{
      question: string;
      question_so: string | null;
      question_ar: string | null;
      answer: string;
      answer_so: string | null;
      answer_ar: string | null;
      sort_order: number;
      is_active: boolean;
    }>
  ) => request<Faq>(`/admin/faqs/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteFaq: (id: string) => request<void>(`/admin/faqs/${id}`, { method: 'DELETE' }),

  newsletterSubscribers: () => request<{ results: { id: string; email: string; created_at: string }[] }>('/admin/newsletter-subscribers'),
  exportNewsletterCsv: () => blobRequest('/admin/newsletter-subscribers/export.csv'),
};
