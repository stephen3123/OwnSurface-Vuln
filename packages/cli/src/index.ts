#!/usr/bin/env node

/**
 * OwnSurface CLI — See through any website.
 *
 * CLI mode:  ownsurface scan https://example.com
 * MCP mode:  ownsurface --mcp
 *
 * Environment:
 *   OWNSURFACE_API_KEY  — Required. Get at https://ownsurface.com/dashboard/api-keys
 *   OWNSURFACE_API_URL  — Optional. Override API base URL
 */

const args = process.argv.slice(2);

if (args.includes("--mcp")) {
  // MCP server mode — start the OwnSurface MCP server on stdio
  startMcpServer().catch((error) => {
    console.error("Failed to start MCP server:", error.message);
    console.error("Make sure @ownsurface/mcp-server is installed.");
    process.exit(1);
  });
} else {
  // CLI mode
  import("./cli.js").catch((error) => {
    console.error("Failed to start CLI:", error.message);
    process.exit(1);
  });
}

async function startMcpServer(): Promise<void> {
  // Try the package's compiled output first, then source via tsx
  try {
    // Standard: import the published package
    const serverModule = await import("@ownsurface/mcp-server");
    // If the module has a default export or runs on import, we're done
    if (typeof (serverModule as any).createServer === "function") {
      const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
      const server = (serverModule as any).createServer();
      const transport = new StdioServerTransport();
      await server.connect(transport);
      return;
    }
  } catch {
    // Module not found at package level — try direct file import for monorepo dev
  }

  try {
    const { createServer } = await import("@ownsurface/mcp-server/dist/server.js");
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (err) {
    throw new Error(
      `Could not load MCP server. Ensure @ownsurface/mcp-server is built (npm run build in packages/mcp-server). ` +
      `Original error: ${(err as Error).message}`
    );
  }
}
