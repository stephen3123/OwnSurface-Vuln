import type { ScanResult } from "@/lib/api-client";

export interface Issue {
  id: string;
  domain: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: "security" | "performance" | "seo" | "privacy" | "availability";
  title: string;
  description: string;
  source: string;
  detected_at: string;
  status: "open" | "resolved" | "ignored";
  auto_fixable: boolean;
}

function hashId(parts: string[]): string {
  const str = parts.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).padStart(8, "0");
}

function makeIssue(
  domain: string,
  severity: Issue["severity"],
  category: Issue["category"],
  title: string,
  description: string,
  source: string,
  detected_at: string,
  auto_fixable = false,
): Issue {
  return {
    id: hashId([category, source, title]),
    domain,
    severity,
    category,
    title,
    description,
    source,
    detected_at,
    status: "open",
    auto_fixable,
  };
}

const CRITICAL_HEADERS = ["content-security-policy", "x-frame-options"];
const HIGH_HEADERS = ["strict-transport-security"];

export function generateIssues(scan: ScanResult, domain: string): Issue[] {
  const issues: Issue[] = [];
  const at = scan.scanned_at;

  // Security issues
  for (const issue of scan.security?.issues ?? []) {
    issues.push(
      makeIssue(domain, issue.severity, "security", issue.title, issue.description, "security_issues", at),
    );
  }

  // Missing security headers
  for (const header of scan.security?.headers ?? []) {
    if (header.present) continue;
    const name = header.name.toLowerCase();
    let severity: Issue["severity"] = "medium";
    if (CRITICAL_HEADERS.includes(name)) severity = "critical";
    else if (HIGH_HEADERS.includes(name)) severity = "high";
    issues.push(
      makeIssue(
        domain,
        severity,
        "security",
        `Missing ${header.name} header`,
        `The ${header.name} security header is not set. This header helps protect against common web attacks.`,
        "security_headers",
        at,
        true,
      ),
    );
  }

  // SEO checks
  if (!scan.seo?.has_sitemap) {
    issues.push(
      makeIssue(domain, "medium", "seo", "Missing sitemap.xml", "No sitemap.xml was found. A sitemap helps search engines discover and index your pages.", "seo_meta", at),
    );
  }
  if (!scan.seo?.has_robots_txt) {
    issues.push(
      makeIssue(domain, "medium", "seo", "Missing robots.txt", "No robots.txt was found. This file controls how search engines crawl your site.", "seo_meta", at),
    );
  }
  if (!scan.seo?.has_canonical) {
    issues.push(
      makeIssue(domain, "low", "seo", "Missing canonical URL", "No canonical URL tag was found. This can lead to duplicate content issues.", "seo_meta", at),
    );
  }
  if (!scan.seo?.has_structured_data) {
    issues.push(
      makeIssue(domain, "low", "seo", "No structured data", "No structured data (JSON-LD / Schema.org) was detected. Structured data helps search engines understand your content.", "seo_meta", at),
    );
  }
  if (!scan.seo?.title || scan.seo.title.trim().length === 0) {
    issues.push(
      makeIssue(domain, "high", "seo", "Empty page title", "The page title is missing or empty. Page titles are essential for SEO and user experience.", "seo_meta", at),
    );
  }
  if (!scan.seo?.description || scan.seo.description.trim().length === 0) {
    issues.push(
      makeIssue(domain, "medium", "seo", "Empty meta description", "The meta description is missing or empty. Meta descriptions appear in search results.", "seo_meta", at),
    );
  }

  // Vulnerability: sensitive files
  if (scan.vulnerability?.sensitive_files?.exposed_files) {
    for (const file of scan.vulnerability.sensitive_files.exposed_files) {
      issues.push(
        makeIssue(
          domain,
          file.risk_level === "critical" ? "critical" : file.risk_level === "high" ? "high" : "medium",
          "security",
          `Exposed sensitive file: ${file.path}`,
          `The file ${file.path} is publicly accessible (HTTP ${file.status}, ${file.size} bytes). This may leak sensitive information.`,
          "sensitive_files",
          at,
        ),
      );
    }
  }

  // Vulnerability: CVEs
  if (scan.vulnerability?.cve_matches?.cves) {
    for (const cve of scan.vulnerability.cve_matches.cves) {
      issues.push(
        makeIssue(
          domain,
          cve.severity === "critical" ? "critical" : cve.severity === "high" ? "high" : cve.severity === "medium" ? "medium" : "low",
          "security",
          `${cve.id}: ${cve.technology}`,
          `${cve.description} (CVSS ${cve.score}, affects ${cve.affected_versions})`,
          "cve",
          at,
        ),
      );
    }
  }

  // Vulnerability: cookie audit
  if (scan.vulnerability?.cookie_audit?.issues) {
    for (const issue of scan.vulnerability.cookie_audit.issues) {
      issues.push(
        makeIssue(domain, "medium", "security", `Cookie issue: ${issue}`, issue, "cookies", at, true),
      );
    }
  }

  // Vulnerability: CORS
  if (scan.vulnerability?.cors_check?.misconfigured) {
    const cors = scan.vulnerability.cors_check;
    const details = [
      cors.allows_any_origin && "allows any origin",
      cors.allows_null && "allows null origin",
      cors.allows_credentials_with_wildcard && "allows credentials with wildcard",
    ].filter(Boolean).join(", ");
    issues.push(
      makeIssue(
        domain,
        "high",
        "security",
        "CORS misconfiguration",
        `Cross-Origin Resource Sharing is misconfigured: ${details || "see details"}.`,
        "cors",
        at,
        true,
      ),
    );
  }

  // Vulnerability: DNS security
  if (scan.vulnerability?.dns_security) {
    const dns = scan.vulnerability.dns_security;
    if (!dns.spf.found) {
      issues.push(
        makeIssue(domain, "high", "security", "Missing SPF record", "No SPF (Sender Policy Framework) DNS record found. This allows attackers to spoof emails from your domain.", "dns", at),
      );
    }
    if (!dns.dmarc.found) {
      issues.push(
        makeIssue(domain, "high", "security", "Missing DMARC record", "No DMARC DNS record found. DMARC helps prevent email spoofing and phishing.", "dns", at),
      );
    }
    if (!dns.dnssec.enabled) {
      issues.push(
        makeIssue(domain, "medium", "security", "DNSSEC not enabled", "DNSSEC is not enabled. DNSSEC protects against DNS cache poisoning attacks.", "dns", at),
      );
    }
    for (const issue of dns.issues ?? []) {
      issues.push(
        makeIssue(domain, "medium", "security", `DNS: ${issue}`, issue, "dns", at),
      );
    }
  }

  // Privacy
  if (scan.privacy) {
    if (scan.privacy.tracking_before_consent) {
      issues.push(
        makeIssue(
          domain,
          "high",
          "privacy",
          "Tracking before consent",
          `Tracking scripts load before user consent: ${(scan.privacy.tracking_scripts ?? []).join(", ") || "unknown scripts"}. This may violate GDPR/ePrivacy regulations.`,
          "privacy",
          at,
        ),
      );
    }
    if (!scan.privacy.has_privacy_policy) {
      issues.push(
        makeIssue(domain, "high", "privacy", "Missing privacy policy", "No privacy policy page was detected. A privacy policy is legally required in most jurisdictions.", "privacy", at),
      );
    }
  }

  return issues;
}
