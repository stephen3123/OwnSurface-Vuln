"use client";

import type { ScanResult } from "@/lib/api-client";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Escape a value for CSV (handles commas, quotes, newlines) */
function esc(v: string | number | boolean | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(esc).join(",");
}

function download(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Full scan CSV — one sheet with multiple sections                  */
/* ------------------------------------------------------------------ */

export function exportScanCsv(scan: ScanResult) {
  const host = hostname(scan.url);
  const lines: string[] = [];

  // Overview
  lines.push("# OwnSurface Scan Report");
  lines.push(row(["URL", scan.url]));
  lines.push(row(["Scanned At", scan.scanned_at]));
  lines.push(row(["Security Score", scan.security.score]));
  lines.push(row(["SEO Score", scan.seo.score]));
  lines.push(row(["Technologies", scan.technologies.length]));
  lines.push(row(["Competitors", scan.competitors.length]));
  if (scan.company) {
    lines.push(row(["Company", scan.company.name]));
    lines.push(row(["Industry", scan.company.industry]));
  }
  lines.push("");

  // Technologies
  lines.push("# Technology Stack");
  lines.push(row(["Name", "Category", "Version", "Confidence"]));
  scan.technologies.forEach((t) => {
    lines.push(row([t.name, t.category, t.version || "", `${t.confidence}%`]));
  });
  lines.push("");

  // Security headers
  lines.push("# Security Headers");
  lines.push(row(["Header", "Present", "Value"]));
  scan.security.headers.forEach((h) => {
    lines.push(row([h.name, h.present ? "Yes" : "No", h.value || ""]));
  });
  lines.push("");

  // Security issues
  if (scan.security.issues.length > 0) {
    lines.push("# Security Issues");
    lines.push(row(["Severity", "Title", "Description"]));
    scan.security.issues.forEach((i) => {
      lines.push(row([i.severity, i.title, i.description]));
    });
    lines.push("");
  }

  // SEO
  lines.push("# SEO Analysis");
  lines.push(row(["Score", scan.seo.score]));
  lines.push(row(["Title", scan.seo.title]));
  lines.push(row(["Description", scan.seo.description]));
  lines.push(row(["Sitemap", scan.seo.has_sitemap ? "Yes" : "No"]));
  lines.push(row(["robots.txt", scan.seo.has_robots_txt ? "Yes" : "No"]));
  lines.push(row(["Structured Data", scan.seo.has_structured_data ? "Yes" : "No"]));
  lines.push(row(["Canonical", scan.seo.has_canonical ? "Yes" : "No"]));
  if (scan.seo.meta_issues.length > 0) {
    lines.push(row(["Meta Issues", scan.seo.meta_issues.join("; ")]));
  }
  lines.push("");

  // Social links
  if (scan.social_links.length > 0) {
    lines.push("# Social Links");
    lines.push(row(["Platform", "URL", "Followers"]));
    scan.social_links.forEach((s) => {
      lines.push(row([s.platform, s.url, s.followers ?? ""]));
    });
    lines.push("");
  }

  // Business signals
  if (scan.business_signals.length > 0) {
    lines.push("# Business Signals");
    lines.push(row(["Type", "Label", "Detail", "Confidence"]));
    scan.business_signals.forEach((s) => {
      lines.push(row([s.type, s.label, s.detail, `${s.confidence}%`]));
    });
    lines.push("");
  }

  // Traffic
  if (scan.traffic) {
    lines.push("# Traffic");
    lines.push(row(["Tier", scan.traffic.traffic_tier]));
    lines.push(row(["Tranco Rank", scan.traffic.tranco_rank ?? ""]));
    lines.push(row(["Est. Monthly Visits", scan.traffic.estimated_monthly_visits ?? ""]));
    lines.push("");
  }

  // Competitors
  if (scan.competitors.length > 0) {
    lines.push("# Competitors");
    lines.push(row(["Name", "URL", "Similarity", "Shared Tech"]));
    scan.competitors.forEach((c) => {
      lines.push(row([c.name, c.url, `${Math.round(c.similarity_score * 100)}%`, c.shared_tech.join("; ")]));
    });
    lines.push("");
  }

  // Cost estimate
  if (scan.cost_estimate) {
    lines.push("# Cost Estimate");
    lines.push(row(["Total Min", `$${scan.cost_estimate.total_min}`]));
    lines.push(row(["Total Max", `$${scan.cost_estimate.total_max}`]));
    lines.push(row(["Category", "Min", "Max", "Detail"]));
    scan.cost_estimate.breakdown.forEach((b) => {
      lines.push(row([b.category, `$${b.min}`, `$${b.max}`, b.detail]));
    });
    lines.push("");
  }

  // Security findings
  if (scan.security_findings && scan.security_findings.length > 0) {
    lines.push("# Security Findings");
    lines.push(row(["Severity", "Title", "Impact", "Effort", "Description"]));
    scan.security_findings.forEach((f) => {
      lines.push(row([f.severity, f.title, f.impact, f.effort, f.description]));
    });
    lines.push("");
  }

  // Email patterns
  if (scan.email_patterns) {
    lines.push("# Email Patterns");
    lines.push(row(["Pattern", scan.email_patterns.pattern ?? ""]));
    lines.push(row(["Confidence", `${scan.email_patterns.confidence}%`]));
    if (scan.email_patterns.found_emails.length > 0) {
      lines.push(row(["Emails", scan.email_patterns.found_emails.join("; ")]));
    }
    lines.push("");
  }

  // Carbon
  if (scan.carbon) {
    lines.push("# Carbon Footprint");
    lines.push(row(["CO2 Per Visit (g)", scan.carbon.co2_grams_per_visit]));
    lines.push(row(["Grade", scan.carbon.sustainability_grade]));
    lines.push(row(["Green Hosted", scan.carbon.is_green_hosted ? "Yes" : "No"]));
    lines.push(row(["Page Weight (bytes)", scan.carbon.page_weight_bytes]));
    lines.push(row(["Cleaner Than %", scan.carbon.cleaner_than_percent]));
    lines.push(row(["Annual CO2 (kg)", scan.carbon.annual_co2_kg]));
    lines.push("");
  }

  // Supply chain
  if (scan.supply_chain && scan.supply_chain.external_domains.length > 0) {
    lines.push("# Supply Chain");
    lines.push(row(["Domain", "Type", "Risk Level", "CDN", "References"]));
    scan.supply_chain.external_domains.forEach((d) => {
      lines.push(row([d.domain, d.type, d.risk_level, d.is_cdn ? "Yes" : "No", d.count]));
    });
    lines.push("");
  }

  download(lines.join("\n"), `${host}-ownsurface-report.csv`);
}
