import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";
import { formatFindings } from "../core/formatter.js";
import { handleError } from "../core/errors.js";

interface AttackSurfaceOptions {
  json?: boolean;
  rateLimit?: string;
  quiet?: boolean;
  apiKey?: string;
}

export async function attackSurfaceCommand(domain: string, options: AttackSurfaceOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const spinner = options.quiet ? null : ora(`Starting attack surface audit for ${domain}...`).start();

  try {
    const startResult = await client.startAttackSurface(domain, undefined, options.rateLimit);
    const auditId = startResult.audit?.id;

    if (!auditId) {
      spinner?.fail("Failed to start audit");
      process.exit(1);
    }

    if (spinner) spinner.text = `Audit ${auditId} running — polling for results...`;

    const result = await client.pollUntilDone(
      () => client.getAttackSurface(auditId),
      (r) => {
        const status = r.audit?.status;
        if (status === "running" && spinner) {
          const tier = r.audit?.tier1_status === "running" ? "Tier 1" :
            r.audit?.tier2_status === "running" ? "Tier 2" :
            r.audit?.tier3_status === "running" ? "Tier 3" :
            r.audit?.tier4_status === "running" ? "Tier 4" : "processing";
          spinner.text = `${domain}: ${tier}...`;
        }
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      600_000
    );

    const audit = result.audit;

    if (audit.status === "failed") {
      spinner?.fail("Audit failed");
    } else {
      spinner?.succeed(`Attack surface audit complete for ${domain}`);
    }

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (!options.quiet) {
      console.log("");
      console.log(chalk.bold(`  Findings: ${(audit.findings || []).length}`));
      console.log(`  Critical: ${chalk.red(audit.severity_critical || 0)}  High: ${chalk.yellow(audit.severity_high || 0)}  Medium: ${chalk.blue(audit.severity_medium || 0)}  Low: ${audit.severity_low || 0}`);

      if (audit.findings?.length > 0) {
        console.log(formatFindings(audit.findings));
      }

      if (audit.ai_summary) {
        console.log(chalk.bold("\n  AI Summary:"));
        console.log(`  ${audit.ai_summary}`);
      }
    }
  } catch (error) {
    handleError(error, spinner ?? undefined);
  }
}
