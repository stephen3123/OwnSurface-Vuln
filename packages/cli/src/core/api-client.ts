const SCAN_TIMEOUT_MS = 65_000;

export class OwnSurfaceClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    timeoutMs = 30_000,
    authHeader?: { key: string; value: string }
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "ownsurface-cli/1.0.0",
    };

    if (authHeader) {
      headers[authHeader.key] = authHeader.value;
    } else {
      headers["X-Api-Key"] = this.apiKey;
    }

    try {
      const response = await fetch(`${this.apiUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(`API error ${response.status}: ${errorBody || response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === "AbortError") {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  // ─── Auth ─────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    return this.request("POST", "/api/v1/auth/login", { email, password });
  }

  async createApiKey(jwtToken: string): Promise<{ key: string; id: string }> {
    return this.request("POST", "/api/v1/auth/api-key", { name: "OwnSurface CLI" }, 30_000, {
      key: "Authorization",
      value: `Bearer ${jwtToken}`,
    });
  }

  async getMe(): Promise<any> {
    return this.request("GET", "/api/v1/auth/me");
  }

  // ─── Scan ─────────────────────────────────────────────────────────────

  async scan(url: string): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/scan", { url }, SCAN_TIMEOUT_MS);
  }

  async getHistory(hash: string): Promise<any> {
    return this.request("GET", `/api/v1/history/${hash}`);
  }

  // ─── Deep Scan ────────────────────────────────────────────────────────

  async startDeepScan(domain: string): Promise<any> {
    return this.request("POST", "/api/v1/deep-scan", { domain }, SCAN_TIMEOUT_MS);
  }

  async getDeepScan(id: string): Promise<any> {
    return this.request("GET", `/api/v1/deep-scan/${id}`);
  }

  async cancelDeepScan(id: string): Promise<any> {
    return this.request("POST", `/api/v1/deep-scan/${id}/cancel`);
  }

  // ─── Attack Surface ───────────────────────────────────────────────────

  async startAttackSurface(domain: string, scope?: any, rateLimit?: string): Promise<any> {
    return this.request("POST", "/api/v1/attack-surface", {
      domain,
      scope: scope ? { checks: scope } : undefined,
      rate_limit: rateLimit || "moderate",
    });
  }

  async getAttackSurface(id: string): Promise<any> {
    return this.request("GET", `/api/v1/attack-surface/${id}`);
  }

  async cancelAttackSurface(id: string): Promise<any> {
    return this.request("POST", `/api/v1/attack-surface/${id}/cancel`);
  }

  // ─── Offensive Scan ───────────────────────────────────────────────────

  async startOffensiveScan(domain: string, scope: any, rateLimit?: string): Promise<any> {
    return this.request("POST", "/api/v1/offensive-scan", {
      domain,
      scope,
      rate_limit: rateLimit || "moderate",
    });
  }

  async getOffensiveScan(id: string): Promise<any> {
    return this.request("GET", `/api/v1/offensive-scan/${id}`);
  }

  async cancelOffensiveScan(id: string): Promise<any> {
    return this.request("POST", `/api/v1/offensive-scan/${id}/cancel`);
  }

  // ─── Mobile Scan ──────────────────────────────────────────────────

  async startMobileScan(filePath: string, scanMode: string, scope?: any, domain?: string): Promise<any> {
    const { readFile } = await import("node:fs/promises");
    const { basename } = await import("node:path");
    const fileData = await readFile(filePath);
    const fileName = basename(filePath);

    const formData = new FormData();
    formData.append("file", new Blob([fileData]), fileName);
    formData.append("scan_mode", scanMode);
    if (scope) formData.append("scope", JSON.stringify(scope));
    if (domain) formData.append("domain", domain);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/mobile-scan`, {
        method: "POST",
        headers: {
          "X-Api-Key": this.apiKey,
          "User-Agent": "ownsurface-cli/1.0.0",
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(`API error ${response.status}: ${errorBody || response.statusText}`);
      }

      return (await response.json()) as any;
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === "AbortError") {
        throw new Error("Mobile scan upload timed out after 120s");
      }
      throw error;
    }
  }

  async getMobileScan(id: string): Promise<any> {
    return this.request("GET", `/api/v1/mobile-scan/${id}`);
  }

  async cancelMobileScan(id: string): Promise<any> {
    return this.request("POST", `/api/v1/mobile-scan/${id}/cancel`);
  }

  // ─── Extension Scan ─────────────────────────────────────────────────

  async startExtensionScan(filePath: string): Promise<any> {
    const { readFile } = await import("node:fs/promises");
    const { basename } = await import("node:path");
    const fileData = await readFile(filePath);
    const fileName = basename(filePath);

    const formData = new FormData();
    formData.append("file", new Blob([fileData]), fileName);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/extension-scan`, {
        method: "POST",
        headers: {
          "X-Api-Key": this.apiKey,
          "User-Agent": "ownsurface-cli/1.0.0",
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(`API error ${response.status}: ${errorBody || response.statusText}`);
      }

      return (await response.json()) as any;
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === "AbortError") {
        throw new Error("Extension scan upload timed out after 120s");
      }
      throw error;
    }
  }

  async getExtensionScan(id: string): Promise<any> {
    return this.request("GET", `/api/v1/extension-scan/${id}`);
  }

  async cancelExtensionScan(id: string): Promise<any> {
    return this.request("POST", `/api/v1/extension-scan/${id}/cancel`);
  }

  // ─── API Spec Scan ─────────────────────────────────────────────────

  async startApiSpecScan(domain: string, spec: string, scope?: any, rateLimit?: string): Promise<any> {
    return this.request("POST", "/api/v1/api-spec-scan", {
      domain,
      spec,
      scope,
      rate_limit: rateLimit || "moderate",
    });
  }

  async getApiSpecScan(id: string): Promise<any> {
    return this.request("GET", `/api/v1/api-spec-scan/${id}`);
  }

  async cancelApiSpecScan(id: string): Promise<any> {
    return this.request("POST", `/api/v1/api-spec-scan/${id}/cancel`);
  }

  // ─── Domains ──────────────────────────────────────────────────────────

  async startVerification(domain: string): Promise<any> {
    return this.request("POST", "/api/v1/domains/verify", { domain });
  }

  async listDomains(): Promise<any> {
    return this.request("GET", "/api/v1/domains");
  }

  async deleteDomain(id: string): Promise<any> {
    return this.request("DELETE", `/api/v1/domains/${id}`);
  }

  // ─── Enrichment ───────────────────────────────────────────────────────

  async enrich(domain: string): Promise<any> {
    return this.request("POST", "/api/v1/enrich", { domain }, SCAN_TIMEOUT_MS);
  }

  async enrichCompany(domain: string): Promise<any> {
    return this.request("GET", `/api/v1/enrich/${encodeURIComponent(domain)}/company`);
  }

  async enrichTech(domain: string): Promise<any> {
    return this.request("GET", `/api/v1/enrich/${encodeURIComponent(domain)}/tech`);
  }

  async enrichSecurity(domain: string): Promise<any> {
    return this.request("GET", `/api/v1/enrich/${encodeURIComponent(domain)}/security`);
  }

  // ─── Bulk ─────────────────────────────────────────────────────────────

  async createBulkScan(urls: string[]): Promise<any> {
    return this.request("POST", "/api/v1/bulk", { urls });
  }

  async getBulkJob(id: string): Promise<any> {
    return this.request("GET", `/api/v1/bulk/${id}`);
  }

  // ─── Reports ──────────────────────────────────────────────────────────

  async createReport(url: string): Promise<any> {
    const scanResult = await this.scan(url);
    return this.request("POST", "/api/v1/reports", {
      url,
      title: `Security Report: ${url}`,
      scan_result: scanResult,
    });
  }

  async listReports(): Promise<any> {
    return this.request("GET", "/api/v1/reports");
  }

  // ─── Monitoring ───────────────────────────────────────────────────────

  async createUptimeMonitor(domain: string, intervalSeconds = 300): Promise<any> {
    return this.request("POST", "/api/v1/monitors/uptime", {
      domain,
      check_interval_seconds: intervalSeconds,
    });
  }

  async listUptimeMonitors(): Promise<any> {
    return this.request("GET", "/api/v1/monitors/uptime");
  }

  async deleteUptimeMonitor(id: string): Promise<any> {
    return this.request("DELETE", `/api/v1/monitors/uptime/${id}`);
  }

  async createSslMonitor(domain: string, alertDays = 30): Promise<any> {
    return this.request("POST", "/api/v1/monitors/ssl", {
      domain,
      alert_days_before: alertDays,
    });
  }

  async listSslMonitors(): Promise<any> {
    return this.request("GET", "/api/v1/monitors/ssl");
  }

  async getMonitoringSummary(): Promise<any> {
    return this.request("GET", "/api/v1/monitoring/summary");
  }

  async getMonitoringAlerts(): Promise<any> {
    return this.request("GET", "/api/v1/monitoring/alerts");
  }

  // ─── Leads ────────────────────────────────────────────────────────────

  async searchLeads(params: Record<string, string>): Promise<any> {
    const query = new URLSearchParams(params).toString();
    return this.request("GET", `/api/v1/leads/search?${query}`);
  }

  async listTechnologies(): Promise<any> {
    return this.request("GET", "/api/v1/leads/technologies");
  }

  // ─── Compliance ───────────────────────────────────────────────────────

  async getCompliance(domain: string): Promise<any> {
    return this.request("GET", `/api/v1/compliance/${encodeURIComponent(domain)}`);
  }

  // ─── AI Visibility ────────────────────────────────────────────────────

  async startAiVisibility(domain: string, brandName?: string): Promise<any> {
    return this.request("POST", "/api/v1/ai-visibility", { domain, brand_name: brandName });
  }

  async getAiVisibility(id: string): Promise<any> {
    return this.request("GET", `/api/v1/ai-visibility/${id}`);
  }

  async listAiVisibility(): Promise<any> {
    return this.request("GET", "/api/v1/ai-visibility");
  }

  // ─── Polling ──────────────────────────────────────────────────────────

  async pollUntilDone(
    fetchFn: () => Promise<any>,
    isDone: (r: any) => boolean,
    maxWaitMs = 300_000
  ): Promise<any> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const result = await fetchFn();
      if (isDone(result)) return result;
      await new Promise((r) => setTimeout(r, 5_000));
    }
    throw new Error("Polling timed out");
  }
}
