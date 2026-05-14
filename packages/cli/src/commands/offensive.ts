import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";
import { formatFindings, shouldFail } from "../core/formatter.js";
import { handleError } from "../core/errors.js";

interface OffensiveOptions {
  sqli?: boolean;
  xss?: boolean;
  csrf?: boolean;
  ssrf?: boolean;
  auth?: boolean;
  all?: boolean;
  dryRun?: boolean;
  json?: boolean;
  rateLimit?: string;
  failOn?: string;
  quiet?: boolean;
  apiKey?: string;
}

export async function offensiveCommand(domain: string, options: OffensiveOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const scope: Record<string, boolean> = {};
  const hasSpecific = options.sqli || options.xss || options.csrf || options.ssrf || options.auth;

  if (!hasSpecific || options.all) {
    scope.sqli_testing = true;
    scope.xss_testing = true;
    scope.csrf_testing = true;
    scope.ssrf_testing = true;
    scope.auth_bypass_testing = true;
  } else {
    if (options.sqli) scope.sqli_testing = true;
    if (options.xss) scope.xss_testing = true;
    if (options.csrf) scope.csrf_testing = true;
    if (options.ssrf) scope.ssrf_testing = true;
    if (options.auth) scope.auth_bypass_testing = true;
  }

  const checks = Object.keys(scope).map((k) => k.replace("_testing", "")).join(", ");

  if (options.dryRun) {
    console.log("");
    console.log(chalk.bold(`  Dry Run — Offensive Scan Plan for ${domain}`));
    console.log(chalk.dim("  " + "─".repeat(50)));
    console.log("");

    const testDescriptions: Record<string, string> = {
      sqli: "SQL Injection — error-based, time-based blind, sqlmap deep mode",
      xss: "Cross-Site Scripting — Dalfox reflected XSS + custom payloads",
      csrf: "CSRF — form token validation + XSRFProbe",
      ssrf: "SSRF — internal IP probing, cloud metadata, SSRFmap",
      auth_bypass: "Auth Bypass — path manipulation, verb tampering, header injection",
    };

    for (const [key, enabled] of Object.entries(scope)) {
      if (!enabled) continue;
      const name = key.replace("_testing", "");
      const desc = testDescriptions[name] || name;
      console.log(`  ${chalk.green("+")} ${chalk.bold(name)}: ${desc}`);
    }

    console.log("");
    console.log(`  Rate limit: ${chalk.cyan(options.rateLimit || "moderate")}`);
    console.log(`  Target: ${chalk.cyan(`https://${domain}`)}`);
    console.log("");
    console.log(chalk.dim("  No payloads will be sent. Remove --dry-run to start the scan."));
    console.log("");
    return;
  }

  const spinner = options.quiet ? null : ora(`Starting offensive scan on ${domain} [${checks}]...`).start();

  try {
    const startResult = await client.startOffensiveScan(domain, scope, options.rateLimit);
    const scanId = startResult.scan?.id;

    if (!scanId) {
      spinner?.fail("Failed to start offensive scan");
      process.exit(1);
    }

    if (spinner) spinner.text = `Offensive scan ${scanId} running...`;

    const result = await client.pollUntilDone(
      () => client.getOffensiveScan(scanId),
      (r) => {
        const status = r.scan?.status;
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      300_000
    );

    const scan = result.scan;

    if (scan.status === "failed") {
      spinner?.fail("Offensive scan failed");
    } else {
      spinner?.succeed(`Offensive scan complete for ${domain}`);
    }

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (!options.quiet) {
      const findings = scan.findings || [];

      console.log("");
      console.log(chalk.bold(`  Findings: ${findings.length}`));
      console.log(`  Critical: ${chalk.red(scan.severity_critical || 0)}  High: ${chalk.yellow(scan.severity_high || 0)}  Medium: ${chalk.blue(scan.severity_medium || 0)}  Low: ${scan.severity_low || 0}`);

      if (scan.tools_used?.length > 0) {
        console.log(`  Tools: ${chalk.dim(scan.tools_used.join(", "))}`);
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
