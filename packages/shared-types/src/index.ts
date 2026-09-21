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
  totp_enabled?: boolean;
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
  subtitle: string | null;
  body: string | null;
  updated_at: string;
  animation_style?: string | null;
  banner_image_url?: string | null;
  banner_video_url?: string | null;
}

export type Trend = 'up' | 'down' | 'flat';

export interface ExchangeRateLatest {
  id: string;
  currency_code: string;
  currency_name?: string;
  flag_url?: string | null;
  buying_rate: string;
  selling_rate: string;
  rate_to_ssh: string;
  spread?: string;
  spread_pct?: string;
  trend: Trend;
  change_pct: string;
}

export interface Currency {
  code: string;
  name: string;
  name_so?: string | null;
  name_ar?: string | null;
  flag_url?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ExchangeRatesLatestResponse {
  as_of: string | null;
  rates: ExchangeRateLatest[];
}

export interface ExchangeRateHistoryPoint {
  rate_date: string;
  rate_to_ssh: string;
  buying_rate: string;
  selling_rate: string;
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
  logo_url?: string | null;
  website_url?: string | null;
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
  language_served?: LanguageCode;
  fallback_used?: boolean;
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

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  sort_order: number;
  is_active?: boolean;
}

export interface HeroSlidesResponse {
  results: HeroSlide[];
}

export interface BankBranch {
  id: string;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  is_headquarters: boolean;
  sort_order: number;
  is_active?: boolean;
  manager_name?: string | null;
  manager_title?: string | null;
  email?: string | null;
  photo_url?: string | null;
}

export interface BankBranchesResponse {
  results: BankBranch[];
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface FaqsResponse {
  results: Faq[];
}

export interface NewsletterSubscribeResponse {
  subscribed: boolean;
}

export interface StatisticsResponse {
  institutions_by_type: { institution_type: string; count: number }[];
  publications_by_category: { category: string; count: number }[];
  press_releases_by_year: { year: number; count: number }[];
  active_currencies: number;
}

export type PublicationCategory = string;

export interface PublicationCategoryOption {
  slug: string;
  name: string;
  name_so?: string | null;
  name_ar?: string | null;
}

export interface Publication {
  id: string;
  title: string;
  category: PublicationCategory;
  file_url: string;
  publish_date: string;
  thumbnail_url?: string | null;
  is_downloadable?: boolean;
  status?: 'draft' | 'published';
  fallback_used?: boolean;
}

export interface PublicationsResponse {
  results: Publication[];
}

export interface SiteSettings {
  site_name: string;
  logo_url: string | null;
  watermark_url: string | null;
  phone: string | null;
  email: string | null;
  social_x: string | null;
  social_facebook: string | null;
  social_youtube: string | null;
  social_linkedin: string | null;
  country_label_en?: string;
  country_label_so?: string;
  show_country_label?: boolean;
  country_flag_url?: string | null;
  tagline_en?: string;
  tagline_so?: string;
  tagline_ar?: string;
}

export interface LawRegulation {
  id: string;
  title: string;
  file_url: string;
  law_number: string | null;
  effective_date: string | null;
  thumbnail_url?: string | null;
  is_downloadable?: boolean;
  status?: 'draft' | 'published';
  fallback_used?: boolean;
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
  description?: string | null;
  fallback_used?: boolean;
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
  status?: 'open' | 'closed';
  description?: string | null;
  fallback_used?: boolean;
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
  languages: LanguageCode[];
  banner_image_url?: string | null;
  banner_video_url?: string | null;
  animation_style?: string | null;
}

export interface ContentPageTranslation {
  language_code: LanguageCode;
  title: string | null;
  subtitle: string | null;
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

export interface NavItem {
  id: string;
  label: string;
  label_so?: string | null;
  path: string;
  parent_id: string | null;
  sort_order: number;
  is_active?: boolean;
  children?: NavItem[];
}

export interface NavItemsResponse {
  results: NavItem[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ContactMessagesResponse {
  results: ContactMessage[];
  unread_count: number;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string | null;
  closing_date: string;
  status: 'open' | 'closed';
  description?: string | null;
  fallback_used?: boolean;
  language_served?: LanguageCode;
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
  status?: 'open' | 'closed';
  description?: string | null;
  fallback_used?: boolean;
  language_served?: LanguageCode;
}

export interface TendersResponse {
  results: Tender[];
}

export type SearchResultType = 'page' | 'press' | 'publication' | 'law';

export interface SearchResult {
  type: SearchResultType;
  title: string | null;
  snippet: string | null;
  url: string;
  date: string | null;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}
