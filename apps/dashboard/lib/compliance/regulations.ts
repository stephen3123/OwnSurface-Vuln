export interface ComplianceCheck {
  id: string;
  title: string;
  description: string;
  category: "consent" | "data_collection" | "disclosure" | "security" | "rights";
  evaluate: (scan: any) => "pass" | "fail" | "unknown";
}

export interface Regulation {
  id: string;
  name: string;
  full_name: string;
  region: string;
  description: string;
  effective_date: string;
  checks: ComplianceCheck[];
  penalty_info: string;
  url: string;
}

function hasPrivacy(scan: any): boolean {
  return !!scan?.privacy;
}

function hasSecurity(scan: any): boolean {
  return !!scan?.security;
}

function cookieBanner(scan: any): "pass" | "fail" | "unknown" {
  if (!hasPrivacy(scan)) return "unknown";
  return scan.privacy.has_cookie_banner ? "pass" : "fail";
}

function privacyPolicy(scan: any): "pass" | "fail" | "unknown" {
  if (!hasPrivacy(scan)) return "unknown";
  return scan.privacy.has_privacy_policy ? "pass" : "fail";
}

function termsOfService(scan: any): "pass" | "fail" | "unknown" {
  if (!hasPrivacy(scan)) return "unknown";
  return scan.privacy.has_terms ? "pass" : "fail";
}

function consentBeforeTracking(scan: any): "pass" | "fail" | "unknown" {
  if (!hasPrivacy(scan)) return "unknown";
  return scan.privacy.tracking_before_consent ? "fail" : "pass";
}

function securityHeaders(scan: any): "pass" | "fail" | "unknown" {
  if (!hasSecurity(scan)) return "unknown";
  const score = scan.security?.score ?? scan.security?.overall_score ?? 0;
  return score >= 50 ? "pass" : "fail";
}

function httpsEnforced(scan: any): "pass" | "fail" | "unknown" {
  if (!hasSecurity(scan)) return "unknown";
  const ssl = scan.security?.ssl;
  if (!ssl) return "unknown";
  return ssl.valid ? "pass" : "fail";
}

export const regulations: Regulation[] = [
  {
    id: "gdpr",
    name: "GDPR",
    full_name: "General Data Protection Regulation",
    region: "EU",
    description: "EU regulation on data protection and privacy for individuals within the European Union and European Economic Area.",
    effective_date: "2018-05-25",
    penalty_info: "Up to 4% of annual global turnover or EUR 20 million, whichever is higher.",
    url: "https://gdpr.eu/",
    checks: [
      { id: "gdpr-consent", title: "Cookie Consent Banner", description: "Must obtain explicit consent before placing non-essential cookies.", category: "consent", evaluate: cookieBanner },
      { id: "gdpr-pre-consent", title: "No Tracking Before Consent", description: "Must not load tracking scripts before user gives consent.", category: "consent", evaluate: consentBeforeTracking },
      { id: "gdpr-privacy", title: "Privacy Policy", description: "Must have a clear and accessible privacy policy.", category: "disclosure", evaluate: privacyPolicy },
      { id: "gdpr-terms", title: "Data Processing Disclosure", description: "Must disclose how personal data is processed.", category: "disclosure", evaluate: termsOfService },
      { id: "gdpr-security", title: "Appropriate Security Measures", description: "Must implement appropriate technical and organizational security measures.", category: "security", evaluate: securityHeaders },
    ],
  },
  {
    id: "ccpa",
    name: "CCPA/CPRA",
    full_name: "California Consumer Privacy Act / California Privacy Rights Act",
    region: "US-CA",
    description: "California state law granting consumers rights over personal information collected by businesses.",
    effective_date: "2020-01-01",
    penalty_info: "Up to $7,500 per intentional violation, $2,500 per unintentional violation.",
    url: "https://oag.ca.gov/privacy/ccpa",
    checks: [
      { id: "ccpa-privacy", title: "Privacy Policy", description: "Must have a comprehensive privacy policy disclosing data practices.", category: "disclosure", evaluate: privacyPolicy },
      { id: "ccpa-optout", title: "Do Not Sell Link", description: "Must provide a 'Do Not Sell My Personal Information' link.", category: "rights", evaluate: (scan) => hasPrivacy(scan) ? (scan.privacy.has_privacy_policy ? "pass" : "fail") : "unknown" },
      { id: "ccpa-consent", title: "Opt-Out Mechanism", description: "Must provide mechanism for consumers to opt out of data sale.", category: "consent", evaluate: cookieBanner },
    ],
  },
  {
    id: "lgpd",
    name: "LGPD",
    full_name: "Lei Geral de Proteção de Dados",
    region: "BR",
    description: "Brazil's general data protection law, modeled after GDPR.",
    effective_date: "2020-09-18",
    penalty_info: "Up to 2% of revenue in Brazil, capped at BRL 50 million per infraction.",
    url: "https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd",
    checks: [
      { id: "lgpd-consent", title: "Cookie Consent", description: "Must obtain consent for data processing.", category: "consent", evaluate: cookieBanner },
      { id: "lgpd-privacy", title: "Privacy Notice", description: "Must provide clear privacy notice to data subjects.", category: "disclosure", evaluate: privacyPolicy },
      { id: "lgpd-tracking", title: "Consent Before Tracking", description: "Must not track users before obtaining consent.", category: "consent", evaluate: consentBeforeTracking },
    ],
  },
  {
    id: "popia",
    name: "POPIA",
    full_name: "Protection of Personal Information Act",
    region: "ZA",
    description: "South Africa's data protection legislation regulating processing of personal information.",
    effective_date: "2021-07-01",
    penalty_info: "Up to ZAR 10 million fine or imprisonment up to 10 years.",
    url: "https://popia.co.za/",
    checks: [
      { id: "popia-privacy", title: "Privacy Notice", description: "Must have a privacy notice informing data subjects of processing.", category: "disclosure", evaluate: privacyPolicy },
      { id: "popia-consent", title: "Consent for Processing", description: "Must obtain consent for data processing.", category: "consent", evaluate: cookieBanner },
      { id: "popia-security", title: "Data Protection Measures", description: "Must implement appropriate security safeguards.", category: "security", evaluate: securityHeaders },
    ],
  },
  {
    id: "pipeda",
    name: "PIPEDA",
    full_name: "Personal Information Protection and Electronic Documents Act",
    region: "CA",
    description: "Canadian federal privacy law governing how private-sector organizations collect and use personal information.",
    effective_date: "2000-04-13",
    penalty_info: "Up to CAD 100,000 per violation.",
    url: "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/",
    checks: [
      { id: "pipeda-privacy", title: "Privacy Policy", description: "Must have a clear privacy policy.", category: "disclosure", evaluate: privacyPolicy },
      { id: "pipeda-consent", title: "Meaningful Consent", description: "Must obtain meaningful consent for data collection.", category: "consent", evaluate: cookieBanner },
      { id: "pipeda-transparency", title: "Transparency", description: "Must be transparent about data practices.", category: "disclosure", evaluate: termsOfService },
    ],
  },
  {
    id: "pdpa-sg",
    name: "PDPA",
    full_name: "Personal Data Protection Act (Singapore)",
    region: "SG",
    description: "Singapore's data protection law governing collection, use, and disclosure of personal data.",
    effective_date: "2014-07-02",
    penalty_info: "Up to SGD 1 million or 10% of annual turnover.",
    url: "https://www.pdpc.gov.sg/overview-of-pdpa/the-legislation/personal-data-protection-act",
    checks: [
      { id: "pdpa-sg-consent", title: "Consent Requirement", description: "Must obtain consent before collecting personal data.", category: "consent", evaluate: cookieBanner },
      { id: "pdpa-sg-purpose", title: "Purpose Limitation", description: "Must only collect data for stated purposes.", category: "data_collection", evaluate: privacyPolicy },
      { id: "pdpa-sg-security", title: "Data Protection", description: "Must protect personal data with reasonable security.", category: "security", evaluate: securityHeaders },
    ],
  },
  {
    id: "pdpa-th",
    name: "PDPA",
    full_name: "Personal Data Protection Act (Thailand)",
    region: "TH",
    description: "Thailand's comprehensive data protection law.",
    effective_date: "2022-06-01",
    penalty_info: "Up to THB 5 million criminal fine and/or imprisonment.",
    url: "https://www.mdes.go.th/",
    checks: [
      { id: "pdpa-th-consent", title: "Cookie Consent", description: "Must obtain consent for cookies and tracking.", category: "consent", evaluate: cookieBanner },
      { id: "pdpa-th-privacy", title: "Privacy Notice", description: "Must provide privacy notice before data collection.", category: "disclosure", evaluate: privacyPolicy },
    ],
  },
  {
    id: "dpa-uk",
    name: "DPA 2018",
    full_name: "Data Protection Act 2018",
    region: "GB",
    description: "UK's implementation of data protection standards post-Brexit, supplementing UK GDPR.",
    effective_date: "2018-05-25",
    penalty_info: "Up to GBP 17.5 million or 4% of annual global turnover.",
    url: "https://www.legislation.gov.uk/ukpga/2018/12/contents/enacted",
    checks: [
      { id: "dpa-uk-consent", title: "Cookie Consent Banner", description: "Must obtain consent before placing non-essential cookies.", category: "consent", evaluate: cookieBanner },
      { id: "dpa-uk-tracking", title: "No Pre-Consent Tracking", description: "Must not track before consent is given.", category: "consent", evaluate: consentBeforeTracking },
      { id: "dpa-uk-privacy", title: "Privacy Policy", description: "Must have a GDPR-compliant privacy policy.", category: "disclosure", evaluate: privacyPolicy },
      { id: "dpa-uk-security", title: "Security Measures", description: "Must implement appropriate technical security.", category: "security", evaluate: securityHeaders },
    ],
  },
  {
    id: "apps-au",
    name: "APPs",
    full_name: "Australian Privacy Principles",
    region: "AU",
    description: "Australia's privacy principles under the Privacy Act 1988 governing handling of personal information.",
    effective_date: "2014-03-12",
    penalty_info: "Up to AUD 50 million, 3x benefit obtained, or 30% of turnover.",
    url: "https://www.oaic.gov.au/privacy/australian-privacy-principles",
    checks: [
      { id: "apps-au-privacy", title: "Privacy Policy", description: "Must have an up-to-date privacy policy.", category: "disclosure", evaluate: privacyPolicy },
      { id: "apps-au-collection", title: "Data Handling Disclosure", description: "Must disclose how data is collected and handled.", category: "data_collection", evaluate: termsOfService },
      { id: "apps-au-security", title: "Data Security", description: "Must take reasonable steps to protect personal information.", category: "security", evaluate: httpsEnforced },
    ],
  },
  {
    id: "appi",
    name: "APPI",
    full_name: "Act on Protection of Personal Information",
    region: "JP",
    description: "Japan's primary data protection legislation governing use of personal information.",
    effective_date: "2022-04-01",
    penalty_info: "Up to JPY 100 million for corporations.",
    url: "https://www.ppc.go.jp/en/",
    checks: [
      { id: "appi-privacy", title: "Privacy Notice", description: "Must provide notice of utilization purpose.", category: "disclosure", evaluate: privacyPolicy },
      { id: "appi-consent", title: "Consent for Sensitive Data", description: "Must obtain consent for handling sensitive personal information.", category: "consent", evaluate: cookieBanner },
    ],
  },
  {
    id: "pipl",
    name: "PIPL",
    full_name: "Personal Information Protection Law",
    region: "CN",
    description: "China's comprehensive personal information protection law.",
    effective_date: "2021-11-01",
    penalty_info: "Up to CNY 50 million or 5% of previous year's revenue.",
    url: "http://www.npc.gov.cn/",
    checks: [
      { id: "pipl-consent", title: "Informed Consent", description: "Must obtain informed consent for data processing.", category: "consent", evaluate: cookieBanner },
      { id: "pipl-privacy", title: "Privacy Notice", description: "Must provide clear notice about data handling.", category: "disclosure", evaluate: privacyPolicy },
      { id: "pipl-security", title: "Data Security", description: "Must implement data security measures.", category: "security", evaluate: securityHeaders },
    ],
  },
  {
    id: "dpdpa",
    name: "DPDPA",
    full_name: "Digital Personal Data Protection Act",
    region: "IN",
    description: "India's data protection law governing processing of digital personal data.",
    effective_date: "2023-08-11",
    penalty_info: "Up to INR 250 crore (approx. USD 30 million).",
    url: "https://www.meity.gov.in/",
    checks: [
      { id: "dpdpa-consent", title: "Consent for Processing", description: "Must obtain consent before processing personal data.", category: "consent", evaluate: cookieBanner },
      { id: "dpdpa-privacy", title: "Privacy Notice", description: "Must provide notice about data processing.", category: "disclosure", evaluate: privacyPolicy },
    ],
  },
  {
    id: "kvkk",
    name: "KVKK",
    full_name: "Kişisel Verilerin Korunması Kanunu",
    region: "TR",
    description: "Turkey's personal data protection law.",
    effective_date: "2016-04-07",
    penalty_info: "Up to TRY 1,966,862 per violation.",
    url: "https://www.kvkk.gov.tr/",
    checks: [
      { id: "kvkk-privacy", title: "Privacy Notice", description: "Must inform data subjects about processing.", category: "disclosure", evaluate: privacyPolicy },
      { id: "kvkk-consent", title: "Explicit Consent", description: "Must obtain explicit consent for processing.", category: "consent", evaluate: cookieBanner },
    ],
  },
  {
    id: "nfadp",
    name: "nFADP",
    full_name: "New Federal Act on Data Protection",
    region: "CH",
    description: "Switzerland's revised data protection act aligned with GDPR standards.",
    effective_date: "2023-09-01",
    penalty_info: "Up to CHF 250,000 for individuals; corporate liability possible.",
    url: "https://www.fedlex.admin.ch/eli/cc/2022/491/en",
    checks: [
      { id: "nfadp-privacy", title: "Privacy Notice", description: "Must provide detailed privacy notice.", category: "disclosure", evaluate: privacyPolicy },
      { id: "nfadp-consent", title: "Consent for Profiling", description: "Must obtain consent for high-risk profiling.", category: "consent", evaluate: cookieBanner },
      { id: "nfadp-security", title: "Data Security", description: "Must ensure appropriate data security.", category: "security", evaluate: securityHeaders },
    ],
  },
  {
    id: "pipa",
    name: "PIPA",
    full_name: "Personal Information Protection Act",
    region: "KR",
    description: "South Korea's comprehensive data protection legislation.",
    effective_date: "2011-09-30",
    penalty_info: "Up to KRW 500 million or 3% of related revenue.",
    url: "https://www.pipc.go.kr/eng/",
    checks: [
      { id: "pipa-consent", title: "Consent for Collection", description: "Must obtain consent before collecting personal information.", category: "consent", evaluate: cookieBanner },
      { id: "pipa-privacy", title: "Privacy Policy", description: "Must publicly disclose privacy policy.", category: "disclosure", evaluate: privacyPolicy },
      { id: "pipa-security", title: "Technical Safeguards", description: "Must implement technical safeguards for personal data.", category: "security", evaluate: httpsEnforced },
    ],
  },
];

export const countryRegulations: Record<string, string[]> = {
  // EU / EEA — GDPR
  AT: ["gdpr"], BE: ["gdpr"], BG: ["gdpr"], HR: ["gdpr"], CY: ["gdpr"],
  CZ: ["gdpr"], DK: ["gdpr"], EE: ["gdpr"], FI: ["gdpr"], FR: ["gdpr"],
  DE: ["gdpr"], GR: ["gdpr"], HU: ["gdpr"], IE: ["gdpr"], IT: ["gdpr"],
  LV: ["gdpr"], LT: ["gdpr"], LU: ["gdpr"], MT: ["gdpr"], NL: ["gdpr"],
  PL: ["gdpr"], PT: ["gdpr"], RO: ["gdpr"], SK: ["gdpr"], SI: ["gdpr"],
  ES: ["gdpr"], SE: ["gdpr"],
  // EEA
  IS: ["gdpr"], LI: ["gdpr"], NO: ["gdpr"],

  // UK
  GB: ["dpa-uk"],

  // Americas
  US: ["ccpa"],
  CA: ["pipeda"],
  BR: ["lgpd"],

  // Africa
  ZA: ["popia"],

  // Asia-Pacific
  SG: ["pdpa-sg"],
  TH: ["pdpa-th"],
  AU: ["apps-au"],
  JP: ["appi"],
  CN: ["pipl"],
  IN: ["dpdpa"],
  KR: ["pipa"],

  // Middle East / Europe
  TR: ["kvkk"],
  CH: ["nfadp"],
};
