import ora from "ora";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";
import { formatScanResult, toSarif, shouldFail } from "../core/formatter.js";
import { normalizeUrl, extractDomain, suggestNextSteps } from "../core/helpers.js";
import { handleError } from "../core/errors.js";

interface ScanOptions {
  json?: boolean;
  format?: string;
  failOn?: string;
  quiet?: boolean;
  apiKey?: string;
}

export async function scanCommand(url: string, options: ScanOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  url = normalizeUrl(url);

  const spinner = options.quiet ? null : ora(`Scanning ${url}...`).start();

  try {
    const response = await client.scan(url);
    const result = response.result || response; // Fallback to response if for some reason it's not wrapped

    spinner?.succeed("Scan complete");

    if (options.json || options.format === "json") {
      console.log(JSON.stringify(response, null, 2));
    } else if (options.format === "sarif") {
      const findings = [
        ...(result.security_findings || []),
        ...(result.offensive_findings || []),
      ];
      console.log(JSON.stringify(toSarif(findings, url), null, 2));
    } else if (!options.quiet) {
      console.log(formatScanResult(result));

      if (!options.failOn) {
        const allFindings = [
          ...(result.security_findings || []),
          ...(result.offensive_findings || []),
        ];
        suggestNextSteps(extractDomain(url), allFindings);
      }
    }

    if (options.failOn) {
      const allFindings = [
        ...(result.security_findings || []),
        ...(result.offensive_findings || []),
      ];
      if (shouldFail(allFindings, options.failOn)) {
        process.exit(1);
      }
    }
  } catch (error) {
    handleError(error, spinner ?? undefined);
  }
}

