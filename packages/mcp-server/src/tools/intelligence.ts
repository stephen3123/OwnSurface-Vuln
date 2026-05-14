import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OwnSurfaceClient } from "../api-client.js";

export function registerIntelligenceTools(server: McpServer, client: OwnSurfaceClient) {
  server.tool(
    "ownsurface_enrich_domain",
    "Enrich a domain with company info, tech stack, security posture, social links, email patterns, and traffic data. Clearbit/BuiltWith alternative. Pro plan required.",
    {
      domain: z.string().describe("Domain to enrich (e.g., stripe.com)"),
      only: z.enum(["company", "tech", "security"]).optional().describe("Get only a specific section"),
    },
    async ({ domain, only }) => {
      try {
        let result: Record<string, unknown>;
        if (only === "company") {
          result = await (client as any).getCompany(domain);
        } else if (only === "tech") {
          result = await (client as any).getTechStack(domain);
        } else if (only === "security") {
          result = await (client as any).getSecurity(domain);
        } else {
          result = await client.enrich(domain);
        }
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_search_leads",
    "Search for leads by technology stack, industry, employee count, or location. Returns domains with company info. Pro plan required.",
    {
      technology: z.string().optional().describe("Filter by technology (e.g., react, shopify, wordpress)"),
      industry: z.string().optional().describe("Filter by industry (e.g., fintech, healthcare)"),
      employees: z.string().optional().describe("Filter by employee range (e.g., 1-50, 51-200)"),
      location: z.string().optional().describe("Filter by location (e.g., US, Germany)"),
    },
    async ({ technology, industry, employees, location }) => {
      try {
        const params: Record<string, string> = {};
        if (technology) params.technology = technology;
        if (industry) params.industry = industry;
        if (employees) params.employees = employees;
        if (location) params.location = location;

        if (Object.keys(params).length === 0) {
          return {
            content: [{ type: "text" as const, text: "Error: At least one filter is required (technology, industry, employees, or location)" }],
            isError: true,
          };
        }

        const result = await client.searchLeads(params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_compliance_check",
    "Check a domain's compliance with regulations like GDPR, CCPA, HIPAA. Returns compliance score and issues. Pro plan required.",
    {
      domain: z.string().describe("Domain to check compliance for"),
    },
    async ({ domain }) => {
      try {
        const result = await client.getCompliance(domain);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_ai_visibility",
    "Check how a domain/brand appears in AI model responses (ChatGPT, Claude, etc.). Shows if AI mentions the brand, sentiment, and competitor mentions. Pro plan required.",
    {
      domain: z.string().describe("Domain to check AI visibility for"),
      brand_name: z.string().optional().describe("Brand name to search for (defaults to domain)"),
    },
    async ({ domain, brand_name }) => {
      try {
        const startResult = await client.startAiVisibility(domain, brand_name);
        const checkId = (startResult as any).check?.id || (startResult as any).id;
        if (!checkId) throw new Error("Failed to start AI visibility check");
        const result = await client.pollAiVisibility(checkId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
