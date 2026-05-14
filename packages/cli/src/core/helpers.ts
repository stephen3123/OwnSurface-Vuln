import chalk from "chalk";
import { createInterface } from "node:readline";
import { OwnSurfaceClient } from "./api-client.js";
import { loadConfig } from "./config.js";

/**
 * Normalize a URL/domain input — auto-add https:// if missing.
 */
export function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url) return url;

  url = url.replace(/\/+$/, "");

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  return url;
}

/**
 * Extract domain from a URL or domain string.
 */
export function extractDomain(input: string): string {
  return input
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .trim();
}

/**
 * Prompt user for input if argument is missing.
 */
export async function promptIfMissing(value: string | undefined, prompt: string): Promise<string> {
  if (value) return value;

  if (!process.stdin.isTTY) {
    console.error(chalk.red(`  Missing required argument. Usage shown above.`));
    process.exit(1);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(chalk.cyan(`  ${prompt}: `), (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (!trimmed) {
        console.error(chalk.red("  Input required."));
        process.exit(1);
      }
      resolve(trimmed);
    });
  });
}

/**
 * For commands that require a verified domain:
 * - If domain is provided, return it
 * - If not, fetch verified domains and let user pick
 *
 * Falls back to text prompt if fetching domains fails.
 */
export async function promptVerifiedDomain(
  value: string | undefined,
  apiKey?: string
): Promise<string> {
  if (value) return value;

  if (!process.stdin.isTTY) {
    console.error(chalk.red("  Missing required argument: domain"));
    process.exit(1);
  }

  // Try to fetch verified domains
  try {
    const config = loadConfig(apiKey, true);
    if (!config.apiKey) {
      return promptIfMissing(undefined, "Domain");
    }

    const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);
    const result = await client.listDomains();
    const domains: any[] = result.domains || result || [];
    const verified = domains.filter((d: any) => d.verified !== false);

    if (verified.length === 0) {
      console.log(chalk.dim("  No verified domains found."));
      console.log(chalk.dim("  Verify one first: ownsurface verify <domain>"));
      console.log("");
      return promptIfMissing(undefined, "Domain");
    }

    // Show numbered list
    console.log("");
    console.log(chalk.bold("  Your verified domains:"));
    console.log("");
    for (let i = 0; i < verified.length; i++) {
      console.log(`  ${chalk.cyan(`[${i + 1}]`)} ${chalk.white(verified[i].domain)}`);
    }
    console.log("");

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
      rl.question(chalk.cyan("  Pick a number or type a domain: "), (answer) => {
        rl.close();
        const trimmed = answer.trim();
        if (!trimmed) {
          console.error(chalk.red("  Input required."));
          process.exit(1);
        }

        // If it's a number, pick from list
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= verified.length) {
          resolve(verified[num - 1].domain);
        } else {
          // Treat as domain name
          resolve(trimmed);
        }
      });
    });
  } catch {
    // API call failed — fall back to text prompt
    return promptIfMissing(undefined, "Domain");
  }
}

/**
 * Print "next steps" suggestions after a scan completes.
 */
export function suggestNextSteps(domain: string, findings: any[]): void {
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;

  const suggestions: string[] = [];

  if (critical > 0 || high > 0) {
    suggestions.push(`${chalk.bold("ownsurface offensive-scan")} ${domain}  ${chalk.dim("— deep vulnerability testing")}`);
  }

  suggestions.push(`${chalk.bold("ownsurface enrich")} ${domain}  ${chalk.dim("— company & tech intel")}`);
  suggestions.push(`${chalk.bold("ownsurface monitor uptime")} ${domain}  ${chalk.dim("— start monitoring")}`);

  if (suggestions.length > 0) {
    console.log(chalk.dim("  Next steps:"));
    for (const s of suggestions) {
      console.log(`  ${chalk.cyan("→")} ${s}`);
    }
    console.log("");
  }
}
