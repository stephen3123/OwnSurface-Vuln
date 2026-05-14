import type { ScanResult, SpeedMeasurement } from "@/lib/api-client";

export interface HealthScore {
  overall: number;
  security: number;
  performance: number;
  seo: number;
  availability: number;
  issues: HealthIssue[];
}

export interface HealthIssue {
  category: "security" | "performance" | "seo" | "availability";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  impact: number;
}

export interface HealthScoreHistoryEntry {
  date: string;
  overall: number;
  security: number;
  performance: number;
  seo: number;
  availability: number;
}

const WEIGHTS = { security: 0.35, performance: 0.3, seo: 0.2, availability: 0.15 };

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function computeSecurityScore(scan: ScanResult): { score: number; issues: HealthIssue[] } {
  const issues: HealthIssue[] = [];
  let score = scan.security?.score ?? 0;

  const missingHeaders = (scan.security.headers || []).filter((h) => !h.present);
  if (missingHeaders.length > 3) {
    const penalty = Math.min(15, missingHeaders.length * 3);
    score -= penalty;
    issues.push({ category: "security", severity: "medium", title: `${missingHeaders.length} security headers missing`, impact: penalty });
  }

  const criticalIssues = (scan.security.issues || []).filter((i) => i.severity === "critical");
  const highIssues = (scan.security.issues || []).filter((i) => i.severity === "high");

  if (criticalIssues.length > 0) {
    const penalty = Math.min(25, criticalIssues.length * 10);
    score -= penalty;
    issues.push({ category: "security", severity: "critical", title: `${criticalIssues.length} critical security issue${criticalIssues.length > 1 ? "s" : ""}`, impact: penalty });
  }

  if (highIssues.length > 0) {
    const penalty = Math.min(15, highIssues.length * 5);
    score -= penalty;
    issues.push({ category: "security", severity: "high", title: `${highIssues.length} high-severity security issue${highIssues.length > 1 ? "s" : ""}`, impact: penalty });
  }

  if (scan.vulnerability?.cve_matches?.total_found) {
    const count = scan.vulnerability.cve_matches.total_found;
    const penalty = Math.min(20, count * 5);
    score -= penalty;
    issues.push({ category: "security", severity: "critical", title: `${count} known CVE${count > 1 ? "s" : ""} detected`, impact: penalty });
  }

  if (scan.vulnerability?.cors_check?.misconfigured) {
    score -= 10;
    issues.push({ category: "security", severity: "high", title: "CORS misconfiguration detected", impact: 10 });
  }

  return { score: clamp(score), issues };
}

function computePerformanceScore(scan: ScanResult, speedData?: SpeedMeasurement): { score: number; issues: HealthIssue[] } {
  const issues: HealthIssue[] = [];

  if (speedData?.lighthouse_performance != null) {
    let score = speedData.lighthouse_performance;

    if (speedData.lcp_ms != null && speedData.lcp_ms > 2500) {
      const penalty = speedData.lcp_ms > 4000 ? 15 : 8;
      score -= penalty;
      issues.push({ category: "performance", severity: speedData.lcp_ms > 4000 ? "high" : "medium", title: `Slow LCP (${(speedData.lcp_ms / 1000).toFixed(1)}s)`, impact: penalty });
    }

    if (speedData.cls != null && speedData.cls > 0.25) {
      score -= 10;
      issues.push({ category: "performance", severity: "medium", title: `High CLS (${speedData.cls.toFixed(2)})`, impact: 10 });
    }

    return { score: clamp(score), issues };
  }

  let score = 70;

  if (scan.js_bundles) {
    const totalMB = scan.js_bundles.total_size_bytes / (1024 * 1024);
    if (totalMB > 2) {
      score -= 20;
      issues.push({ category: "performance", severity: "high", title: `Large JS payload (${totalMB.toFixed(1)} MB)`, impact: 20 });
    } else if (totalMB > 1) {
      score -= 10;
      issues.push({ category: "performance", severity: "medium", title: `JS payload over 1 MB (${totalMB.toFixed(1)} MB)`, impact: 10 });
    }
  }

  if (scan.supply_chain) {
    const externalCount = scan.supply_chain.total_external;
    if (externalCount > 20) {
      const penalty = Math.min(15, Math.floor((externalCount - 20) / 5) * 5);
      score -= penalty;
      issues.push({ category: "performance", severity: "medium", title: `${externalCount} external dependencies`, impact: penalty });
    }
  }

  return { score: clamp(score), issues };
}

function computeSeoScore(scan: ScanResult): { score: number; issues: HealthIssue[] } {
  const issues: HealthIssue[] = [];
  if (!scan.seo) return { score: 0, issues: [{ category: "seo", severity: "high", title: "No SEO data available", impact: 100 }] };
  let score = scan.seo.score;

  if (!scan.seo.has_sitemap) {
    score -= 10;
    issues.push({ category: "seo", severity: "medium", title: "Missing sitemap.xml", impact: 10 });
  }

  if (!scan.seo.has_robots_txt) {
    score -= 10;
    issues.push({ category: "seo", severity: "medium", title: "Missing robots.txt", impact: 10 });
  }

  if (!scan.seo.has_canonical) {
    score -= 5;
    issues.push({ category: "seo", severity: "low", title: "Missing canonical tag", impact: 5 });
  }

  if (!scan.seo.has_structured_data) {
    score -= 5;
    issues.push({ category: "seo", severity: "low", title: "No structured data (JSON-LD/Schema)", impact: 5 });
  }

  if (scan.seo.h1_count === 0) {
    score -= 5;
    issues.push({ category: "seo", severity: "medium", title: "No H1 heading found", impact: 5 });
  } else if (scan.seo.h1_count > 1) {
    score -= 3;
    issues.push({ category: "seo", severity: "low", title: `Multiple H1 headings (${scan.seo.h1_count})`, impact: 3 });
  }

  return { score: clamp(score), issues };
}

function computeAvailabilityScore(scan: ScanResult, uptimeData?: { uptime_percent?: number }): { score: number; issues: HealthIssue[] } {
  const issues: HealthIssue[] = [];
  let score = 85;

  if (uptimeData?.uptime_percent != null) {
    score = uptimeData.uptime_percent;
    if (score < 99) {
      const impact = Math.round(100 - score);
      issues.push({ category: "availability", severity: score < 95 ? "critical" : "high", title: `Uptime at ${score.toFixed(1)}%`, impact });
    }
  }

  const sslHeader = (scan.security.headers || []).find((h) => h.name.toLowerCase() === "strict-transport-security");
  if (!sslHeader?.present) {
    score -= 10;
    issues.push({ category: "availability", severity: "medium", title: "Missing HSTS header", impact: 10 });
  }

  return { score: clamp(score), issues };
}

export function computeHealthScore(
  scan: ScanResult,
  speedData?: SpeedMeasurement,
  uptimeData?: { uptime_percent?: number },
): HealthScore {
  const sec = computeSecurityScore(scan);
  const perf = computePerformanceScore(scan, speedData);
  const seo = computeSeoScore(scan);
  const avail = computeAvailabilityScore(scan, uptimeData);

  const overall = clamp(
    sec.score * WEIGHTS.security +
    perf.score * WEIGHTS.performance +
    seo.score * WEIGHTS.seo +
    avail.score * WEIGHTS.availability,
  );

  const allIssues = [...sec.issues, ...perf.issues, ...seo.issues, ...avail.issues]
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] - order[b.severity]) || (b.impact - a.impact);
    });

  return {
    overall,
    security: sec.score,
    performance: perf.score,
    seo: seo.score,
    availability: avail.score,
    issues: allIssues,
  };
}
