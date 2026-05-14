import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";
import { formatFindings, shouldFail } from "../core/formatter.js";
import { handleError } from "../core/errors.js";

interface MobileScanOptions {
  mode?: string;
  dryRun?: boolean;
  json?: boolean;
  format?: string;
  failOn?: string;
  quiet?: boolean;
  apiKey?: string;
}

const MODE_DESCRIPTIONS: Record<string, string> = {
  "appstore-check": "App Store compliance — manifest, permissions, insecure storage, cert validation",
  "security-audit": "Full OWASP MASVS audit — binary analysis, secrets, SSL pinning, root detection",
  "offensive-pentest": "Offensive pentest — dynamic analysis, API fuzzing, intent abuse, deep link hijacking",
};

const MODE_TO_API: Record<string, string> = {
  "appstore-check": "appstore_check",
  "security-audit": "security_audit",
  "offensive-pentest": "offensive_pentest",
};

export async function mobileScanCommand(filePath: string, options: MobileScanOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const mode = options.mode || "security-audit";
  const scanMode = MODE_TO_API[mode] || mode;

  if (options.dryRun) {
    console.log("");
    console.log(chalk.bold(`  Dry Run — Mobile Scan Plan`));
    console.log(chalk.dim("  " + "─".repeat(50)));
    console.log("");
    console.log(`  File:  ${chalk.cyan(filePath)}`);
    console.log(`  Mode:  ${chalk.cyan(mode)}`);
    console.log("");

    for (const [key, desc] of Object.entries(MODE_DESCRIPTIONS)) {
      const marker = key === mode ? chalk.green("▸") : chalk.dim("○");
      console.log(`  ${marker} ${chalk.bold(key)}: ${desc}`);
    }

    console.log("");
    console.log(chalk.dim("  No file will be uploaded. Remove --dry-run to start the scan."));
    console.log("");
    return;
  }

  const spinner = options.quiet ? null : ora(`Uploading ${filePath} for mobile ${mode} scan...`).start();

  try {
    const startResult = await client.startMobileScan(filePath, scanMode);
    const scanId = startResult.scan?.id;

    if (!scanId) {
      spinner?.fail("Failed to start mobile scan");
      process.exit(1);
    }

    if (spinner) spinner.text = `Mobile scan ${scanId} running (${mode})...`;

    const result = await client.pollUntilDone(
      () => client.getMobileScan(scanId),
      (r) => {
        const status = r.scan?.status;
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      600_000
    );

    const scan = result.scan;

    if (scan.status === "failed") {
      spinner?.fail("Mobile scan failed");
    } else {
      spinner?.succeed(`Mobile scan complete for ${filePath}`);
    }

    if (options.json || options.format === "json") {
      console.log(JSON.stringify(result, null, 2));
    } else if (options.format === "sarif") {
      const sarifOutput = {
        version: "2.1.0",
        $schema: "https://json.schemastore.org/sarif-2.1.0.json",
        runs: [{
          tool: { driver: { name: "OwnSurface Mobile Xray", version: "1.0.0" } },
          results: (scan.findings || []).map((f: any) => ({
            ruleId: f.id,
            level: f.severity === "critical" || f.severity === "high" ? "error" : "warning",
            message: { text: f.description },
            locations: f.component ? [{
              physicalLocation: { artifactLocation: { uri: f.component } },
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

      if (scan.package_name || scan.app_metadata) {
        console.log("");
        console.log(chalk.bold("  App Info"));
        if (scan.package_name) console.log(`  Package: ${chalk.cyan(scan.package_name)}`);
        if (scan.app_metadata?.version_name) console.log(`  Version: ${chalk.cyan(scan.app_metadata.version_name)}`);
        if (scan.app_metadata?.min_sdk) console.log(`  Min SDK: ${chalk.cyan(scan.app_metadata.min_sdk)}`);
        if (scan.framework_detected) console.log(`  Framework: ${chalk.cyan(scan.framework_detected)}`);
        if (scan.platform) console.log(`  Platform: ${chalk.cyan(scan.platform)}`);
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
