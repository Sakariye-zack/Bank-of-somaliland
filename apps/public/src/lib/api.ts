import type {
  ExchangeRatesLatestResponse,
  InstitutionsResponse,
  PressReleasesResponse,
  PublicationsResponse,
  ContentResponse,
  LawsRegulationsResponse,
  JobPostingsResponse,
  TendersResponse,
} from '@bos/shared-types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/v1';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error?.message || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  latestRates: () => get<ExchangeRatesLatestResponse>('/exchange-rates/latest'),
  institutions: (params: { type?: string; status?: string; q?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    return get<InstitutionsResponse>(`/institutions${qs.toString() ? `?${qs}` : ''}`);
  },
  pressReleases: (page = 1, pageSize = 10) =>
    get<PressReleasesResponse>(`/press-releases?page=${page}&page_size=${pageSize}`),
  publications: (category?: string) =>
    get<PublicationsResponse>(`/publications${category ? `?category=${category}` : ''}`),
  content: (slug: string, lang: string) => get<ContentResponse>(`/content/${slug}?lang=${lang}`),
  submitContact: (payload: { name: string; email: string; subject: string; message: string }) =>
    post<{ status: string }>('/contact', payload),
  lawsRegulations: () => get<LawsRegulationsResponse>('/laws-regulations'),
  jobPostings: () => get<JobPostingsResponse>('/job-postings'),
  tenders: () => get<TendersResponse>('/tenders'),
};
