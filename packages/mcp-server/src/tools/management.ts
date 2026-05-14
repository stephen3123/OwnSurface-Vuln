import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OwnSurfaceClient } from "../api-client.js";

export function registerManagementTools(server: McpServer, client: OwnSurfaceClient) {
  server.tool(
    "ownsurface_verify_domain",
    "Start domain ownership verification. Required before running offensive scans, deep scans, or attack surface audits. Returns DNS TXT record or file to place on the server.",
    {
      domain: z.string().describe("Domain to verify ownership of (e.g., example.com)"),
    },
    async ({ domain }) => {
      try {
        const result = await client.startVerification(domain);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_list_domains",
    "List all verified domains for the authenticated user. Use this to see which domains are available for offensive scanning, deep scans, and monitoring.",
    {},
    async () => {
      try {
        const result = await client.listDomains();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_bulk_scan",
    "Scan multiple URLs in a single batch. Returns a job ID that can be polled for results. Pro plan required.",
    {
      urls: z.array(z.string()).describe("Array of URLs to scan (max 500)"),
    },
    async ({ urls }) => {
      try {
        const result = await client.createBulkScan(urls);
        const jobId = (result as any).job?.id || (result as any).id;
        if (!jobId) throw new Error("Failed to start bulk scan");

        // Poll for completion
        const poll = async () => {
          const startTime = Date.now();
          while (Date.now() - startTime < 600_000) {
            const status = await client.getBulkJob(jobId);
            const job = (status as any).job || status;
            if (job.status === "complete" || job.status === "failed") return status;
            await new Promise((r) => setTimeout(r, 5_000));
          }
          throw new Error("Bulk scan timed out");
        };

        const finalResult = await poll();
        return { content: [{ type: "text" as const, text: JSON.stringify(finalResult, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_monitor_ssl",
    "Create an SSL certificate monitor for a domain. Alerts when the certificate is about to expire. Pro plan required.",
    {
      domain: z.string().describe("Domain to monitor SSL certificate for"),
      alert_days: z.number().optional().describe("Days before expiry to alert (default: 30)"),
    },
    async ({ domain, alert_days }) => {
      try {
        const result = await client.createSslMonitor(domain, alert_days || 30);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_cancel_scan",
    "Cancel a running scan by ID. Supports offensive scans, attack surface audits, and deep scans.",
    {
      id: z.string().describe("Scan ID to cancel"),
      type: z.enum(["offensive", "attack-surface", "deep-scan"]).describe("Type of scan to cancel"),
    },
    async ({ id, type }) => {
      try {
        switch (type) {
          case "offensive":
            await client.cancelOffensiveScan(id);
            break;
          case "attack-surface":
            await client.cancelAttackSurface(id);
            break;
          case "deep-scan":
            await client.cancelDeepScan(id);
            break;
        }
        return { content: [{ type: "text" as const, text: `Successfully cancelled ${type}: ${id}` }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
