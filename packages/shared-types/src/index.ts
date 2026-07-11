export type LanguageCode = 'en' | 'so' | 'ar';

export type AdminRole =
  | 'super_admin'
  | 'content_editor'
  | 'supervision_data_officer'
  | 'exchange_rate_officer';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
  iat: number;
  exp: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface ContentResponse {
  slug: string;
  page_type: string;
  status: 'draft' | 'published';
  language_requested: LanguageCode;
  language_served: LanguageCode;
  fallback_used: boolean;
  title: string | null;
  body: string | null;
  updated_at: string;
}

export type Trend = 'up' | 'down' | 'flat';

export interface ExchangeRateLatest {
  currency_code: string;
  rate_to_ssh: string;
  trend: Trend;
  change_pct: string;
}

export interface ExchangeRatesLatestResponse {
  as_of: string | null;
  rates: ExchangeRateLatest[];
}

export interface ExchangeRateHistoryPoint {
  rate_date: string;
  rate_to_ssh: string;
}

export interface ExchangeRatesHistoryResponse {
  currency_code: string;
  series: ExchangeRateHistoryPoint[];
}

export type InstitutionType =
  | 'bank'
  | 'remit'
  | 'mm'
  | 'mfi'
  | 'pay'
  | 'takaful'
  | 'fx';

export type InstitutionStatus = 'active' | 'revoked';

export interface Institution {
  id: string;
  name: string;
  institution_type: InstitutionType;
  status: InstitutionStatus;
  headquarters: string | null;
  license_number: string | null;
  license_date?: string | null;
}

export interface InstitutionsResponse {
  total: number;
  results: Institution[];
}

export interface PressRelease {
  id: string;
  publish_date: string;
  title: string;
  featured: boolean;
  body?: string;
  images: string[];
  video_url: string | null;
}

export interface PressReleasesResponse {
  page: number;
  page_size: number;
  total: number;
  results: PressRelease[];
}

export interface UploadMediaResponse {
  images: string[];
  video: string | null;
  document: string | null;
}

export type PublicationCategory = 'annual_report' | 'circular' | 'stability_report';

export interface Publication {
  id: string;
  title: string;
  category: PublicationCategory;
  file_url: string;
  publish_date: string;
}

export interface PublicationsResponse {
  results: Publication[];
}

export interface LawRegulation {
  id: string;
  title: string;
  file_url: string;
  law_number: string | null;
  effective_date: string | null;
}

export interface LawsRegulationsResponse {
  results: LawRegulation[];
}

export type JobStatus = 'open' | 'closed';

export interface JobPosting {
  id: string;
  title: string;
  department: string | null;
  closing_date: string;
  status: JobStatus;
}

export interface JobPostingsResponse {
  results: JobPosting[];
}

export interface Tender {
  id: string;
  title: string;
  reference_number: string;
  closing_date: string;
  file_url: string | null;
}

export interface TendersResponse {
  results: Tender[];
}

export interface ContentPageSummary {
  id: string;
  slug: string;
  page_type: string;
  status: 'draft' | 'published';
  updated_at: string;
}

export interface ContentPageTranslation {
  language_code: LanguageCode;
  title: string | null;
  body: string | null;
}

export interface ContentPageDetail extends ContentPageSummary {
  translations: ContentPageTranslation[];
}

export interface AuditLogEntry {
  id: number;
  admin_user_id: string;
  action: 'create' | 'update' | 'delete' | 'publish';
  table_name: string;
  record_id: string | null;
  before_value: unknown;
  after_value: unknown;
  ip_address: string | null;
  created_at: string;
  admin_name?: string;
  admin_email?: string;
}
