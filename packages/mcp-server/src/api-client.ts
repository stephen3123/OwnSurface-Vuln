/**
 * HTTP client for the OwnSurface REST API.
 * Used by MCP tool handlers to call the backend.
 */

const DEFAULT_API_URL = "https://api.ownsurface.com";
const SCAN_TIMEOUT_MS = 65_000; // 65 seconds (API waits up to 60s for scan)

export class OwnSurfaceClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || process.env.OWNSURFACE_API_KEY || "dev_placeholder_key_for_local_env";
    this.apiUrl = apiUrl || process.env.OWNSURFACE_API_URL || DEFAULT_API_URL;

    if (!this.apiKey) {
      throw new Error(
        "OWNSURFACE_API_KEY is required. Get one at https://ownsurface.com/dashboard/api-keys",
      );
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    timeoutMs = 30_000,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.apiUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
          "User-Agent": "ownsurface-mcp-server/1.0.0",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(
          `OwnSurface API error ${response.status}: ${errorBody || response.statusText}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === "AbortError") {
        throw new Error(`OwnSurface API request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  /** Trigger a full scan of a URL. */
  async scan(url: string): Promise<Record<string, unknown>> {
    return this.request("POST", "/api/v1/scan", { url }, SCAN_TIMEOUT_MS);
  }

  /** Get a cached scan by URL hash. */
  async getScan(hash: string): Promise<Record<string, unknown>> {
    return this.request("GET", `/api/v1/scan/${hash}`);
  }

  /** Get scan history for a URL hash. */
  async getHistory(hash: string): Promise<Record<string, unknown>> {
    return this.request("GET", `/api/v1/history/${hash}`);
  }

  /** Enrich a domain (company data, tech stack, security). */
  async enrich(domain: string): Promise<Record<string, unknown>> {
    return this.request("POST", "/api/v1/enrich", { domain }, SCAN_TIMEOUT_MS);
  }

  /** Get enrichment data by domain (cached only). */
  async getEnrichment(domain: string): Promise<Record<string, unknown>> {
    return this.request("GET", `/api/v1/enrich/${encodeURIComponent(domain)}`);
  }

  /** Get company info only. */
  async getCompany(domain: string): Promise<Record<string, unknown>> {
    return this.request(
      "GET",
      `/api/v1/enrich/${encodeURIComponent(domain)}/company`,
    );
  }

  /** Get tech stack only. */
  async getTechStack(domain: string): Promise<Record<string, unknown>> {
    return this.request(
      "GET",
      `/api/v1/enrich/${encodeURIComponent(domain)}/tech`,
    );
  }

  /** Get security posture only. */
  async getSecurity(domain: string): Promise<Record<string, unknown>> {
    return this.request(
      "GET",
      `/api/v1/enrich/${encodeURIComponent(domain)}/security`,
    );
  }

  // ─── Offensive Scanning ────────────────────────────────────────────

  /** Start an offensive security scan. */
  async startOffensiveScan(
    domain: string,
    scope: Record<string, boolean>,
    rateLimit?: string
  ): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/offensive-scan", {
      domain,
      scope,
      rate_limit: rateLimit || "moderate",
    });
  }

  /** Get offensive scan by ID. */
  async getOffensiveScan(id: string): Promise<Record<string, any>> {
    return this.request("GET", `/api/v1/offensive-scan/${id}`);
  }

  /** Poll offensive scan until completion. */
  async pollOffensiveScan(id: string, maxWaitMs = 300_000): Promise<Record<string, any>> {
    return this.pollUntilComplete(
      () => this.getOffensiveScan(id),
      (r) => {
        const status = (r as any).scan?.status;
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      maxWaitMs
    );
  }

  // ─── Mobile Scanning ────────────────────────────────────────────

  /** Start a mobile scan with file upload. */
  async startMobileScan(
    fileData: Buffer,
    fileName: string,
    scanMode: string,
    scope?: Record<string, boolean>,
    domain?: string
  ): Promise<Record<string, any>> {
    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(fileData)]), fileName);
    formData.append("scan_mode", scanMode);
    if (scope) formData.append("scope", JSON.stringify(scope));
    if (domain) formData.append("domain", domain);

    const response = await fetch(`${this.apiUrl}/api/v1/mobile-scan`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apiKey,
        "User-Agent": "ownsurface-mcp-server/1.0.0",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `OwnSurface API error ${response.status}: ${errorBody || response.statusText}`,
      );
    }

    return (await response.json()) as Record<string, any>;
  }

  /** Get mobile scan by ID. */
  async getMobileScan(id: string): Promise<Record<string, any>> {
    return this.request("GET", `/api/v1/mobile-scan/${id}`);
  }

  /** Poll mobile scan until completion. */
  async pollMobileScan(id: string, maxWaitMs = 600_000): Promise<Record<string, any>> {
    return this.pollUntilComplete(
      () => this.getMobileScan(id),
      (r) => {
        const status = (r as any).scan?.status;
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      maxWaitMs
    );
  }

  // ─── Extension Scanning ────────────────────────────────────────────

  /** Start an extension scan with file upload. */
  async startExtensionScan(
    fileData: Buffer,
    fileName: string
  ): Promise<Record<string, any>> {
    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(fileData)]), fileName);

    const response = await fetch(`${this.apiUrl}/api/v1/extension-scan`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apiKey,
        "User-Agent": "ownsurface-mcp-server/1.0.0",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `OwnSurface API error ${response.status}: ${errorBody || response.statusText}`,
      );
    }

    return (await response.json()) as Record<string, any>;
  }

  /** Get extension scan by ID. */
  async getExtensionScan(id: string): Promise<Record<string, any>> {
    return this.request("GET", `/api/v1/extension-scan/${id}`);
  }

  /** Poll extension scan until completion. */
  async pollExtensionScan(id: string, maxWaitMs = 300_000): Promise<Record<string, any>> {
    return this.pollUntilComplete(
      () => this.getExtensionScan(id),
      (r) => {
        const status = (r as any).scan?.status;
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      maxWaitMs
    );
  }

  // ─── API Spec Scanning ────────────────────────────────────────────

  /** Start an API spec scan. */
  async startApiSpecScan(
    domain: string,
    spec: string,
    scope?: Record<string, boolean>,
    rateLimit?: string
  ): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/api-spec-scan", {
      domain,
      spec,
      scope,
      rate_limit: rateLimit || "moderate",
    });
  }

  /** Get API spec scan by ID. */
  async getApiSpecScan(id: string): Promise<Record<string, any>> {
    return this.request("GET", `/api/v1/api-spec-scan/${id}`);
  }

  /** Poll API spec scan until completion. */
  async pollApiSpecScan(id: string, maxWaitMs = 600_000): Promise<Record<string, any>> {
    return this.pollUntilComplete(
      () => this.getApiSpecScan(id),
      (r) => {
        const status = (r as any).scan?.status;
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      maxWaitMs
    );
  }

  // ─── Attack Surface ────────────────────────────────────────────────

  /** Start an attack surface audit. */
  async startAttackSurface(
    domain: string,
    scope?: Record<string, boolean>,
    rateLimit?: string
  ): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/attack-surface", {
      domain,
      scope: scope ? { checks: scope } : undefined,
      rate_limit: rateLimit || "moderate",
    });
  }

  /** Get attack surface audit by ID. */
  async getAttackSurface(id: string): Promise<Record<string, any>> {
    return this.request("GET", `/api/v1/attack-surface/${id}`);
  }

  /** Poll attack surface until completion. */
  async pollAttackSurface(id: string, maxWaitMs = 600_000): Promise<Record<string, any>> {
    return this.pollUntilComplete(
      () => this.getAttackSurface(id),
      (r) => {
        const status = (r as any).audit?.status;
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      maxWaitMs
    );
  }

  // ─── Deep Scan ─────────────────────────────────────────────────────

  /** Start a deep scan. */
  async startDeepScan(domain: string): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/deep-scan", { domain }, SCAN_TIMEOUT_MS);
  }

  /** Get deep scan by ID. */
  async getDeepScan(id: string): Promise<Record<string, any>> {
    return this.request("GET", `/api/v1/deep-scan/${id}`);
  }

  /** Poll deep scan until completion. */
  async pollDeepScan(id: string, maxWaitMs = 600_000): Promise<Record<string, any>> {
    return this.pollUntilComplete(
      () => this.getDeepScan(id),
      (r) => {
        const status = (r as any).deep_scan?.status;
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      maxWaitMs
    );
  }

  // ─── Monitoring ────────────────────────────────────────────────────

  /** Create an uptime monitor. */
  async createUptimeMonitor(url: string, name?: string): Promise<Record<string, any>> {
    // API expects { domain, check_interval_seconds?, ... }
    const domain = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return this.request("POST", "/api/v1/monitors/uptime", { domain, check_interval_seconds: 300 });
  }

  // ─── Reports ───────────────────────────────────────────────────────

  /** Generate a security report — scans the domain first, then creates report with results. */
  async generateReport(domain: string): Promise<Record<string, any>> {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    const scanResult = await this.scan(url);
    return this.request("POST", "/api/v1/reports", {
      url,
      title: `Security Report: ${domain}`,
      scan_result: scanResult,
    });
  }

  // ─── Domains ──────────────────────────────────────────────────────

  /** Start domain verification. */
  async startVerification(domain: string): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/domains/verify", { domain });
  }

  /** List verified domains. */
  async listDomains(): Promise<Record<string, any>> {
    return this.request("GET", "/api/v1/domains");
  }

  // ─── Bulk Scanning ────────────────────────────────────────────────

  /** Start a bulk scan job. */
  async createBulkScan(urls: string[]): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/bulk", { urls });
  }

  /** Get bulk scan job status. */
  async getBulkJob(id: string): Promise<Record<string, any>> {
    return this.request("GET", `/api/v1/bulk/${id}`);
  }

  // ─── SSL Monitoring ───────────────────────────────────────────────

  /** Create an SSL certificate monitor. */
  async createSslMonitor(domain: string, alertDays = 30): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/monitors/ssl", {
      domain,
      alert_days_before: alertDays,
    });
  }

  // ─── Compliance ───────────────────────────────────────────────────

  /** Get compliance report for a domain. */
  async getCompliance(domain: string): Promise<Record<string, any>> {
    return this.request("GET", `/api/v1/compliance/${encodeURIComponent(domain)}`);
  }

  // ─── AI Visibility ────────────────────────────────────────────────

  /** Start AI visibility check. */
  async startAiVisibility(domain: string, brandName?: string): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/ai-visibility", { domain, brand_name: brandName });
  }

  /** Get AI visibility check by ID. */
  async getAiVisibility(id: string): Promise<Record<string, any>> {
    return this.request("GET", `/api/v1/ai-visibility/${id}`);
  }

  /** Poll AI visibility until completion. */
  async pollAiVisibility(id: string, maxWaitMs = 120_000): Promise<Record<string, any>> {
    return this.pollUntilComplete(
      () => this.getAiVisibility(id),
      (r) => {
        const status = (r as any).check?.status || (r as any).status;
        return status === "complete" || status === "failed";
      },
      maxWaitMs
    );
  }

  // ─── Leads ────────────────────────────────────────────────────────

  /** Search leads by technology, industry, etc. */
  async searchLeads(params: Record<string, string>): Promise<Record<string, any>> {
    const query = new URLSearchParams(params).toString();
    return this.request("GET", `/api/v1/leads/search?${query}`);
  }

  // ─── Cancel ───────────────────────────────────────────────────────

  /** Cancel an offensive scan. */
  async cancelOffensiveScan(id: string): Promise<Record<string, any>> {
    return this.request("POST", `/api/v1/offensive-scan/${id}/cancel`);
  }

  /** Cancel an attack surface audit. */
  async cancelAttackSurface(id: string): Promise<Record<string, any>> {
    return this.request("POST", `/api/v1/attack-surface/${id}/cancel`);
  }

  /** Cancel a deep scan. */
  async cancelDeepScan(id: string): Promise<Record<string, any>> {
    return this.request("POST", `/api/v1/deep-scan/${id}/cancel`);
  }

  // ─── Polling Utility ───────────────────────────────────────────────

  private async pollUntilComplete<T>(
    fetchFn: () => Promise<T>,
    isDone: (result: T) => boolean,
    maxWaitMs: number,
    intervalMs = 5_000
  ): Promise<T> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const result = await fetchFn();
      if (isDone(result)) return result;
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error(`Polling timed out after ${maxWaitMs}ms`);
  }
}
