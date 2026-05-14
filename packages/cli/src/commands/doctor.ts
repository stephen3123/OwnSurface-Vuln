import chalk from "chalk";
import { readStoredConfig, CONFIG_FILE, isAuthenticated } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

export async function doctorCommand() {
  console.log("");
  console.log(chalk.bold("  OwnSurface Doctor"));
  console.log(chalk.dim("  " + "─".repeat(50)));
  console.log("");

  let allOk = true;

  // 1. Check config file
  const stored = readStoredConfig();
  if (stored?.apiKey) {
    pass("API key configured");
  } else if (process.env.OWNSURFACE_API_KEY) {
    pass("API key set via OWNSURFACE_API_KEY env var");
  } else {
    fail("No API key found");
    hint("Run: ownsurface login");
    allOk = false;
  }

  // 2. Check config file location
  if (stored) {
    pass(`Config file: ${CONFIG_FILE}`);
  } else {
    info(`No config file at ${CONFIG_FILE}`);
  }

  // 3. Check API reachability
  const apiUrl = process.env.OWNSURFACE_API_URL || stored?.apiUrl || "https://api.ownsurface.com";
  const apiKey = stored?.apiKey || process.env.OWNSURFACE_API_KEY || "";

  if (apiKey) {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(`${apiUrl}/health`, {
        signal: controller.signal,
        headers: { "User-Agent": "ownsurface-cli/1.0.0" },
      });
      clearTimeout(timeout);
      const latency = Date.now() - start;

      if (response.ok) {
        pass(`API reachable (${apiUrl} — ${latency}ms)`);
      } else {
        fail(`API returned ${response.status} (${apiUrl})`);
        allOk = false;
      }
    } catch (error) {
      fail(`Cannot reach API (${apiUrl})`);
      hint("Check your internet connection");
      allOk = false;
    }

    // 4. Check account validity
    try {
      const client = new OwnSurfaceClient(apiKey, apiUrl);
      const me = await client.getMe();
      const user = me.user || me;
      const plan = user.plan || "free";
      pass(`Account valid (${user.email}, ${plan} plan)`);
    } catch {
      fail("API key is invalid or expired");
      hint("Run: ownsurface login");
      allOk = false;
    }

    // 5. Check verified domains
    try {
      const client = new OwnSurfaceClient(apiKey, apiUrl);
      const result = await client.listDomains();
      const domains: any[] = result.domains || result || [];
      const verified = domains.filter((d: any) => d.verified !== false);
      if (verified.length > 0) {
        pass(`${verified.length} verified domain${verified.length > 1 ? "s" : ""}`);
      } else {
        info("No verified domains (needed for offensive scanning)");
        hint("Run: ownsurface verify <domain>");
      }
    } catch {
      info("Could not fetch domains");
    }
  }

  // 6. Check CLI version
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const response = await fetch("https://registry.npmjs.org/@ownsurface/cli/latest", {
      signal: controller.signal,
      headers: { "User-Agent": "ownsurface-cli/1.0.0" },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json() as any;
      const latest = data.version;
      const current = "1.0.0";
      if (latest && latest !== current) {
        warn(`CLI outdated (v${current} → v${latest} available)`);
        hint(`Run: npm update -g @ownsurface/cli`);
        allOk = false;
      } else {
        pass(`CLI up to date (v${current})`);
      }
    }
  } catch {
    info("Could not check for updates");
  }

  console.log("");
  if (allOk) {
    console.log(chalk.green("  All checks passed!"));
  } else {
    console.log(chalk.yellow("  Some issues found. See hints above."));
  }
  console.log("");
}

function pass(msg: string): void {
  console.log(`  ${chalk.green("✓")} ${msg}`);
}

function fail(msg: string): void {
  console.log(`  ${chalk.red("✗")} ${msg}`);
}

function warn(msg: string): void {
  console.log(`  ${chalk.yellow("!")} ${msg}`);
}

function info(msg: string): void {
  console.log(`  ${chalk.dim("○")} ${msg}`);
}

function hint(msg: string): void {
  console.log(`    ${chalk.dim("→")} ${msg}`);
}
