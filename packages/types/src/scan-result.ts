export interface Technology {
  name: string;
  category: string;
  version?: string;
  confidence: number;
  website?: string;
  icon?: string;
}

export interface SSLInfo {
  valid: boolean;
  issuer: string;
  expires_at: string;
  protocol: string;
  days_until_expiry: number;
}

export interface HeaderCheck {
  name: string;
  present: boolean;
  value?: string;
  recommendation?: string;
}

export interface SecurityScore {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  ssl: SSLInfo;
  headers: HeaderCheck[];
  issues: string[];
  https_redirect: boolean;
}

export interface CompanyInfo {
  name?: string;
  description?: string;
  logo?: string;
  industry?: string;
  founded?: string;
  location?: string;
  employees_range?: string;
  type?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  handle?: string;
  followers?: number;
}

export interface SeoData {
  domain_age_days?: number;
  meta_title?: string;
  meta_title_length?: number;
  meta_description?: string;
  meta_description_length?: number;
  has_sitemap: boolean;
  has_robots: boolean;
  heading_structure: { h1: number; h2: number; h3: number };
  has_structured_data: boolean;
  canonical_url?: string;
  score: number;
}

export interface BusinessSignals {
  has_pricing: boolean;
  has_careers: boolean;
  ad_pixels: string[];
  chat_widgets: string[];
  payment_processors: string[];
  is_hiring: boolean;
  is_monetized: boolean;
  email_providers: string[];
}

export interface TrafficData {
  tranco_rank?: number;
  traffic_tier: "Very High" | "High" | "Medium" | "Low" | "Very Low";
  estimated_monthly_visits?: string;
}

export interface Competitor {
  url: string;
  name?: string;
  similarity_score: number;
  shared_technologies: string[];
}

export interface CostItem {
  category: string;
  service: string;
  min_monthly: number;
  max_monthly: number;
}

export interface CostEstimate {
  total_monthly_min: number;
  total_monthly_max: number;
  breakdown: CostItem[];
  currency: string;
}

export interface CloneInfo {
  is_template: boolean;
  template_name?: string;
  structural_hash: string;
}

export interface DnsInfo {
  a_records: string[];
  aaaa_records: string[];
  mx_records: string[];
  ns_records: string[];
  txt_records: string[];
  hosting_provider?: string;
}

export interface SecurityFix {
  summary: string;
  nginx: string | null;
  apache: string | null;
  cloudflare: string | null;
  meta_tag: string | null;
  vercel_json: string | null;
  netlify_toml: string | null;
}

export interface SecurityFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  impact: string;
  fix: SecurityFix;
  effort: "5min" | "15min" | "30min" | "1hr" | "complex";
  priority: number;
}

export interface CarbonScore {
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

export interface EmailPatterns {
  found_emails: string[];
  pattern: string | null;
  confidence: number;
  team_page_url: string | null;
  contact_page_url: string | null;
}

export interface OffensiveFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  title: string;
  description: string;
  evidence: string;
  remediation: string;
  cvss_score?: number;
  cwe_id?: string;
  affected_asset: string;
  tool_used: string;
  request_payload?: string;
  response_snippet?: string;
  proof_of_concept?: string;
}

export interface SecretScanResult {
  secrets: {
    type: string;
    value_preview: string;
    source_url: string;
    line?: number;
    severity: "critical" | "high" | "medium" | "low";
  }[];
  total_found: number;
  sources_checked: number;
}

export interface WafResult {
  detected: boolean;
  provider: string | null;
  confidence: number;
  evidence: string[];
}

export interface GraphqlDetectResult {
  detected: boolean;
  endpoint: string | null;
  introspection_enabled: boolean;
  playground_enabled: boolean;
  engine?: string;
}

export interface MobileFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  title: string;
  description: string;
  evidence: string;
  remediation: string;
  cvss_score?: number;
  cwe_id?: string;
  affected_asset: string;
  tool_used: string;
  request_payload?: string;
  response_snippet?: string;
  proof_of_concept?: string;
  platform: "android" | "ios" | "cross-platform";
  owasp_mobile_id?: string;
  component?: string;
  appstore_blocker?: boolean;
}

export interface AppMetadata {
  app_name?: string;
  package_name?: string;
  version_name?: string;
  version_code?: string;
  min_sdk?: number;
  target_sdk?: number;
  permissions: string[];
  framework?: string;
  platform: "android" | "ios";
}

export interface MobileScanResult {
  id: string;
  user_id: string;
  app_name?: string;
  package_name?: string;
  platform: "android" | "ios";
  scan_mode: "appstore_check" | "security_audit" | "offensive_pentest";
  file_name: string;
  file_size_bytes: number;
  file_hash_sha256: string;
  status: string;
  findings: MobileFinding[];
  logs: { timestamp: string; level: string; phase: string; message: string }[];
  severity_critical: number;
  severity_high: number;
  severity_medium: number;
  severity_low: number;
  severity_info: number;
  tools_used: string[];
  app_metadata?: AppMetadata;
  api_endpoints_found: string[];
  framework_detected?: string;
  offensive_scan_id?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface ScanResult {
  id?: string;
  url: string;
  url_hash: string;
  tech_stack: Technology[];
  security: SecurityScore;
  company: CompanyInfo;
  social_links: SocialLink[];
  seo: SeoData;
  business_signals: BusinessSignals;
  traffic: TrafficData;
  competitors: Competitor[];
  cost_estimate: CostEstimate;
  clone_info?: CloneInfo;
  dns?: DnsInfo;
  ai_summary: string;
  scanned_at: string;
  scan_duration_ms?: number;
  carbon?: CarbonScore;
  security_findings?: SecurityFinding[];
  email_patterns?: EmailPatterns;
  offensive_findings?: OffensiveFinding[];
  mobile_findings?: MobileFinding[];
  secrets_passive?: SecretScanResult;
  waf_info?: WafResult;
  graphql_info?: GraphqlDetectResult;
}
