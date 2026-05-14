import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface DomainsOptions {
  json?: boolean;
  apiKey?: string;
}

export async function domainsCommand(options: DomainsOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  try {
    const result = await client.listDomains();
    const domains = result.domains || result || [];

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log("");
    console.log(chalk.bold("  Verified Domains"));
    console.log(chalk.dim("  " + "─".repeat(50)));

    if (domains.length === 0) {
      console.log(chalk.dim("  No verified domains. Run: ownsurface verify <domain>"));
    } else {
      for (const d of domains) {
        const status = d.verified
          ? chalk.green("verified")
          : chalk.yellow("pending");
        const date = d.verified_at
          ? new Date(d.verified_at).toLocaleDateString()
          : "";
        console.log(`  ${chalk.white(d.domain)}  ${status}  ${chalk.dim(date)}`);
      }
    }
    console.log("");
  } catch (error) {
    console.error(chalk.red(`  Failed: ${(error as Error).message}`));
    process.exit(1);
  }
}
