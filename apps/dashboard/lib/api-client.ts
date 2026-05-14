export interface ScanResult {
  scan_id?: string;
  hash: string;
  url: string;
  status: "pending" | "scanning" | "complete" | "error";
  scanned_at: string;
  technologies: Technology[];
  security: SecurityResult;
  seo: SeoResult;
  company: CompanyInfo | null;
  social_links: SocialLink[];
  business_signals: BusinessSignal[];
  traffic: TrafficInfo | null;
  competitors: Competitor[];
  cost_estimate: CostEstimate | null;
  ai_summary: string;
  // Phase 1: Vulnerability Scanner
  vulnerability?: VulnerabilityResult;
  // Phase 2: Intelligence
  privacy?: PrivacyResult;
  wayback?: WaybackResult;
  js_bundles?: JsBundleResult;
  api_endpoints?: ApiDiscoveryResult;
  supply_chain?: SupplyChainResult;
  carbon?: CarbonResult;
  security_findings?: {
    id: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    title: string;
    description: string;
    impact: string;
    fix: { summary: string; nginx: string | null; apache: string | null; cloudflare: string | null; meta_tag: string | null; vercel_json: string | null; netlify_toml: string | null };
    effort: "5min" | "15min" | "30min" | "1hr" | "complex";
    priority: number;
  }[];
  performance?: Record<string, unknown>;
  accessibility?: Record<string, unknown>;
  email_patterns?: {
    found_emails: string[];
    pattern: string | null;
    confidence: number;
    team_page_url: string | null;
    contact_page_url: string | null;
  };
  screenshot?: string;
}

export interface CarbonResult {
  co2_grams_per_visit: number;
  energy_kwh_per_visit: number;
  is_green_hosted: boolean;
  hosting_provider: string | null;
  sustainability_grade: string;
  page_weight_bytes: number;
  cleaner_than_percent: number;
  annual_co2_kg: number;
  estimated_monthly_visits: number;
  recommendations: string[];
}

export interface VulnerabilityResult {
  sensitive_files?: { exposed_files: { path: string; status: number; size: number; risk_level: string }[]; total_checked: number; issues: string[] };
  cve_matches?: { cves: { id: string; severity: string; score: number; description: string; technology: string; affected_versions: string; published: string }[]; total_found: number };
  cookie_audit?: { cookies: { name: string; domain: string; httpOnly: boolean; secure: boolean; sameSite: string; hasSecurePrefix: boolean; issues: string[] }[]; score: number; issues: string[] };
  cors_check?: { misconfigured: boolean; allows_any_origin: boolean; allows_null: boolean; allows_credentials_with_wildcard: boolean; tested_origins: { origin: string; allowed: boolean; acao_value: string }[]; issues: string[] };
  dns_security?: { spf: { found: boolean; record: string; policy: string; issues: string[] }; dmarc: { found: boolean; record: string; policy: string; issues: string[] }; dkim: { found: boolean }; dnssec: { enabled: boolean }; score: number; issues: string[] };
  admin_panels?: { admin_panels: { path: string; status: number; accessible: boolean }[]; s3_buckets: { url: string; pattern: string }[]; issues: string[] };
}

export interface PrivacyResult {
  has_cookie_banner: boolean;
  banner_provider: string | null;
  tracking_before_consent: boolean;
  tracking_scripts: string[];
  has_privacy_policy: boolean;
  has_terms: boolean;
  compliance_score: number;
  issues: string[];
}

export interface WaybackResult {
  available: boolean;
  first_seen: string | null;
  last_seen: string | null;
  total_captures: number;
  snapshots: { year: string; count: number }[];
  oldest_url: string | null;
}

export interface JsBundleResult {
  total_scripts: number;
  total_size_bytes: number;
  scripts: { url: string; size_bytes: number; has_source_map: boolean }[];
  exposed_source_maps: string[];
  largest_bundle: { url: string; size_bytes: number } | null;
  issues: string[];
}

export interface ApiDiscoveryResult {
  endpoints: { path: string; type: string; status: number; accessible: boolean }[];
  patterns_found: string[];
  has_swagger: boolean;
  has_graphql: boolean;
  has_openapi: boolean;
  issues: string[];
}

export interface SupplyChainResult {
  external_domains: { domain: string; type: string; count: number; domain_age_days: number | null; risk_level: string; is_cdn: boolean }[];
  total_external: number;
  high_risk_count: number;
  score: number;
  issues: string[];
}

// Domain & Monitoring Types
export interface DomainVerification {
  id: string;
  domain: string;
  verification_method: string;
  verification_token: string;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface DeepScanInfo {
  id: string;
  domain: string;
  status: "pending" | "running" | "scanning" | "complete" | "failed";
  pages_found: number;
  pages_scanned: number;
  max_pages: number;
  results: any;
  paired_audit_id?: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface UptimeMonitorInfo {
  id: string;
  domain: string;
  check_interval_seconds: number;
  is_active: boolean;
  last_check_at: string | null;
  last_status: number | null;
  last_response_ms: number | null;
  consecutive_failures: number;
}

export interface UptimeCheckInfo {
  id: string;
  status_code: number | null;
  response_time_ms: number | null;
  error: string | null;
  checked_at: string;
}

export interface SslMonitorInfo {
  id: string;
  domain: string;
  cert_expires_at: string | null;
  last_check_at: string | null;
  alert_days: number[];
}

export interface SpeedMeasurement {
  id: string;
  lcp_ms: number | null;
  fid_ms: number | null;
  cls: number | null;
  ttfb_ms: number | null;
  page_weight_bytes: number | null;
  lighthouse_performance: number | null;
  measured_at: string;
}

export interface Technology {
  name: string;
  category: string;
  version?: string;
  confidence: number;
  icon?: string;
}

export interface SecurityResult {
  score: number;
  grade: string;
  headers: SecurityHeader[];
  issues: SecurityIssue[];
}

export interface SecurityHeader {
  name: string;
  present: boolean;
  value?: string;
}

export interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
}

export interface SeoResult {
  score: number;
  title: string;
  description: string;
  has_sitemap: boolean;
  has_robots_txt: boolean;
  has_structured_data: boolean;
  has_canonical: boolean;
  h1_count: number;
  meta_issues: string[];
}

export interface CompanyInfo {
  name: string;
  description: string;
  industry: string;
  logo_url?: string;
  founded?: string;
  employee_range?: string;
  location?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  followers?: number;
}

export interface BusinessSignal {
  type: string;
  label: string;
  detail: string;
  confidence: number;
}

export interface TrafficInfo {
  tranco_rank: number | null;
  traffic_tier: string;
  estimated_monthly_visits?: string;
}

export interface Competitor {
  url: string;
  name: string;
  similarity_score: number;
  shared_tech: string[];
}

export interface CostEstimate {
  total_min: number;
  total_max: number;
  breakdown: { category: string; min: number; max: number; detail: string }[];
}

export interface Watchlist {
  id: string;
  name: string;
  description: string;
  urls: string[];
  frequency: "daily" | "weekly" | "monthly";
  notify_email: boolean;
  created_at: string;
  updated_at: string;
  recent_changes: number;
}

export interface WatchlistChange {
  id: string;
  url: string;
  change_type: "tech_added" | "tech_removed" | "security_changed" | "content_changed";
  description: string;
  detected_at: string;
}

export interface WebhookResponse {
  id: string;
  domain: string;
  endpoint_url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered_at?: string;
}

export interface CompetitorTrackingResponse {
  id: string;
  domain: string;
  competitor_url: string;
  last_scan_at?: string;
  changes: { type: string; description: string; detected_at: string }[];
}

export interface BulkJob {
  id: string;
  status: "queued" | "running" | "complete" | "failed";
  total_urls: number;
  completed_urls: number;
  failed_urls: number;
  created_at: string;
  results?: ScanResult[];
}

export interface RadarEvent {
  id: string;
  type: "tech_trend" | "security_alert" | "market_signal";
  title: string;
  description: string;
  affected_count: number;
  technology?: string;
  event_date: string;
  urls: string[];
}

export interface Report {
  id: string;
  scan_hash: string;
  url: string;
  slug: string;
  is_public: boolean;
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  created_at: string;
  last_used_at: string | null;
  requests_today: number;
}

export interface UserPlan {
  plan: "free" | "pro";
  scans_today: number;
  scans_limit: number;
  watchlists_count: number;
  watchlists_limit: number;
  team_members: number;
  team_members_limit: number;
  api_calls_today: number;
  api_calls_limit: number;
  reports_limit: number;
  collections_limit: number;
  history_days: number;
  has_deep_scan: boolean;
  has_attack_surface: boolean;
  has_monitoring: boolean;
  has_bulk_scan: boolean;
  has_api_access: boolean;
  has_pdf_export: boolean;
  has_webhooks: boolean;
  has_enrichment: boolean;
  has_mcp: boolean;
  // has_feed_publish: boolean;
  has_lead_search: boolean;
  has_lead_export: boolean;
  has_contact_reveal: boolean;
  has_ai_visibility: boolean;
}

// --- Lead Generation types ---

export interface LeadSearchResult {
  domain: string;
  url: string | null;
  company_name: string | null;
  industry: string | null;
  employees_range: string | null;
  location: string | null;
  traffic_tier: string | null;
  tranco_rank: number | null;
  security_grade: string | null;
  security_score: number | null;
  seo_score: number | null;
  last_scanned: string | null;
}

export interface LeadSearchResponse {
  results: LeadSearchResult[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface TechnologyListItem {
  technology_name: string;
  category: string | null;
  domain_count: number;
}

export interface DomainProfileResponse {
  domain: string;
  url: string | null;
  company_name: string | null;
  description: string | null;
  industry: string | null;
  location: string | null;
  employees_range: string | null;
  founded: string | null;
  logo_url: string | null;
  tranco_rank: number | null;
  traffic_tier: string | null;
  estimated_monthly_visits: string | null;
  email_pattern: string | null;
  found_emails: string[];
  contact_page_url: string | null;
  team_page_url: string | null;
  social_links: { platform: string; url: string; followers?: number }[] | Record<string, unknown>;
  security_grade: string | null;
  security_score: number | null;
  seo_score: number | null;
  has_pricing: boolean;
  has_careers: boolean;
  is_hiring: boolean;
  payment_processors: string[];
  chat_widgets: string[];
  ad_pixels: string[];
  technologies: { technology_name: string; category: string | null; version: string | null; confidence: number | null }[];
  last_scanned: string | null;
}

export interface TrafficDataResponse {
  domain: string;
  current: { tranco_rank: number | null; traffic_tier: string | null; estimated_monthly_visits: string | null } | null;
  history: { recorded_at: string; tranco_rank: number | null; composite_score: number | null; traffic_tier: string | null }[];
  upgrade_message?: string;
}

// --- AI Visibility types ---

export interface AiVisibilityCheck {
  id: string;
  domain: string;
  brand_name: string;
  industry: string | null;
  overall_score: number;
  models_checked: number;
  models_mentioning: number;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
}

export interface AiVisibilityResultItem {
  id: string;
  check_id: string;
  query: string;
  model: string;
  brand_mentioned: boolean;
  mention_context: string | null;
  mention_position: number | null;
  competitor_mentions: string[];
  response_snippet: string | null;
  checked_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar_url: string;
  is_public: boolean;
  scan_count: number;
  published_count: number;
  follower_count: number;
  following_count: number;
  badges: Badge[];
  is_following?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "milestone" | "skill" | "social";
  earned_at: string | null;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  visibility: "public" | "private";
  item_count: number;
  preview_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  scan_hash: string;
  url: string;
  title: string;
  notes: string;
  added_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  name: string;
  avatar_url?: string;
  scan_count: number;
  published_count: number;
  like_count: number;
  follower_count: number;
  is_current_user: boolean;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "badge" | "system";
  title: string;
  body: string;
  link: string;
  read: boolean;
  actor?: { id: string; username: string; name: string; avatar_url?: string };
  created_at: string;
}

// --- Health Score types ---
export interface HealthScoreResponse {
  overall: number;
  security: number;
  performance: number;
  seo: number;
  availability: number;
}

export interface HealthScoreHistoryResponse {
  entries: { date: string; overall: number; security: number; performance: number; seo: number; availability: number }[];
}

// --- Tech History types ---
export interface TechChangeEventResponse {
  id: string;
  date: string;
  type: "added" | "removed" | "version_change";
  technology: string;
  category: string;
  old_version?: string;
  new_version?: string;
}

// --- Issue Tracker types ---
export interface IssueResponse {
  id: string;
  domain: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  title: string;
  description: string;
  source: string;
  detected_at: string;
  status: "open" | "resolved" | "ignored";
  assigned_to?: string;
}

export interface AlertPreferenceResponse {
  domain: string;
  enabled: boolean;
  channels: { email: boolean; slack: boolean; webhook: boolean };
  thresholds: Record<string, any>;
}

export interface RegressionAlertResponse {
  id: string;
  domain: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  previous_value: string;
  current_value: string;
  detected_at: string;
  acknowledged: boolean;
}

export interface AttackSurfaceAuditResponse {
  id: string;
  domain: string;
  status: "pending" | "running" | "complete" | "failed";
  scope: Record<string, any>;
  findings: {
    id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
    evidence: string;
    remediation: string;
    cvss_score?: number;
    cwe_id?: string;
    affected_asset: string;
  }[];
  logs: { timestamp: string; level: string; phase: string; message: string }[];
  ai_summary?: string;
  paired_deep_scan_id?: string | null;
  started_at: string;
  completed_at?: string;
}

export interface ShowcaseScan {
  domain: string;
  url: string;
  category: string;
  tech_stack: { name: string; category: string; confidence: number }[];
  security_grade: string | null;
  security_score: number | null;
  seo_score: number | null;
  traffic_rank: number | null;
  estimated_visits: string | null;
  company_name: string | null;
  company_industry: string | null;
  ai_summary: string | null;
  scanned_at: string;
}

export interface ComplianceReportResponse {
  domain: string;
  results: { regulation_id: string; status: string; score: number; checks: { check_id: string; result: string }[] }[];
  evaluated_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errorCode?: string;
}

// Plan limits for building UserPlan on the frontend — 2-plan system (Free + Pro)
const PLAN_LIMITS: Record<string, {
  scans: number; watchlists: number; team: number; api: number;
  reports: number; collections: number; historyDays: number;
  deepScan: boolean; attackSurface: boolean; monitoring: boolean;
  bulkScan: boolean; apiAccess: boolean; pdfExport: boolean;
  teams: boolean; webhooks: boolean; enrichment: boolean; mcp: boolean; // feedPublish: boolean;
  leadSearch: boolean; leadExport: boolean; contactReveal: boolean; aiVisibility: boolean;
}> = {
  free: {
    scans: 3, watchlists: 1, team: 1, api: 10,
    reports: 3, collections: 1, historyDays: 3,
    deepScan: false, attackSurface: false, monitoring: false,
    bulkScan: true, apiAccess: true, pdfExport: false,
    teams: false, webhooks: false, enrichment: false, mcp: false, // feedPublish: false,
    leadSearch: true, leadExport: false, contactReveal: false, aiVisibility: false,
  },
  pro: {
    scans: -1, watchlists: -1, team: 5, api: 10000,
    reports: -1, collections: -1, historyDays: 365,
    deepScan: true, attackSurface: true, monitoring: true,
    bulkScan: true, apiAccess: true, pdfExport: true,
    teams: false, webhooks: true, enrichment: true, mcp: true, // feedPublish: false,
    leadSearch: true, leadExport: true, contactReveal: true, aiVisibility: true,
  },
};

class ApiClient {
  private baseUrl: string;
  private pendingControllers = new Set<AbortController>();

  constructor() {
    const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    this.baseUrl = publicApiUrl ? `${publicApiUrl}/api/v1` : "/api/v1";
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
    };
  }

  abortAllRequests() {
    for (const controller of this.pendingControllers) {
      controller.abort();
    }
    this.pendingControllers.clear();
  }

  async request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const controller = options?.signal ? null : new AbortController();
    if (controller) {
      this.pendingControllers.add(controller);
    }

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        credentials: "include",
        signal: options?.signal ?? controller?.signal,
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
      });

      // Handle 204 No Content
      if (res.status === 204) {
        return { data: undefined as unknown as T };
      }

      // Handle empty body
      const text = await res.text();
      if (!text) {
        if (res.ok) return { data: undefined as unknown as T };
        return { error: `Request failed (${res.status})` };
      }

      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        if (res.ok) return { data: undefined as unknown as T };
        return { error: text || `Request failed (${res.status})` };
      }

      if (!res.ok) {
        const errorCode = typeof body.error === "string" ? undefined : body.error?.code;
        const errorMsg = typeof body.error === 'string' ? body.error : body.error?.message || body.message || `Request failed (${res.status})`;
        return { error: errorMsg, errorCode };
      }
      return { data: body };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { error: "Request cancelled", errorCode: "aborted" };
      }
      return { error: err instanceof Error ? err.message : "Network error" };
    } finally {
      if (controller) {
        this.pendingControllers.delete(controller);
      }
    }
  }

  private normalizeScanUrl(url: string): string {
    const trimmed = url.trim().toLowerCase();
    const withScheme =
      !trimmed.startsWith("http://") && !trimmed.startsWith("https://")
        ? `https://${trimmed}`
        : trimmed;

    return withScheme.replace(/\/+$/, "");
  }

  private async hashScanUrl(url: string): Promise<string> {
    const normalized = this.normalizeScanUrl(url);

    if (!globalThis.crypto?.subtle) {
      return "";
    }

    const bytes = new TextEncoder().encode(normalized);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: { id: string; email: string; name: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  }

  async register(email: string, password: string, name: string) {
    return this.request<{ status: string; expires_in_seconds: number; retry_after_seconds: number }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async verifyRegistrationOtp(email: string, otp: string) {
    return this.request<{ token: string; user: { id: string; email: string; name: string } }>("/auth/register/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
      cache: "no-store",
    });
  }

  async logout() {
    return this.request<{ status: string }>("/auth/logout", {
      method: "POST",
      cache: "no-store",
    });
  }

  async resendRegistrationOtp(email: string) {
    return this.request<{ status: string; expires_in_seconds: number; retry_after_seconds: number }>("/auth/register/resend", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async requestPasswordReset(email: string) {
    return this.request<{ status: string; expires_in_seconds: number; retry_after_seconds: number }>("/auth/password/request-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(email: string, otp: string, newPassword: string) {
    return this.request<{ status: string }>("/auth/password/confirm-reset", {
      method: "POST",
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });
  }

  // Scans
  async scan(url: string): Promise<ApiResponse<ScanResult>> {
    const res = await this.request<{ scan_id: string; status: string; result: any; cached: boolean }>("/scan", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
    if (res.error) return { error: res.error };
    if (res.data?.result) {
      const mapped = this.mapScanResult(res.data.result);
      mapped.scan_id = res.data.scan_id || mapped.scan_id;
      return { data: mapped };
    }

    if (res.data?.status === "pending" || res.data?.status === "scanning") {
      const hash = await this.hashScanUrl(url);

      return {
        data: {
          hash,
          url: this.normalizeScanUrl(url),
          status: res.data.status as ScanResult["status"],
          scanned_at: new Date().toISOString(),
          technologies: [],
          security: { score: 0, grade: "?", headers: [], issues: [] },
          seo: {
            score: 0,
            title: "",
            description: "",
            has_sitemap: false,
            has_robots_txt: false,
            has_structured_data: false,
            has_canonical: false,
            h1_count: 0,
            meta_issues: [],
          },
          company: null,
          social_links: [],
          business_signals: [],
          traffic: null,
          competitors: [],
          cost_estimate: null,
          ai_summary: "",
        },
      };
    }
    return { error: "No scan result returned" };
  }

  async getScan(hash: string): Promise<ApiResponse<ScanResult>> {
    const res = await this.request<{ scan_id: string; status: string; result: any; cached: boolean }>(`/scan/${hash}`);
    if (res.error) return { error: res.error };
    if (res.data?.result) {
      const mapped = this.mapScanResult(res.data.result);
      mapped.scan_id = res.data.scan_id || mapped.scan_id;
      return { data: mapped };
    }
    if (res.data?.status === "pending" || res.data?.status === "scanning") {
      return {
        data: {
          hash,
          url: "",
          status: res.data.status as ScanResult["status"],
          scanned_at: new Date().toISOString(),
          technologies: [],
          security: { score: 0, grade: "?", headers: [], issues: [] },
          seo: {
            score: 0,
            title: "",
            description: "",
            has_sitemap: false,
            has_robots_txt: false,
            has_structured_data: false,
            has_canonical: false,
            h1_count: 0,
            meta_issues: [],
          },
          company: null,
          social_links: [],
          business_signals: [],
          traffic: null,
          competitors: [],
          cost_estimate: null,
          ai_summary: "",
        },
      };
    }
    return { error: "No scan result returned" };
  }

  private mapScanResult(r: any): ScanResult {
    // Confidence comes as 0-1 float from backend, convert to 0-100 percentage
    const toPercent = (v: number) => v <= 1 ? Math.round(v * 100) : Math.round(v);

    return {
      scan_id: r.id || r.scan_id || undefined,
      hash: r.url_hash || "",
      url: r.url || "",
      status: "complete",
      scanned_at: r.scanned_at || new Date().toISOString(),
      technologies: (r.tech_stack || []).map((t: any) => ({
        name: t.name,
        category: t.category,
        version: t.version,
        confidence: toPercent(t.confidence),
        icon: t.icon,
      })),
      security: {
        score: r.security?.score || 0,
        grade: r.security?.grade || "F",
        headers: (r.security?.headers || []).map((h: any) => ({
          name: h.name,
          present: h.present,
          value: h.value,
        })),
        issues: (r.security?.issues || []).map((i: string) => ({
          severity: "medium" as const,
          title: i,
          description: i,
        })),
      },
      seo: {
        score: r.seo?.score || 0,
        title: r.seo?.meta_title || "",
        description: r.seo?.meta_description || "",
        has_sitemap: r.seo?.has_sitemap || false,
        has_robots_txt: r.seo?.has_robots || false,
        has_structured_data: r.seo?.has_structured_data || false,
        has_canonical: !!r.seo?.canonical_url,
        h1_count: r.seo?.heading_structure?.h1 || 0,
        meta_issues: [],
      },
      company: r.company?.name ? {
        name: r.company.name,
        description: r.company.description || "",
        industry: r.company.industry || "",
        logo_url: r.company.logo,
        founded: r.company.founded,
        employee_range: r.company.employees_range,
        location: r.company.location,
      } : null,
      social_links: (r.social_links || []).map((s: any) => ({
        platform: s.platform,
        url: s.url,
        followers: s.followers,
      })),
      business_signals: [
        ...(r.business_signals?.has_pricing ? [{ type: "pricing", label: "Pricing Page", detail: "Has a pricing page", confidence: 100 }] : []),
        ...(r.business_signals?.has_careers ? [{ type: "careers", label: "Careers Page", detail: "Currently hiring", confidence: 100 }] : []),
        ...(r.business_signals?.is_hiring ? [{ type: "hiring", label: "Hiring", detail: "Actively hiring", confidence: 100 }] : []),
        ...(r.business_signals?.is_monetized ? [{ type: "monetized", label: "Monetized", detail: "Website is monetized", confidence: 100 }] : []),
        ...(r.business_signals?.ad_pixels || []).map((p: string) => ({ type: "ads", label: p, detail: `Uses ${p}`, confidence: 90 })),
        ...(r.business_signals?.chat_widgets || []).map((w: string) => ({ type: "chat", label: w, detail: `Uses ${w} for support`, confidence: 90 })),
        ...(r.business_signals?.payment_processors || []).map((p: string) => ({ type: "payment", label: p, detail: `Accepts payments via ${p}`, confidence: 90 })),
        ...(r.business_signals?.email_providers || []).map((e: string) => ({ type: "email", label: e, detail: `Uses ${e} for email`, confidence: 90 })),
      ],
      traffic: r.traffic ? {
        tranco_rank: r.traffic.tranco_rank,
        traffic_tier: r.traffic.traffic_tier,
        estimated_monthly_visits: r.traffic.estimated_monthly_visits,
      } : null,
      competitors: (r.competitors || []).map((c: any) => ({
        url: c.url,
        name: c.name || c.url,
        // Backend sends 0-1 float, convert to percentage for display
        similarity_score: c.similarity_score <= 1 ? Math.round(c.similarity_score * 100) : Math.round(c.similarity_score),
        shared_tech: c.shared_technologies || [],
      })),
      cost_estimate: r.cost_estimate ? {
        total_min: r.cost_estimate.total_monthly_min,
        total_max: r.cost_estimate.total_monthly_max,
        breakdown: (r.cost_estimate.breakdown || []).map((b: any) => ({
          category: b.category,
          min: b.min_monthly,
          max: b.max_monthly,
          detail: b.service,
        })),
      } : null,
      ai_summary: r.ai_summary || "",
      // Phase 1: Vulnerability data (passed through from worker)
      vulnerability: r.vulnerability || undefined,
      // Phase 2: Intelligence data (passed through from worker)
      privacy: r.privacy || undefined,
      wayback: r.wayback || undefined,
      js_bundles: r.js_bundles || undefined,
      api_endpoints: r.api_endpoints || undefined,
      supply_chain: r.supply_chain || undefined,
      // Phase 7: New features
      carbon: r.carbon || undefined,
      security_findings: r.security_findings || undefined,
      email_patterns: r.email_patterns || undefined,
      screenshot: r.screenshot || undefined,
      // Phase 6: Performance
      performance: r.performance || undefined,
      accessibility: r.accessibility || undefined,
    };
  }

  // Map a ScanRow (from history/recent-scans) to ScanResult
  private mapScanRow(row: any): ScanResult {
    // ScanRow has { id, url, url_hash, result (JSON), scanned_at, expires_at }
    if (row.result) {
      const mapped = this.mapScanResult(row.result);
      // Override hash and url from the row level if present
      mapped.scan_id = row.id || mapped.scan_id;
      mapped.hash = row.url_hash || mapped.hash;
      mapped.url = row.url || mapped.url;
      mapped.scanned_at = row.scanned_at || mapped.scanned_at;
      return mapped;
    }
    // Fallback: row IS the scan result (e.g. already mapped)
    return this.mapScanResult(row);
  }

  private mapCollection(raw: any): Collection {
    return {
      id: raw.id,
      title: raw.title || "",
      description: raw.description || "",
      visibility: raw.visibility || (raw.is_public ? "public" : "private"),
      item_count: raw.item_count ?? 0,
      preview_urls: raw.preview_urls || [],
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),
    };
  }

  private mapCollectionItem(raw: any): CollectionItem {
    const url = raw.url || "";
    const inferredTitle =
      raw.title ||
      (() => {
        try {
          return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
        } catch {
          return url;
        }
      })();

    return {
      id: raw.id,
      collection_id: raw.collection_id,
      scan_hash: raw.scan_hash || raw.scan_id || "",
      url,
      title: inferredTitle,
      notes: raw.notes || raw.note || "",
      added_at: raw.added_at || raw.created_at || new Date().toISOString(),
    };
  }

  // Recent scans for the current user (uses the /scan/recent endpoint we added)
  // Falls back gracefully if endpoint doesn't exist
  async getRecentScans(): Promise<ApiResponse<ScanResult[]>> {
    const res = await this.request<any[]>("/scan/recent");
    if (res.error) return { data: [] }; // graceful fallback
    if (res.data) {
      return { data: res.data.map((r: any) => this.mapScanRow(r)) };
    }
    return { data: [] };
  }

  // History for a specific URL hash
  async getHistory(hash: string): Promise<ApiResponse<ScanResult[]>> {
    const res = await this.request<any[]>(`/history/${hash}`);
    if (res.error) return { data: [] };
    if (res.data) {
      return { data: res.data.map((r: any) => this.mapScanRow(r)) };
    }
    return { data: [] };
  }

  // Watchlists
  // Backend expects: { name, urls, check_interval?, alert_email?, alert_slack_webhook? }
  async createWatchlist(data: { name: string; description: string; urls: string[]; frequency: string }) {
    // Map frontend frequency to backend check_interval (hours)
    const intervalMap: Record<string, number> = { daily: 24, weekly: 168, monthly: 720 };
    const res = await this.request<any>("/watchlists", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        urls: data.urls,
        check_interval: intervalMap[data.frequency] || 168,
        alert_email: true,
      }),
    });
    if (res.error) return { error: res.error } as ApiResponse<Watchlist>;
    if (res.data) return { data: this.mapWatchlist(res.data) };
    return { error: "Failed to create watchlist" } as ApiResponse<Watchlist>;
  }

  async getWatchlists(): Promise<ApiResponse<Watchlist[]>> {
    const res = await this.request<any[]>("/watchlists");
    if (res.error) return { error: res.error };
    if (res.data) {
      return { data: res.data.map((w: any) => this.mapWatchlist(w)) };
    }
    return { data: [] };
  }

  async getWatchlist(id: string): Promise<ApiResponse<Watchlist & { changes: WatchlistChange[] }>> {
    // Backend returns { watchlist, changes }
    const res = await this.request<{ watchlist: any; changes: any[] }>(`/watchlists/${id}`);
    if (res.error) return { error: res.error };
    if (res.data) {
      return {
        data: {
          ...this.mapWatchlist(res.data.watchlist),
          changes: (res.data.changes || []).map((c: any) => ({
            id: c.id,
            url: c.url,
            change_type: c.change_type,
            description: c.change_type,
            detected_at: c.detected_at,
          })),
        },
      };
    }
    return { error: "Watchlist not found" };
  }

  async updateWatchlistSettings(id: string, data: { frequency?: string; notify_email?: boolean; slack_webhook?: string; discord_webhook?: string }) {
    const intervalMap: Record<string, number> = { daily: 24, weekly: 168, monthly: 720 };
    const body: any = {};
    if (data.frequency) body.check_interval = intervalMap[data.frequency] || 168;
    if (data.notify_email !== undefined) body.alert_email = data.notify_email;
    if (data.slack_webhook !== undefined) body.alert_slack_webhook = data.slack_webhook;
    if (data.discord_webhook !== undefined) body.alert_discord_webhook = data.discord_webhook;
    const res = await this.request<any>(`/watchlists/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (res.error) return { error: res.error } as ApiResponse<Watchlist>;
    if (res.data) return { data: this.mapWatchlist(res.data) };
    return { error: "Failed to update" } as ApiResponse<Watchlist>;
  }

  async updateWatchlistUrls(id: string, urls: string[]): Promise<ApiResponse<Watchlist>> {
    const res = await this.request<any>(`/watchlists/${id}`, {
      method: "PUT",
      body: JSON.stringify({ urls }),
    });
    if (res.error) return { error: res.error };
    if (res.data) return { data: this.mapWatchlist(res.data) };
    return { error: "Failed to update URLs" };
  }

  private mapWatchlist(w: any): Watchlist {
    // Backend: { id, user_id, team_id, name, urls, check_interval, alert_email, alert_slack_webhook, created_at, updated_at }
    // Map check_interval (hours) to frequency
    let frequency: "daily" | "weekly" | "monthly" = "weekly";
    if (w.check_interval <= 24) frequency = "daily";
    else if (w.check_interval >= 720) frequency = "monthly";
    return {
      id: w.id,
      name: w.name,
      description: "", // Backend doesn't have description
      urls: w.urls || [],
      frequency,
      notify_email: w.alert_email ?? true,
      created_at: w.created_at,
      updated_at: w.updated_at,
      recent_changes: 0, // Backend doesn't track this in the watchlist row
    };
  }

  // Reports
  // Backend expects: { url, title?, scan_result (JSON), is_public? }
  // Frontend sends scan_hash - we need to fetch the scan first, then create report
  async createReport(data: { scan_hash: string; is_public: boolean }): Promise<ApiResponse<Report>> {
    // First get the scan result
    const scanRes = await this.request<{ scan_id: string; status: string; result: any; cached: boolean }>(`/scan/${data.scan_hash}`);
    if (scanRes.error || !scanRes.data?.result) {
      return { error: scanRes.error || "Scan not found" };
    }
    const scanResult = scanRes.data.result;
    const res = await this.request<any>("/reports", {
      method: "POST",
      body: JSON.stringify({
        url: scanResult.url,
        title: scanResult.company?.name || scanResult.url,
        scan_result: scanResult,
        is_public: data.is_public,
      }),
    });
    if (res.error) return { error: res.error };
    if (res.data) return { data: this.mapReport(res.data) };
    return { error: "Failed to create report" };
  }

  async getReports(): Promise<ApiResponse<Report[]>> {
    const res = await this.request<any[]>("/reports");
    if (res.error) return { error: res.error };
    if (res.data) return { data: res.data.map((r: any) => this.mapReport(r)) };
    return { data: [] };
  }

  async getReport(id: string) {
    return this.request<any>(`/reports/${id}`);
  }

  async getPublicReport(slug: string) {
    return this.request<any>(`/reports/public/${slug}`);
  }

  async toggleReportVisibility(_id: string, _is_public: boolean): Promise<ApiResponse<Report>> {
    return { error: "Report visibility cannot be changed after creation. Create a new report with the desired visibility." };
  }

  async deleteReport(_id: string) {
    return { error: "Reports cannot be deleted. They serve as a permanent record of scan results." };
  }

  private mapReport(r: any): Report {
    // Backend: { id, user_id, url, title, scan_result (JSON), is_public, slug, views, created_at, updated_at }
    return {
      id: r.id,
      scan_hash: "", // not stored separately in backend
      url: r.url,
      slug: r.slug || "",
      is_public: r.is_public,
      created_at: r.created_at,
    };
  }

  // Radar
  async getRadarEvents(filters?: { type?: string; technology?: string; since?: string }) {
    const params = new URLSearchParams();
    if (filters?.type) params.set("event_type", filters.type);
    if (filters?.technology) params.set("technology", filters.technology);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<any[]>(`/radar${query}`);
    if (res.error) return { data: [] as RadarEvent[] };
    if (res.data) {
      return {
        data: res.data.map((e: any) => ({
          id: e.id,
          type: e.event_type || "tech_trend",
          title: e.technology || e.event_type || "Event",
          description: e.details ? JSON.stringify(e.details) : "",
          affected_count: e.count || 0,
          technology: e.technology,
          event_date: e.detected_at,
          urls: e.affected_urls || [],
        })) as RadarEvent[],
      };
    }
    return { data: [] as RadarEvent[] };
  }

  // Bulk
  private mapBulkJob(job: any): BulkJob {
    const results = Array.isArray(job?.results)
      ? job.results.map((row: any) => this.mapScanRow(row))
      : [];

    return {
      id: job.id,
      status: job.status,
      total_urls: job.total_urls || 0,
      completed_urls: job.completed_urls || 0,
      failed_urls: job.failed_urls || 0,
      created_at: job.created_at || new Date().toISOString(),
      results,
    };
  }

  async createBulkScan(urls: string[]): Promise<ApiResponse<BulkJob>> {
    const res = await this.request<any>("/bulk", {
      method: "POST",
      body: JSON.stringify({ urls }),
    });
    if (res.error) return { error: res.error };
    if (res.data) return { data: this.mapBulkJob(res.data) };
    return { error: "Failed to create bulk scan" };
  }

  async getBulkJob(id: string): Promise<ApiResponse<BulkJob>> {
    const res = await this.request<any>(`/bulk/${id}`);
    if (res.error) return { error: res.error };
    if (res.data) return { data: this.mapBulkJob(res.data) };
    return { error: "Bulk job not found" };
  }

  async getBulkJobs(): Promise<ApiResponse<BulkJob[]>> {
    const res = await this.request<any[]>("/bulk");
    if (res.error) return { error: res.error };
    return { data: Array.isArray(res.data) ? res.data.map((job) => this.mapBulkJob(job)) : [] };
  }

  // Teams feature removed
/*
  async createTeam(data: { name: string }): Promise<ApiResponse<Team>> {
...
  }
*/

  // API Keys
  // Backend paths: /auth/api-key (POST), /auth/api-keys (GET), /auth/api-keys/:id (DELETE)
  async getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    const res = await this.request<any[]>("/auth/api-keys");
    if (res.error) return { error: res.error };
    if (res.data) {
      return {
        data: res.data.map((k: any) => ({
          id: k.id,
          name: k.name,
          key_preview: k.key_prefix || "",
          created_at: k.created_at,
          last_used_at: k.last_used_at,
          requests_today: k.requests_today || 0,
        })),
      };
    }
    return { data: [] };
  }

  async createApiKey(name: string): Promise<ApiResponse<{ id: string; key: string; name: string }>> {
    // Backend returns { api_key: { id, name, key_prefix, ... }, key: "xrai_..." }
    const res = await this.request<{ api_key: any; key: string }>("/auth/api-key", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    if (res.error) return { error: res.error };
    if (res.data) {
      return {
        data: {
          id: res.data.api_key.id,
          key: res.data.key,
          name: res.data.api_key.name,
        },
      };
    }
    return { error: "Failed to create API key" };
  }

  async deleteApiKey(id: string) {
    return this.request<void>(`/auth/api-keys/${id}`, { method: "DELETE" });
  }

  // Billing
  // No /billing/plan endpoint -- build UserPlan from /auth/me data
  async getUserPlan(): Promise<ApiResponse<UserPlan>> {
    const res = await this.request<{ id: string; email: string; name: string; plan: string; scans_today: number; team_id: string | null }>("/auth/me");
    if (res.error) return { error: res.error };
    if (res.data) {
      // Map legacy plan names (business/enterprise) to pro
      const rawPlan = res.data.plan || "free";
      const plan = (rawPlan === "business" || rawPlan === "enterprise") ? "pro" : rawPlan;
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
      return {
        data: {
          plan: plan as UserPlan["plan"],
          scans_today: res.data.scans_today || 0,
          scans_limit: limits.scans,
          watchlists_count: 0,
          watchlists_limit: limits.watchlists,
          team_members: 0,
          team_members_limit: limits.team,
          api_calls_today: 0,
          api_calls_limit: limits.api,
          reports_limit: limits.reports,
          collections_limit: limits.collections,
          history_days: limits.historyDays,
          has_deep_scan: limits.deepScan,
          has_attack_surface: limits.attackSurface,
          has_monitoring: limits.monitoring,
          has_bulk_scan: limits.bulkScan,
          has_api_access: limits.apiAccess,
          has_pdf_export: limits.pdfExport,
          has_webhooks: limits.webhooks,
          has_enrichment: limits.enrichment,
          has_mcp: limits.mcp,
          // has_feed_publish: limits.feedPublish,
          has_lead_search: limits.leadSearch,
          has_lead_export: limits.leadExport,
          has_contact_reveal: limits.contactReveal,
          has_ai_visibility: limits.aiVisibility,
        },
      };
    }
    return { error: "Failed to get plan" };
  }

  async createCheckoutSession(plan: string, promotionCode?: string) {
    // Backend expects { price_id, success_url, cancel_url, promotion_code? }
    // 2-plan system: pro (monthly) and pro_annual
    const priceIds: Record<string, string> = {
      pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || "price_1TCMKtRqj7w3uyhn2JYqfiqP",
      pro_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || "price_1TCMLhRqj7w3uyhndIOFvfzM",
    };
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return this.request<{ url: string }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify({
        price_id: priceIds[plan] || plan,
        success_url: `${baseUrl}/dashboard/billing?success=true`,
        cancel_url: `${baseUrl}/dashboard/billing?canceled=true`,
        ...(promotionCode ? { promotion_code: promotionCode } : {}),
      }),
    });
  }

  async createPortalSession() {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return this.request<{ url: string }>("/billing/portal", {
      method: "POST",
      body: JSON.stringify({
        return_url: `${baseUrl}/dashboard/billing`,
      }),
    });
  }

  // User
  async getProfile() {
    return this.request<{ id: string; name: string; email: string; plan: string }>("/auth/me", {
      cache: "no-store",
    });
  }

  async getSession() {
    return this.request<{ id: string; name: string; email: string; plan: string }>("/auth/session", {
      cache: "no-store",
    });
  }

  async updateProfile(data: { name?: string }) {
    return this.request<{ id: string; name: string }>("/auth/settings/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateNotificationPrefs(prefs: Record<string, boolean>) {
    return this.request<{ status: string; preferences: Record<string, boolean> }>(
      "/auth/settings/notifications",
      {
        method: "PUT",
        body: JSON.stringify(prefs),
      }
    );
  }

  async getNotificationPrefs() {
    return this.request<Record<string, boolean>>("/auth/settings/notifications");
  }

  async changePassword(data: { current_password: string; new_password: string }) {
    return this.request<{ status: string }>("/auth/password/change", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(password: string) {
    return this.request<{ status: string }>("/auth/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
  }

  // Social / Feed feature removed
/*
  async getFeed(sort: "recent" | "popular" | "trending" = "recent", page = 1): Promise<ApiResponse<{ items: FeedItem[]; has_more: boolean }>> {
...
  }
*/

  // --- Profiles ---

  async getMyProfile(): Promise<ApiResponse<UserProfile>> {
    const res = await this.request<any>("/users/profile");
    if (res.error) return { error: res.error };
    const user = res.data;
    return {
      data: {
        id: user.id,
        username: user.username || "",
        name: user.name || "",
        bio: user.bio || "",
        avatar_url: user.avatar_url || "",
        is_public: user.is_public ?? true,
        scan_count: user.scans_today ?? 0,
        published_count: 0,
        follower_count: 0,
        following_count: 0,
        is_following: false,
        badges: [],
      },
    };
  }

  async updateMyProfile(data: { username?: string; bio?: string; avatar_url?: string; is_public?: boolean }): Promise<ApiResponse<UserProfile>> {
    const payload = {
      ...data,
      username:
        data.username !== undefined
          ? (data.username.trim() ? data.username.trim() : undefined)
          : undefined,
    };

    return this.request<UserProfile>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async getPublicProfile(username: string): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>(`/users/${username}`);
  }

  /*
  async getUserPublishedScans(username: string): Promise<ApiResponse<FeedItem[]>> {
    const res = await this.request<any>(`/users/${username}/scans`);
    if (res.error) return { data: [] };
    const arr = Array.isArray(res.data) ? res.data : (res.data?.scans || []);
    return { data: arr };
  }
  */

  async followUser(userId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/follow/user/${userId}`, { method: "POST" });
  }

  async unfollowUser(userId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/follow/user/${userId}`, { method: "DELETE" });
  }

  // --- Collections ---

  async getCollections(): Promise<ApiResponse<Collection[]>> {
    const res = await this.request<any>("/collections");
    if (res.error) return { data: [] };
    // API may return { collections: [] }, { items: [] }, or a raw array.
    const arr = Array.isArray(res.data) ? res.data : (res.data?.collections || []);
    return { data: arr.map((item: any) => this.mapCollection(item)) };
  }

  async getCollection(id: string): Promise<ApiResponse<Collection & { items: CollectionItem[] }>> {
    const res = await this.request<any>(`/collections/${id}`);
    if (res.error) return { error: res.error };
    if (!res.data) return { error: "Collection not found" };

    const collection = this.mapCollection(res.data.collection || res.data);
    const items = (res.data.items || []).map((item: any) => this.mapCollectionItem(item));
    return { data: { ...collection, items } };
  }

  async createCollection(data: { title: string; description: string; visibility: "public" | "private" }): Promise<ApiResponse<Collection>> {
    const res = await this.request<any>("/collections", {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        is_public: data.visibility === "public",
      }),
    });
    if (res.error) return { error: res.error };
    return { data: this.mapCollection(res.data) };
  }

  async updateCollection(id: string, data: { title?: string; description?: string; visibility?: "public" | "private" }): Promise<ApiResponse<Collection>> {
    const res = await this.request<any>(`/collections/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        is_public: data.visibility ? data.visibility === "public" : undefined,
      }),
    });
    if (res.error) return { error: res.error };
    return { data: this.mapCollection(res.data) };
  }

  async deleteCollection(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/collections/${id}`, { method: "DELETE" });
  }

  async addToCollection(collectionId: string, data: { scan_hash: string; url: string; title: string; notes: string }): Promise<ApiResponse<CollectionItem>> {
    const res = await this.request<any>(`/collections/${collectionId}/items`, {
      method: "POST",
      body: JSON.stringify({
        url: data.url,
        note: data.notes,
      }),
    });
    if (res.error) return { error: res.error };
    return { data: this.mapCollectionItem(res.data) };
  }

  async removeFromCollection(collectionId: string, itemId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/collections/${collectionId}/items/${itemId}`, { method: "DELETE" });
  }

  // --- Leaderboard ---

  async getLeaderboard(period: "weekly" | "monthly" | "all_time" = "weekly"): Promise<ApiResponse<LeaderboardEntry[]>> {
    const res = await this.request<any>(`/leaderboard?period=${period}`);
    if (res.error) return { data: [] };
    // API returns { entries: [], count: 0, period: "weekly" }
    const arr = Array.isArray(res.data) ? res.data : (res.data?.entries || []);
    return { data: arr };
  }

  async getMyBadges(): Promise<ApiResponse<Badge[]>> {
    const res = await this.request<any>("/achievements");
    if (res.error) return { data: [] };
    // API may return { achievements: [] } or plain array
    const arr = Array.isArray(res.data) ? res.data : (res.data?.achievements || res.data?.badges || []);
    return { data: arr };
  }

  // --- Notifications ---

  async getNotifications(page = 1): Promise<ApiResponse<Notification[]>> {
    const res = await this.request<any>(`/notifications?page=${page}`);
    if (res.error) return { data: [] };
    // API may return { notifications: [] } or plain array
    const arr = Array.isArray(res.data) ? res.data : (res.data?.notifications || []);
    return { data: arr };
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    // Get notifications and count unread locally
    const res = await this.getNotifications();
    const count = (res.data || []).filter((n: any) => !n.read).length;
    return { data: { count } };
  }

  async markNotificationRead(id: string): Promise<ApiResponse<void>> {
    return this.request<void>("/notifications/read", {
      method: "PUT",
      body: JSON.stringify({ ids: [id] }),
    });
  }

  async markAllNotificationsRead(): Promise<ApiResponse<void>> {
    return this.request<void>("/notifications/read", {
      method: "PUT",
      body: JSON.stringify({}),
    });
  }

  // --- Domain Verification ---

  async startDomainVerification(domain: string, method: string = "dns_txt"): Promise<ApiResponse<DomainVerification>> {
    return this.request<DomainVerification>("/domains/verify", {
      method: "POST",
      body: JSON.stringify({ domain, method }),
    });
  }

  async checkDomainVerification(id: string): Promise<ApiResponse<DomainVerification>> {
    return this.request<DomainVerification>(`/domains/verify/${id}/check`, { method: "POST" });
  }

  async getDomains(): Promise<ApiResponse<DomainVerification[]>> {
    const res = await this.request<any>("/domains");
    if (res.error) return { data: [] };
    const arr = Array.isArray(res.data) ? res.data : (res.data?.domains || []);
    return { data: arr };
  }

  async deleteDomain(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/domains/${id}`, { method: "DELETE" });
  }

  // --- Deep Scan ---

  async startDeepScan(domain: string): Promise<ApiResponse<DeepScanInfo>> {
    const res = await this.request<any>("/deep-scan", {
      method: "POST",
      body: JSON.stringify({ domain }),
    });
    return { data: res.data?.deep_scan || res.data, error: res.error };
  }

  async getDeepScan(id: string): Promise<ApiResponse<DeepScanInfo>> {
    const res = await this.request<any>(`/deep-scan/${id}`);
    return { data: res.data?.deep_scan || res.data, error: res.error };
  }

  async getDeepScans(): Promise<ApiResponse<DeepScanInfo[]>> {
    const res = await this.request<any>("/deep-scan");
    if (res.error) return { data: [] };
    const arr = Array.isArray(res.data) ? res.data : (res.data?.scans || res.data?.deep_scans || []);
    return { data: arr };
  }

  // --- Monitoring ---

  async createUptimeMonitor(domain: string, intervalSeconds: number = 300): Promise<ApiResponse<UptimeMonitorInfo>> {
    return this.request<UptimeMonitorInfo>("/monitors/uptime", {
      method: "POST",
      body: JSON.stringify({ domain, check_interval_seconds: intervalSeconds }),
    });
  }

  async getUptimeMonitors(): Promise<ApiResponse<UptimeMonitorInfo[]>> {
    const res = await this.request<any>("/monitors/uptime");
    if (res.error) return { data: [] };
    const arr = Array.isArray(res.data) ? res.data : (res.data?.monitors || []);
    return { data: arr };
  }

  async getUptimeMonitor(id: string): Promise<ApiResponse<{ monitor: UptimeMonitorInfo; checks: UptimeCheckInfo[] }>> {
    return this.request<{ monitor: UptimeMonitorInfo; checks: UptimeCheckInfo[] }>(`/monitors/uptime/${id}`);
  }

  async deleteUptimeMonitor(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/monitors/uptime/${id}`, { method: "DELETE" });
  }

  async createSslMonitor(domain: string, alertDays: number[] = [30, 14, 7]): Promise<ApiResponse<SslMonitorInfo>> {
    return this.request<SslMonitorInfo>("/monitors/ssl", {
      method: "POST",
      body: JSON.stringify({ domain, alert_days: alertDays }),
    });
  }

  async getSslMonitors(): Promise<ApiResponse<SslMonitorInfo[]>> {
    const res = await this.request<any>("/monitors/ssl");
    if (res.error) return { data: [] };
    const arr = Array.isArray(res.data) ? res.data : (res.data?.monitors || []);
    return { data: arr };
  }

  async triggerSpeedMeasurement(domain: string): Promise<ApiResponse<void>> {
    return this.request<void>("/monitors/speed", {
      method: "POST",
      body: JSON.stringify({ domain }),
    });
  }

  async getSpeedHistory(domain: string): Promise<ApiResponse<SpeedMeasurement[]>> {
    const res = await this.request<any>(`/monitors/speed/${encodeURIComponent(domain)}`);
    if (res.error) return { data: [] };
    const arr = Array.isArray(res.data) ? res.data : (res.data?.measurements || []);
    return { data: arr };
  }

  // --- Webhooks ---

  async getWebhooks(): Promise<ApiResponse<WebhookResponse[]>> {
    const res = await this.request<any>("/webhooks");
    if (res.error) return { data: [] };
    const arr = Array.isArray(res.data) ? res.data : (res.data?.webhooks || []);
    return { data: arr || [] };
  }

  async createWebhook(data: { domain: string; events: string[]; secret?: string }): Promise<ApiResponse<WebhookResponse>> {
    return this.request<WebhookResponse>("/webhooks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/webhooks/${id}`, { method: "DELETE" });
  }

  async toggleWebhook(id: string, active: boolean): Promise<ApiResponse<void>> {
    return this.request<void>(`/webhooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: active }),
    });
  }

  // --- Competitors (backend routes not yet implemented — client-side only) ---

  async getTrackedCompetitors(_domain: string): Promise<ApiResponse<CompetitorTrackingResponse[]>> {
    return { data: [] };
  }

  async trackCompetitor(_domain: string, _competitorUrl: string): Promise<ApiResponse<CompetitorTrackingResponse>> {
    return { error: "Competitor tracking is not yet available" };
  }

  async removeTrackedCompetitor(_domain: string, _id: string): Promise<ApiResponse<void>> {
    return { error: "Competitor tracking is not yet available" };
  }

  // --- Enrichment ---

  async enrichDomain(domain: string): Promise<ApiResponse<any>> {
    return this.request<any>("/enrich", {
      method: "POST",
      body: JSON.stringify({ domain }),
    });
  }

  // --- Health Score (backend routes not yet implemented — returns defaults) ---
  async getHealthScore(_domain: string): Promise<ApiResponse<HealthScoreResponse>> {
    return { data: { overall: 0, security: 0, performance: 0, seo: 0, availability: 0 } };
  }

  async getHealthScoreHistory(_domain: string): Promise<ApiResponse<HealthScoreHistoryResponse>> {
    return { data: { entries: [] } };
  }

  // --- Tech History (backend route not yet implemented — returns defaults) ---
  async getTechHistory(_domain: string): Promise<ApiResponse<TechChangeEventResponse[]>> {
    return { data: [] };
  }

  // --- Issues ---
  async getIssues(domain?: string): Promise<ApiResponse<IssueResponse[]>> {
    const query = domain ? `?domain=${encodeURIComponent(domain)}` : "";
    const res = await this.request<IssueResponse[]>(`/issues${query}`);
    if (res.error) return { data: [] };
    return { data: res.data || [] };
  }

  async updateIssueStatus(id: string, status: "open" | "resolved" | "ignored"): Promise<ApiResponse<void>> {
    return this.request<void>(`/issues/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // --- Alerts / Regression ---

  async getAlertPreferences(domain: string): Promise<ApiResponse<AlertPreferenceResponse>> {
    const res = await this.request<AlertPreferenceResponse>(`/domains/${encodeURIComponent(domain)}/alerts`);
    if (res.error) return { data: { domain, enabled: false, channels: { email: false, slack: false, webhook: false }, thresholds: {} } };
    return res;
  }

  async updateAlertPreferences(domain: string, prefs: any): Promise<ApiResponse<void>> {
    return this.request<void>(`/domains/${encodeURIComponent(domain)}/alerts`, {
      method: "PUT",
      body: JSON.stringify(prefs),
    });
  }

  async pinBaseline(domain: string, scanId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/domains/${encodeURIComponent(domain)}/baseline`, {
      method: "PUT",
      body: JSON.stringify({ scan_id: scanId }),
    });
  }

  async getRegressionAlerts(domain?: string): Promise<ApiResponse<RegressionAlertResponse[]>> {
    const query = domain ? `?domain=${encodeURIComponent(domain)}` : "";
    const res = await this.request<RegressionAlertResponse[]>(`/alerts/regressions${query}`);
    if (res.error) return { data: [] };
    return { data: res.data || [] };
  }

  // --- Attack Surface Audit ---
  async getAttackSurfaceAudits(): Promise<ApiResponse<AttackSurfaceAuditResponse[]>> {
    const res = await this.request<any>("/attack-surface");
    if (res.error) return { data: [] };
    const arr = Array.isArray(res.data) ? res.data : (res.data?.audits || []);
    return { data: arr };
  }

  async getAttackSurfaceAudit(id: string): Promise<ApiResponse<AttackSurfaceAuditResponse>> {
    const res = await this.request<any>(`/attack-surface/${id}`);
    if (res.error) return { error: res.error };
    return { data: res.data?.audit || res.data };
  }

  async startAttackSurfaceAudit(data: { domain: string; scope: Record<string, any> }): Promise<ApiResponse<AttackSurfaceAuditResponse>> {
    const res = await this.request<any>("/attack-surface", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.error) return { error: res.error };
    return { data: res.data?.audit || res.data };
  }

  async cancelAttackSurfaceAudit(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/attack-surface/${id}/cancel`, { method: "POST" });
  }

  async cancelDeepScan(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/deep-scan/${id}/cancel`, { method: "POST" });
  }

  async pairFullAudit(auditId: string, deepScanId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/attack-surface/${auditId}/pair`, {
      method: "POST",
      body: JSON.stringify({ deep_scan_id: deepScanId }),
    });
  }

  // --- Compliance ---
  async getComplianceReport(domain: string): Promise<ApiResponse<ComplianceReportResponse>> {
    const res = await this.request<ComplianceReportResponse>(`/domains/${encodeURIComponent(domain)}/compliance`);
    if (res.error) return { data: { domain, results: [], evaluated_at: new Date().toISOString() } };
    return res;
  }

  // --- Showcase (public, no auth) ---
  async getShowcaseScans(): Promise<ApiResponse<ShowcaseScan[]>> {
    return this.request<ShowcaseScan[]>("/showcase");
  }

  // --- Lead Generation ---
  async searchLeads(params: {
    q?: string;
    technology?: string;
    industry?: string;
    employees?: string;
    traffic_tier?: string;
    location?: string;
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<LeadSearchResponse>> {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.technology) query.set("technology", params.technology);
    if (params.industry) query.set("industry", params.industry);
    if (params.employees) query.set("employees", params.employees);
    if (params.traffic_tier) query.set("traffic_tier", params.traffic_tier);
    if (params.location) query.set("location", params.location);
    if (params.page) query.set("page", params.page.toString());
    if (params.per_page) query.set("per_page", params.per_page.toString());
    return this.request<LeadSearchResponse>(`/leads/search?${query.toString()}`);
  }

  async getLeadTechnologies(): Promise<ApiResponse<{ technologies: TechnologyListItem[] }>> {
    return this.request<{ technologies: TechnologyListItem[] }>("/leads/technologies");
  }

  async exportLeadsCsv(params: {
    q?: string;
    technology?: string;
    industry?: string;
    employees?: string;
    traffic_tier?: string;
    location?: string;
  }): Promise<ApiResponse<string>> {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.technology) query.set("technology", params.technology);
    if (params.industry) query.set("industry", params.industry);
    if (params.employees) query.set("employees", params.employees);
    if (params.traffic_tier) query.set("traffic_tier", params.traffic_tier);
    if (params.location) query.set("location", params.location);
    return this.request<string>(`/leads/export?${query.toString()}`);
  }

  async getDomainProfile(domain: string): Promise<ApiResponse<DomainProfileResponse>> {
    return this.request<DomainProfileResponse>(`/leads/domain/${encodeURIComponent(domain)}`);
  }

  async getTrafficData(domain: string): Promise<ApiResponse<TrafficDataResponse>> {
    return this.request<TrafficDataResponse>(`/traffic/${encodeURIComponent(domain)}`);
  }

  // --- AI Visibility ---
  async startAiVisibilityCheck(domain: string, brandName: string): Promise<ApiResponse<AiVisibilityCheck>> {
    return this.request<AiVisibilityCheck>("/ai-visibility", {
      method: "POST",
      body: JSON.stringify({ domain, brand_name: brandName }),
    });
  }

  async getAiVisibilityChecks(): Promise<ApiResponse<{ checks: AiVisibilityCheck[] }>> {
    return this.request<{ checks: AiVisibilityCheck[] }>("/ai-visibility");
  }

  async getAiVisibilityCheck(id: string): Promise<ApiResponse<{ check: AiVisibilityCheck; results: AiVisibilityResultItem[]; citations: any[]; share_of_voice: any[] }>> {
    return this.request<{ check: AiVisibilityCheck; results: AiVisibilityResultItem[]; citations: any[]; share_of_voice: any[] }>(`/ai-visibility/${id}`);
  }

  // --- GEO: Brand Mentions ---
  async scanMentions(domain: string, brandName: string): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/mentions/scan", {
      method: "POST",
      body: JSON.stringify({ domain, brand_name: brandName }),
    });
  }

  async getMentions(params?: { source?: string; sentiment?: string; limit?: number }): Promise<ApiResponse<{ mentions: any[] }>> {
    const search = new URLSearchParams();
    if (params?.source) search.set("source", params.source);
    if (params?.sentiment) search.set("sentiment", params.sentiment);
    if (params?.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    return this.request<{ mentions: any[] }>(`/mentions${qs ? `?${qs}` : ""}`);
  }

  async getMentionSummary(): Promise<ApiResponse<{ summary: any }>> {
    return this.request<{ summary: any }>("/mentions/summary");
  }

  // --- GEO: Thread Discovery ---
  async discoverThreads(domain: string, brandName: string, industry?: string, keywords?: string[]): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/threads/discover", {
      method: "POST",
      body: JSON.stringify({ domain, brand_name: brandName, industry, keywords }),
    });
  }

  async getThreads(params?: { platform?: string; status?: string; thread_type?: string; limit?: number }): Promise<ApiResponse<{ threads: any[] }>> {
    const search = new URLSearchParams();
    if (params?.platform) search.set("platform", params.platform);
    if (params?.status) search.set("status", params.status);
    if (params?.thread_type) search.set("thread_type", params.thread_type);
    if (params?.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    return this.request<{ threads: any[] }>(`/threads${qs ? `?${qs}` : ""}`);
  }

  async getThread(id: string): Promise<ApiResponse<{ thread: any }>> {
    return this.request<{ thread: any }>(`/threads/${id}`);
  }

  async draftReply(threadId: string, threadTitle: string, brandName: string, brandDescription: string): Promise<ApiResponse<{ draft: string }>> {
    return this.request<{ draft: string }>(`/threads/${threadId}/draft`, {
      method: "POST",
      body: JSON.stringify({ thread_title: threadTitle, brand_name: brandName, brand_description: brandDescription }),
    });
  }

  async updateThreadStatus(threadId: string, status: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return this.request<{ id: string; status: string }>(`/threads/${threadId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // --- Domain Scan (Unified Orchestrator) ---

  async startDomainScan(params: {
    domain: string;
    mode: "security" | "pentest" | "api";
    scope_contract_id?: string;
    spec_content?: string;
    rate_limit?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/domain-scan", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getActiveScopeContracts(): Promise<ApiResponse<{ contracts: any[] }>> {
    return this.request<{ contracts: any[] }>("/offensive-scan/scope-contracts");
  }

  async getDomainScan(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/domain-scan/${id}`);
  }

  async getDomainScans(): Promise<ApiResponse<any>> {
    const res = await this.request<any>("/domain-scan");
    if (res.error) return { data: { scans: [] } };
    return res;
  }

  async cancelDomainScan(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/domain-scan/${id}/cancel`, { method: "POST" });
  }
}

export const api = new ApiClient();
