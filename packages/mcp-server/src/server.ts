import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OwnSurfaceClient } from "./api-client.js";
import { registerOffensiveTools } from "./tools/offensive.js";
import { registerReconTools } from "./tools/reconnaissance.js";
import { registerSecurityDetailTools } from "./tools/security-detail.js";
import { registerAdvancedTools } from "./tools/advanced.js";
import { registerIntelligenceTools } from "./tools/intelligence.js";
import { registerManagementTools } from "./tools/management.js";
import { registerMobileTools } from "./tools/mobile.js";
import { registerExtensionTools } from "./tools/extension.js";
import { registerApiSpecTools } from "./tools/api-spec.js";

/**
 * Create and configure the OwnSurface MCP Server with all tools.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "ownsurface",
    version: "2.2.0",
  });

  const client = new OwnSurfaceClient();

  // Register tool groups
  registerOffensiveTools(server, client);       // 3 offensive testing tools
  registerReconTools(server, client);           // 2 reconnaissance tools
  registerSecurityDetailTools(server, client);  // 2 security detail tools
  registerAdvancedTools(server, client);        // 5 advanced/pro tools
  registerIntelligenceTools(server, client);    // 4 intelligence tools
  registerManagementTools(server, client);      // 5 management tools
  registerMobileTools(server, client);          // 3 mobile scanning tools
  registerExtensionTools(server, client);       // 1 extension scanning tool
  registerApiSpecTools(server, client);         // 1 API spec scanning tool

  // ─── Tool 1: scan_website ──────────────────────────────────────────────
  server.tool(
    "scan_website",
    "Scan a website and return comprehensive intelligence: tech stack, security score, SEO, company info, business signals, traffic, vulnerabilities, carbon footprint, and AI summary.",
    { url: z.string().describe("The full URL to scan (e.g., https://stripe.com)") },
    async ({ url }) => {
      try {
        const result = await client.scan(url);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error scanning ${url}: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── Tool 2: get_tech_stack ────────────────────────────────────────────
  server.tool(
    "get_tech_stack",
    "Get the technology stack of a website: frameworks, CMS, analytics, payments, CDN, hosting, and estimated infrastructure costs.",
    {
      domain: z
        .string()
        .describe("Domain name (e.g., stripe.com) or full URL"),
    },
    async ({ domain }) => {
      try {
        const result = await client.enrich(domain);
        const filtered = {
          domain: result.domain,
          tech_stack: result.tech_stack,
          cost_estimate: result.cost_estimate,
        };
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(filtered, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── Tool 3: check_security ────────────────────────────────────────────
  server.tool(
    "check_security",
    "Check a website's security posture: SSL status, security headers, grade (A+ to F), vulnerabilities, and actionable fix recommendations with copy-paste server configs.",
    {
      url: z
        .string()
        .describe("The URL to check security for (e.g., https://example.com)"),
    },
    async ({ url }) => {
      try {
        const result = await client.scan(url);
        const filtered = {
          url,
          security: result.security,
          security_findings: result.security_findings,
          vulnerability: result.vulnerability,
        };
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(filtered, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── Tool 4: get_company_info ──────────────────────────────────────────
  server.tool(
    "get_company_info",
    "Get company information from a domain: name, description, industry, location, employee range, social links, and email patterns. Clearbit alternative.",
    {
      domain: z
        .string()
        .describe("Domain name (e.g., notion.so) or full URL"),
    },
    async ({ domain }) => {
      try {
        const result = await client.enrich(domain);
        const filtered = {
          domain: result.domain,
          company: result.company,
          social_links: result.social_links,
          email_patterns: result.email_patterns,
          traffic: result.traffic,
          business_signals: result.business_signals,
        };
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(filtered, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── Tool 5: compare_websites ──────────────────────────────────────────
  server.tool(
    "compare_websites",
    "Compare two websites side by side: tech stacks, security scores, SEO, traffic, and business signals.",
    {
      url1: z.string().describe("First website URL"),
      url2: z.string().describe("Second website URL"),
    },
    async ({ url1, url2 }) => {
      try {
        const [result1, result2] = await Promise.all([
          client.scan(url1),
          client.scan(url2),
        ]);

        const comparison = {
          sites: [
            { url: url1, ...pickComparisonFields(result1) },
            { url: url2, ...pickComparisonFields(result2) },
          ],
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(comparison, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error comparing websites: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── Tool 6: get_scan_history ──────────────────────────────────────────
  server.tool(
    "get_scan_history",
    "Get historical scan data for a URL to track changes over time: tech stack additions/removals, security score trends, SEO changes.",
    {
      url: z.string().describe("The URL to get history for"),
    },
    async ({ url }) => {
      try {
        // Generate hash the same way the API does
        const hash = await generateUrlHash(url);
        const result = await client.getHistory(hash);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── Tool 7: check_carbon ─────────────────────────────────────────────
  server.tool(
    "check_carbon",
    "Check a website's carbon footprint: CO2 per visit, sustainability grade (A+ to F), green hosting status, annual environmental impact, and recommendations.",
    {
      url: z
        .string()
        .describe("The URL to check carbon footprint for"),
    },
    async ({ url }) => {
      try {
        const result = await client.scan(url);
        const perf = result.performance as Record<string, unknown> | undefined | null;
        const filtered = {
          url,
          carbon: result.carbon ?? null,
          performance: perf
            ? {
                page_weight_bytes: perf.page_weight_bytes ?? null,
                performance_score: perf.performance_score ?? null,
              }
            : null,
        };
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(filtered, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function pickComparisonFields(result: Record<string, unknown>) {
  return {
    tech_stack: result.tech_stack,
    security: result.security,
    seo: result.seo,
    traffic: result.traffic,
    business_signals: result.business_signals,
    company: result.company,
    carbon: result.carbon,
    cost_estimate: result.cost_estimate,
  };
}

async function generateUrlHash(url: string): Promise<string> {
  // Match the API's SHA256 hash of the normalized URL
  const normalized = url.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
