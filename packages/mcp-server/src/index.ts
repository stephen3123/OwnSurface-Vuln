#!/usr/bin/env node

/**
 * OwnSurface MCP Server
 *
 * Website intelligence for AI agents. Scan any URL and get:
 * - Technology stack detection (89+ technologies)
 * - Security audit with copy-paste fix recommendations
 * - Company enrichment (Clearbit alternative)
 * - SEO analysis, traffic estimation, business signals
 * - Carbon footprint / sustainability grade
 *
 * Usage with Claude Desktop:
 * {
 *   "mcpServers": {
 *     "ownsurface": {
 *       "command": "npx",
 *       "args": ["@ownsurface/mcp-server"],
 *       "env": { "OWNSURFACE_API_KEY": "your-api-key" }
 *     }
 *   }
 * }
 *
 * Environment variables:
 *   OWNSURFACE_API_KEY  - Required. Get one at https://ownsurface.com/dashboard/api-keys
 *   OWNSURFACE_API_URL  - Optional. Override API base URL (default: https://api.ownsurface.com)
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("OwnSurface MCP Server failed to start:", error);
  process.exit(1);
});
