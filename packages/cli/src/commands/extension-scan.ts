import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";
import { formatFindings, shouldFail } from "../core/formatter.js";
import { handleError } from "../core/errors.js";

interface ExtensionScanOptions {
  dryRun?: boolean;
  json?: boolean;
  format?: string;
  failOn?: string;
  quiet?: boolean;
  apiKey?: string;
}

export async function extensionScanCommand(filePath: string, options: ExtensionScanOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  if (options.dryRun) {
    console.log("");
    console.log(chalk.bold(`  Dry Run — Extension Scan Plan`));
    console.log(chalk.dim("  " + "─".repeat(50)));
    console.log("");
    console.log(`  File:  ${chalk.cyan(filePath)}`);
    console.log("");
    console.log(`  ${chalk.green("+")} Permission analysis`);
    console.log(`  ${chalk.green("+")} Content Security Policy audit`);
    console.log(`  ${chalk.green("+")} Data exfiltration detection`);
    console.log(`  ${chalk.green("+")} Malicious pattern scanning`);
    console.log(`  ${chalk.green("+")} Web Store policy compliance`);
    console.log("");
    console.log(chalk.dim("  No file will be uploaded. Remove --dry-run to start the scan."));
    console.log("");
    return;
  }

  const spinner = options.quiet ? null : ora(`Uploading ${filePath} for extension scan...`).start();

  try {
    const startResult = await client.startExtensionScan(filePath);
    const scanId = startResult.scan?.id;

    if (!scanId) {
      spinner?.fail("Failed to start extension scan");
      process.exit(1);
    }

    if (spinner) spinner.text = `Extension scan ${scanId} running...`;

    const result = await client.pollUntilDone(
      () => client.getExtensionScan(scanId),
      (r) => {
        const status = r.scan?.status;
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      300_000
    );

    const scan = result.scan;

    if (scan.status === "failed") {
      spinner?.fail("Extension scan failed");
    } else {
      spinner?.succeed(`Extension scan complete for ${filePath}`);
    }

    if (options.json || options.format === "json") {
      console.log(JSON.stringify(result, null, 2));
    } else if (options.format === "sarif") {
      const sarifOutput = {
        version: "2.1.0",
        $schema: "https://json.schemastore.org/sarif-2.1.0.json",
        runs: [{
          tool: { driver: { name: "OwnSurface Extension Xray", version: "1.0.0" } },
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

      if (scan.extension_name || scan.extension_metadata) {
        console.log("");
        console.log(chalk.bold("  Extension Info"));
        if (scan.extension_name) console.log(`  Name: ${chalk.cyan(scan.extension_name)}`);
        if (scan.extension_metadata?.version) console.log(`  Version: ${chalk.cyan(scan.extension_metadata.version)}`);
        if (scan.extension_metadata?.manifest_version) console.log(`  Manifest V${chalk.cyan(scan.extension_metadata.manifest_version)}`);
        if (scan.permissions?.length) console.log(`  Permissions: ${chalk.cyan(scan.permissions.join(", "))}`);
      }

      if (scan.webstore_verdict) {
        const verdict = scan.webstore_verdict;
        const vColor = verdict.verdict === "pass" ? chalk.green : verdict.verdict === "fail" ? chalk.red : chalk.yellow;
        console.log(`  Web Store: ${vColor(verdict.verdict.toUpperCase())}`);
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
