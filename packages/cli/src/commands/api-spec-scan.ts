import ora from "ora";
import chalk from "chalk";
import { readFile } from "node:fs/promises";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";
import { formatFindings, shouldFail } from "../core/formatter.js";
import { handleError } from "../core/errors.js";

interface ApiSpecScanOptions {
  specFile?: string;
  specUrl?: string;
  dryRun?: boolean;
  json?: boolean;
  format?: string;
  failOn?: string;
  rateLimit?: string;
  quiet?: boolean;
  apiKey?: string;
}

export async function apiSpecScanCommand(domain: string, options: ApiSpecScanOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  // Resolve spec from file, URL, or error
  let spec: string;
  if (options.specFile) {
    spec = await readFile(options.specFile, "utf-8");
  } else if (options.specUrl) {
    spec = options.specUrl;
  } else {
    console.error(chalk.red("  Error: provide --spec-file or --spec-url"));
    process.exit(1);
  }

  if (options.dryRun) {
    console.log("");
    console.log(chalk.bold(`  Dry Run — API Spec Scan Plan for ${domain}`));
    console.log(chalk.dim("  " + "─".repeat(50)));
    console.log("");
    console.log(`  Domain:     ${chalk.cyan(domain)}`);
    console.log(`  Spec:       ${chalk.cyan(options.specFile || options.specUrl || "inline")}`);
    console.log(`  Rate limit: ${chalk.cyan(options.rateLimit || "moderate")}`);
    console.log("");
    console.log(`  ${chalk.green("+")} Endpoint discovery & validation`);
    console.log(`  ${chalk.green("+")} Authentication testing`);
    console.log(`  ${chalk.green("+")} Injection testing (SQLi, XSS, command injection)`);
    console.log(`  ${chalk.green("+")} Rate limit analysis`);
    console.log(`  ${chalk.green("+")} Schema validation & spec issues`);
    console.log("");
    console.log(chalk.dim("  No requests will be sent. Remove --dry-run to start the scan."));
    console.log("");
    return;
  }

  const spinner = options.quiet ? null : ora(`Starting API spec scan on ${domain}...`).start();

  try {
    const startResult = await client.startApiSpecScan(domain, spec, undefined, options.rateLimit);
    const scanId = startResult.scan?.id;

    if (!scanId) {
      spinner?.fail("Failed to start API spec scan");
      process.exit(1);
    }

    if (spinner) spinner.text = `API spec scan ${scanId} running...`;

    const result = await client.pollUntilDone(
      () => client.getApiSpecScan(scanId),
      (r) => {
        const status = r.scan?.status;
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      600_000
    );

    const scan = result.scan;

    if (scan.status === "failed") {
      spinner?.fail("API spec scan failed");
    } else {
      spinner?.succeed(`API spec scan complete for ${domain}`);
    }

    if (options.json || options.format === "json") {
      console.log(JSON.stringify(result, null, 2));
    } else if (options.format === "sarif") {
      const sarifOutput = {
        version: "2.1.0",
        $schema: "https://json.schemastore.org/sarif-2.1.0.json",
        runs: [{
          tool: { driver: { name: "OwnSurface API Spec Xray", version: "1.0.0" } },
          results: (scan.findings || []).map((f: any) => ({
            ruleId: f.id,
            level: f.severity === "critical" || f.severity === "high" ? "error" : "warning",
            message: { text: f.description },
            locations: f.endpoint ? [{
              physicalLocation: { artifactLocation: { uri: f.endpoint } },
            }] : [],
          })),
        }],
      };
      console.log(JSON.stringify(sarifOutput, null, 2));
    } else if (!options.quiet) {
      const findings = scan.findings || [];

      console.log("");
      console.log(chalk.bold(`  Findings: ${findings.length}`));
      console.log(
        `  Critical: ${chalk.red(scan.severity_critical || 0)}  ` +
        `High: ${chalk.yellow(scan.severity_high || 0)}  ` +
        `Medium: ${chalk.blue(scan.severity_medium || 0)}  ` +
        `Low: ${scan.severity_low || 0}`
      );

      if (scan.endpoints_found) {
        console.log(`  Endpoints discovered: ${chalk.cyan(scan.endpoints_found)}`);
      }

      if (scan.spec_issues?.length > 0) {
        console.log("");
        console.log(chalk.bold("  Spec Issues"));
        for (const issue of scan.spec_issues.slice(0, 10)) {
          console.log(`  ${chalk.yellow("!")} ${issue.message || issue}`);
        }
      }

      if (findings.length > 0) {
        console.log(formatFindings(findings));
      } else {
        console.log(chalk.green("\n  No vulnerabilities found!"));
      }
    }

    if (options.failOn) {
      if (shouldFail(scan.findings || [], options.failOn)) {
        process.exit(1);
      }
    }
  } catch (error) {
    handleError(error, spinner ?? undefined);
  }
}
