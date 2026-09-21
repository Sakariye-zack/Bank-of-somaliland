import type {
  ExchangeRatesLatestResponse,
  ExchangeRatesHistoryResponse,
  SearchResponse,
  InstitutionsResponse,
  PressRelease,
  PressReleasesResponse,
  PublicationsResponse,
  ContentResponse,
  LawsRegulationsResponse,
  JobPostingsResponse,
  TendersResponse,
  NavItemsResponse,
  LanguageCode,
  HeroSlidesResponse,
  SiteSettings,
  PublicationCategoryOption,
  BankBranchesResponse,
  FaqsResponse,
  NewsletterSubscribeResponse,
  StatisticsResponse,
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
  latestRates: (lang: LanguageCode = 'en') => get<ExchangeRatesLatestResponse>(`/exchange-rates/latest?lang=${lang}`),
  search: (q: string, lang: LanguageCode = 'en') =>
    get<SearchResponse>(`/search?q=${encodeURIComponent(q)}&lang=${lang}`),
  rateHistory: (currency: string, days = 90) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return get<ExchangeRatesHistoryResponse>(
      `/exchange-rates/history?currency=${currency}&from=${fmt(from)}&to=${fmt(to)}`
    );
  },
  institutions: (params: { type?: string; status?: string; q?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    return get<InstitutionsResponse>(`/institutions${qs.toString() ? `?${qs}` : ''}`);
  },
  pressReleases: (page = 1, pageSize = 10, lang: LanguageCode = 'en') =>
    get<PressReleasesResponse>(`/press-releases?page=${page}&page_size=${pageSize}&lang=${lang}`),
  pressRelease: (id: string, lang: LanguageCode = 'en') =>
    get<PressRelease>(`/press-releases/${id}?lang=${lang}`),
  publications: (category?: string, lang: LanguageCode = 'en', limit?: number) =>
    get<PublicationsResponse>(
      `/publications?lang=${lang}${category ? `&category=${category}` : ''}${limit ? `&limit=${limit}` : ''}`
    ),
  content: (slug: string, lang: string) => get<ContentResponse>(`/content/${slug}?lang=${lang}`),
  submitContact: (payload: { name: string; email: string; subject: string; message: string; website?: string }) =>
    post<{ status: string }>('/contact', payload),
  lawsRegulations: (lang: LanguageCode = 'en') => get<LawsRegulationsResponse>(`/laws-regulations?lang=${lang}`),
  jobPostings: (lang: LanguageCode = 'en') => get<JobPostingsResponse>(`/job-postings?lang=${lang}`),
  tenders: (lang: LanguageCode = 'en') => get<TendersResponse>(`/tenders?lang=${lang}`),
  navItems: (lang: LanguageCode = 'en') => get<NavItemsResponse>(`/nav-items?lang=${lang}`),
  heroSlides: (lang: LanguageCode = 'en') => get<HeroSlidesResponse>(`/hero-slides?lang=${lang}`),
  siteSettings: () => get<SiteSettings>('/site-settings'),
  publicationCategories: (lang: LanguageCode = 'en') =>
    get<{ results: PublicationCategoryOption[] }>(`/publication-categories?lang=${lang}`),
  bankBranches: (lang: LanguageCode = 'en') => get<BankBranchesResponse>(`/bank-branches?lang=${lang}`),
  faqs: (lang: LanguageCode = 'en') => get<FaqsResponse>(`/faqs?lang=${lang}`),
  subscribeNewsletter: (email: string) => post<NewsletterSubscribeResponse>('/newsletter/subscribe', { email }),
  statistics: () => get<StatisticsResponse>('/statistics'),
};
