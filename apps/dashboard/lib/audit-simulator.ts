import type { AttackSurfaceAuditResponse } from "@/lib/api-client";

const STORAGE_KEY = "ownsurface_local_audits";

export interface LocalAudit extends AttackSurfaceAuditResponse {
  is_local: true;
}

export function saveLocalAudit(audit: LocalAudit) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalAudits();
    existing.unshift(audit);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 20)));
  } catch { /* full storage */ }
}

export function getLocalAudits(): LocalAudit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLocalAudit(id: string): LocalAudit | null {
  return getLocalAudits().find((a) => a.id === id) || null;
}

export function updateLocalAudit(id: string, update: Partial<LocalAudit>) {
  if (typeof window === "undefined") return;
  try {
    const audits = getLocalAudits();
    const idx = audits.findIndex((a) => a.id === id);
    if (idx >= 0) {
      audits[idx] = { ...audits[idx], ...update };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(audits));
    }
  } catch { /* ignore */ }
}

interface SimLog {
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  phase: string;
  message: string;
}

interface SimFinding {
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
}

// Simulation steps with realistic timing
const SIM_STEPS: { delay: number; phase: string; level: SimLog["level"]; message: string }[] = [
  { delay: 500, phase: "INIT", level: "info", message: "Initializing security probe..." },
  { delay: 800, phase: "INIT", level: "info", message: "Resolving DNS records..." },
  { delay: 600, phase: "DNS", level: "success", message: "DNS resolution complete — A, AAAA, MX, NS records found" },
  { delay: 1200, phase: "PORT", level: "info", message: "Starting port scan on top 1000 ports..." },
  { delay: 2000, phase: "PORT", level: "success", message: "Port 80 (HTTP) — OPEN" },
  { delay: 400, phase: "PORT", level: "success", message: "Port 443 (HTTPS) — OPEN" },
  { delay: 1500, phase: "PORT", level: "info", message: "Port scan complete — 2 open, 998 filtered" },
  { delay: 800, phase: "SUBDOMAIN", level: "info", message: "Enumerating subdomains via certificate transparency logs..." },
  { delay: 2500, phase: "SUBDOMAIN", level: "info", message: "Checking DNS brute-force wordlist (500 entries)..." },
  { delay: 1000, phase: "SUBDOMAIN", level: "success", message: "Found: www, api, mail, cdn" },
  { delay: 600, phase: "HEADERS", level: "info", message: "Analyzing HTTP security headers..." },
  { delay: 1200, phase: "HEADERS", level: "warning", message: "Missing Content-Security-Policy header" },
  { delay: 400, phase: "HEADERS", level: "warning", message: "Missing X-Frame-Options header" },
  { delay: 400, phase: "HEADERS", level: "success", message: "Strict-Transport-Security present" },
  { delay: 400, phase: "HEADERS", level: "success", message: "X-Content-Type-Options: nosniff" },
  { delay: 800, phase: "SSL", level: "info", message: "Analyzing SSL/TLS configuration..." },
  { delay: 1500, phase: "SSL", level: "success", message: "TLS 1.3 supported" },
  { delay: 600, phase: "SSL", level: "success", message: "Certificate valid, expires in 78 days" },
  { delay: 400, phase: "SSL", level: "info", message: "Checking cipher suite strength..." },
  { delay: 800, phase: "SSL", level: "success", message: "All cipher suites are strong (no weak/deprecated)" },
  { delay: 600, phase: "DIR", level: "info", message: "Checking common directories and admin panels..." },
  { delay: 2000, phase: "DIR", level: "info", message: "Tested 200 common paths..." },
  { delay: 500, phase: "DIR", level: "warning", message: "/robots.txt accessible — check for sensitive path disclosures" },
  { delay: 800, phase: "EMAIL", level: "info", message: "Checking email security configuration..." },
  { delay: 1000, phase: "EMAIL", level: "success", message: "SPF record found" },
  { delay: 600, phase: "EMAIL", level: "warning", message: "DMARC policy set to 'none' — consider enforcing" },
  { delay: 400, phase: "EMAIL", level: "success", message: "DKIM selector found" },
  { delay: 600, phase: "WAF", level: "info", message: "Detecting WAF/CDN presence..." },
  { delay: 1000, phase: "WAF", level: "success", message: "Cloudflare CDN detected" },
  { delay: 500, phase: "COMPLETE", level: "success", message: "Security probe complete — generating report..." },
];

function generateFindings(domain: string): SimFinding[] {
  return [
    {
      id: "f1",
      severity: "medium",
      category: "header",
      title: "Missing Content-Security-Policy",
      description: "The Content-Security-Policy header is not set. CSP helps prevent XSS attacks by controlling which resources the browser is allowed to load.",
      evidence: `HTTP/1.1 200 OK\nServer: cloudflare\nContent-Type: text/html\n\n[No Content-Security-Policy header found]`,
      remediation: "Add a Content-Security-Policy header. Start with a report-only policy to avoid breaking existing functionality.",
      cvss_score: 5.4,
      cwe_id: "CWE-693",
      affected_asset: domain,
    },
    {
      id: "f2",
      severity: "medium",
      category: "header",
      title: "Missing X-Frame-Options",
      description: "The X-Frame-Options header is not set, which may allow the site to be embedded in iframes on other domains (clickjacking risk).",
      evidence: `HTTP/1.1 200 OK\nServer: cloudflare\n\n[No X-Frame-Options header found]`,
      remediation: "Add 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN' to your server configuration.",
      cvss_score: 4.3,
      cwe_id: "CWE-1021",
      affected_asset: domain,
    },
    {
      id: "f3",
      severity: "low",
      category: "email",
      title: "DMARC policy not enforced",
      description: "The DMARC policy is set to 'none', which means email authentication failures are only reported, not blocked. Attackers can still spoof your domain.",
      evidence: `_dmarc.${domain} TXT "v=DMARC1; p=none; rua=mailto:dmarc@${domain}"`,
      remediation: "Change DMARC policy from p=none to p=quarantine or p=reject after monitoring reports.",
      affected_asset: `_dmarc.${domain}`,
    },
    {
      id: "f4",
      severity: "info",
      category: "directory",
      title: "robots.txt path disclosure",
      description: "The robots.txt file reveals directory paths that might not be intended for public knowledge. Review the disallowed paths for sensitive information.",
      evidence: `User-agent: *\nDisallow: /admin/\nDisallow: /api/internal/\nDisallow: /staging/`,
      remediation: "Review robots.txt entries. Consider removing sensitive paths — robots.txt is publicly accessible and does not prevent access.",
      affected_asset: `${domain}/robots.txt`,
    },
  ];
}

export function createLocalAudit(domain: string, scope: Record<string, any>): LocalAudit {
  const audit: LocalAudit = {
    is_local: true,
    id: `local_${Date.now()}`,
    domain,
    status: "pending",
    scope,
    findings: [],
    logs: [],
    started_at: new Date().toISOString(),
  };
  saveLocalAudit(audit);
  return audit;
}

export async function runSimulation(
  auditId: string,
  domain: string,
  onUpdate: (audit: Partial<LocalAudit>) => void,
): Promise<void> {
  const logs: SimLog[] = [];

  onUpdate({ status: "running" });

  for (const step of SIM_STEPS) {
    await new Promise((r) => setTimeout(r, step.delay));
    const log: SimLog = {
      timestamp: new Date().toISOString(),
      level: step.level,
      phase: step.phase,
      message: step.message,
    };
    logs.push(log);
    onUpdate({ logs: [...logs], status: "running" });
  }

  const findings = generateFindings(domain);
  const completed: Partial<LocalAudit> = {
    status: "complete",
    findings,
    logs,
    completed_at: new Date().toISOString(),
  };

  onUpdate(completed);
  updateLocalAudit(auditId, completed as any);
}
