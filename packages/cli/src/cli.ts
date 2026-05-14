import { Command } from "commander";
import { scanCommand } from "./commands/scan.js";
import { attackSurfaceCommand } from "./commands/attack-surface.js";
import { offensiveCommand } from "./commands/offensive.js";
import { deepScanCommand } from "./commands/deep-scan.js";
import { verifyCommand } from "./commands/verify.js";
import { historyCommand } from "./commands/history.js";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { whoamiCommand } from "./commands/whoami.js";
import { domainsCommand } from "./commands/domains.js";
import { cancelCommand } from "./commands/cancel.js";
import { enrichCommand } from "./commands/enrich.js";
import { bulkCommand } from "./commands/bulk.js";
import { reportCommand } from "./commands/report.js";
import { monitorUptimeCommand, monitorSslCommand, monitorStatusCommand } from "./commands/monitor.js";
import { leadsCommand } from "./commands/leads.js";
import { complianceCommand } from "./commands/compliance.js";
import { aiVisibilityCommand } from "./commands/ai-visibility.js";
import { statusCommand } from "./commands/status.js";
import { doctorCommand } from "./commands/doctor.js";
import { printWelcome } from "./core/banner.js";

const program = new Command();

program
  .name("ownsurface")
  .description("OwnSurface — See through any website")
  .version("1.0.0")
  .action(async () => {
    await printWelcome();
  });

// ─── Auth ───────────────────────────────────────────────────────────────

program
  .command("login")
  .description("Log in to your OwnSurface account")
  .option("--api-key <key>", "Log in with an existing API key")
  .action(loginCommand);

program
  .command("logout")
  .description("Log out and remove stored credentials")
  .action(logoutCommand);

program
  .command("whoami")
  .description("Show current authenticated user")
  .action(whoamiCommand);

program
  .command("status")
  .description("Overview of account, domains, monitors, and alerts")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(statusCommand);

program
  .command("doctor")
  .description("Check CLI setup and troubleshoot issues")
  .action(doctorCommand);

// ─── Scanning ───────────────────────────────────────────────────────────

program
  .command("scan")
  .argument("[url]", "URL or domain to scan (e.g., stripe.com)")
  .description("Scan a website for security, tech stack, and vulnerabilities")
  .option("--json", "Output raw JSON")
  .option("--format <format>", "Output format: table, json, sarif", "table")
  .option("--fail-on <severity>", "CI gate: exit 1 if findings at or above severity")
  .option("--quiet", "Suppress spinners and decorations (for scripting)")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (url, options) => {
    if (!url) {
      const { promptIfMissing } = await import("./core/helpers.js");
      url = await promptIfMissing(url, "URL to scan");
    }
    return scanCommand(url, options);
  });

program
  .command("deep-scan")
  .argument("[domain]", "Verified domain to crawl")
  .description("Deep Playwright-powered crawl on a verified domain (Pro)")
  .option("--json", "Output raw JSON")
  .option("--quiet", "Suppress spinners and decorations")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (domain, options) => {
    if (!domain) {
      const { promptVerifiedDomain } = await import("./core/helpers.js");
      domain = await promptVerifiedDomain(domain, options.apiKey);
    }
    return deepScanCommand(domain, options);
  });

program
  .command("attack-surface")
  .argument("[domain]", "Verified domain to audit")
  .description("Full attack surface audit on a verified domain (Pro)")
  .option("--json", "Output raw JSON")
  .option("--rate-limit <level>", "Rate limit: conservative, moderate, aggressive", "moderate")
  .option("--quiet", "Suppress spinners and decorations")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (domain, options) => {
    if (!domain) {
      const { promptVerifiedDomain } = await import("./core/helpers.js");
      domain = await promptVerifiedDomain(domain, options.apiKey);
    }
    return attackSurfaceCommand(domain, options);
  });

program
  .command("offensive-scan")
  .argument("[domain]", "Verified domain to test")
  .description("Offensive security tests on a verified domain (Pro)")
  .option("--sqli", "Test for SQL injection")
  .option("--xss", "Test for Cross-Site Scripting")
  .option("--csrf", "Test for CSRF")
  .option("--ssrf", "Test for SSRF")
  .option("--auth", "Test for auth bypass")
  .option("--all", "Run all offensive tests (default)")
  .option("--dry-run", "Preview tests without sending payloads")
  .option("--json", "Output raw JSON")
  .option("--rate-limit <level>", "Rate limit: conservative, moderate, aggressive", "moderate")
  .option("--fail-on <severity>", "CI gate: exit 1 if findings at or above severity")
  .option("--quiet", "Suppress spinners and decorations")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (domain, options) => {
    if (!domain) {
      const { promptVerifiedDomain } = await import("./core/helpers.js");
      domain = await promptVerifiedDomain(domain, options.apiKey);
    }
    return offensiveCommand(domain, options);
  });

program
  .command("mobile-scan")
  .argument("<file>", "APK or IPA file to scan")
  .description("Mobile app security scan (Free: App Store check, Pro: full audit)")
  .option("--mode <mode>", "appstore-check, security-audit, offensive-pentest", "security-audit")
  .option("--dry-run", "Preview checks without scanning")
  .option("--json", "Output raw JSON")
  .option("--format <format>", "Output format: table, json, sarif", "table")
  .option("--fail-on <severity>", "CI gate: exit 1 if findings at or above severity")
  .option("--quiet", "Suppress spinners and decorations")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (file, options) => {
    const { mobileScanCommand } = await import("./commands/mobile-scan.js");
    return mobileScanCommand(file, options);
  });

program
  .command("extension-scan")
  .argument("<file>", "Browser extension file (.crx or .zip) to scan")
  .description("Scan a browser extension for security issues (Free: 3/day)")
  .option("--dry-run", "Preview checks without scanning")
  .option("--json", "Output raw JSON")
  .option("--format <format>", "Output format: table, json, sarif", "table")
  .option("--fail-on <severity>", "CI gate: exit 1 if findings at or above severity")
  .option("--quiet", "Suppress spinners and decorations")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (file, options) => {
    const { extensionScanCommand } = await import("./commands/extension-scan.js");
    return extensionScanCommand(file, options);
  });

program
  .command("api-spec-scan")
  .argument("[domain]", "Verified domain the API belongs to")
  .description("Scan an API using its OpenAPI/Swagger spec (Pro + verified domain)")
  .option("--spec-file <path>", "Path to OpenAPI/Swagger spec file")
  .option("--spec-url <url>", "URL to fetch OpenAPI/Swagger spec from")
  .option("--dry-run", "Preview checks without scanning")
  .option("--json", "Output raw JSON")
  .option("--format <format>", "Output format: table, json, sarif", "table")
  .option("--fail-on <severity>", "CI gate: exit 1 if findings at or above severity")
  .option("--rate-limit <level>", "Rate limit: conservative, moderate, aggressive", "moderate")
  .option("--quiet", "Suppress spinners and decorations")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (domain, options) => {
    if (!domain) {
      const { promptVerifiedDomain } = await import("./core/helpers.js");
      domain = await promptVerifiedDomain(domain, options.apiKey);
    }
    const { apiSpecScanCommand } = await import("./commands/api-spec-scan.js");
    return apiSpecScanCommand(domain, options);
  });

program
  .command("enrich")
  .argument("[domain]", "Domain to enrich")
  .description("Company info, tech stack, security, social links (Pro)")
  .option("--only <type>", "Get only: company, tech, or security")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (domain, options) => {
    if (!domain) {
      const { promptIfMissing } = await import("./core/helpers.js");
      domain = await promptIfMissing(domain, "Domain to enrich");
    }
    return enrichCommand(domain, options);
  });

program
  .command("bulk")
  .argument("[file]", "File with URLs (one per line or CSV)")
  .description("Bulk scan URLs from a file")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (file, options) => {
    if (!file) {
      const { promptIfMissing } = await import("./core/helpers.js");
      file = await promptIfMissing(file, "Path to URL file");
    }
    return bulkCommand(file, options);
  });

program
  .command("history")
  .argument("[url]", "URL to get history for")
  .description("View scan history for a URL")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (url, options) => {
    if (!url) {
      const { promptIfMissing } = await import("./core/helpers.js");
      url = await promptIfMissing(url, "URL to get history for");
    }
    return historyCommand(url, options);
  });

program
  .command("report")
  .argument("[url]", "URL to generate report for")
  .description("Generate a security report (Pro)")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (url, options) => {
    if (!url) {
      const { promptIfMissing } = await import("./core/helpers.js");
      url = await promptIfMissing(url, "URL for the report");
    }
    return reportCommand(url, options);
  });

program
  .command("cancel")
  .argument("[id]", "Scan ID to cancel")
  .description("Cancel a running scan")
  .option("--type <type>", "Scan type: offensive, attack-surface, deep-scan")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (id, options) => {
    if (!id) {
      const { promptIfMissing } = await import("./core/helpers.js");
      id = await promptIfMissing(id, "Scan ID to cancel");
    }
    return cancelCommand(id, options);
  });

// ─── Domains ────────────────────────────────────────────────────────────

program
  .command("verify")
  .argument("[domain]", "Domain to verify ownership of")
  .description("Start domain verification for offensive scanning")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (domain, options) => {
    if (!domain) {
      const { promptIfMissing } = await import("./core/helpers.js");
      domain = await promptIfMissing(domain, "Domain to verify");
    }
    return verifyCommand(domain, options);
  });

program
  .command("domains")
  .description("List all verified domains")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(domainsCommand);

// ─── Monitoring ─────────────────────────────────────────────────────────

const monitor = program
  .command("monitor")
  .description("Manage uptime and SSL monitors (Pro)");

monitor
  .command("uptime")
  .argument("[domain]", "Domain to monitor")
  .description("Create an uptime monitor")
  .option("--interval <seconds>", "Check interval in seconds", "300")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (domain, options) => {
    if (!domain) {
      const { promptVerifiedDomain } = await import("./core/helpers.js");
      domain = await promptVerifiedDomain(domain, options.apiKey);
    }
    return monitorUptimeCommand(domain, options);
  });

monitor
  .command("ssl")
  .argument("[domain]", "Domain to monitor SSL for")
  .description("Create an SSL certificate monitor")
  .option("--alert-days <days>", "Alert days before expiry", "30")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (domain, options) => {
    if (!domain) {
      const { promptVerifiedDomain } = await import("./core/helpers.js");
      domain = await promptVerifiedDomain(domain, options.apiKey);
    }
    return monitorSslCommand(domain, options);
  });

monitor
  .command("status")
  .description("Show all monitors and current status")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(monitorStatusCommand);

// ─── Intelligence ───────────────────────────────────────────────────────

program
  .command("leads")
  .description("Search leads by tech stack, industry, or location (Pro)")
  .option("--tech <technology>", "Filter by technology (e.g. react, shopify)")
  .option("--industry <industry>", "Filter by industry")
  .option("--employees <range>", "Filter by employee count")
  .option("--location <location>", "Filter by location")
  .option("--page <page>", "Page number")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(leadsCommand);

program
  .command("compliance")
  .argument("[domain]", "Domain to check compliance for")
  .description("Run a compliance check on a domain (Pro)")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (domain, options) => {
    if (!domain) {
      const { promptVerifiedDomain } = await import("./core/helpers.js");
      domain = await promptVerifiedDomain(domain, options.apiKey);
    }
    return complianceCommand(domain, options);
  });

program
  .command("ai-visibility")
  .argument("[domain]", "Domain to check AI visibility for")
  .description("Check how a domain appears in AI responses (Pro)")
  .option("--brand <name>", "Brand name to check (defaults to domain)")
  .option("--json", "Output raw JSON")
  .option("--api-key <key>", "OwnSurface API key")
  .action(async (domain, options) => {
    if (!domain) {
      const { promptVerifiedDomain } = await import("./core/helpers.js");
      domain = await promptVerifiedDomain(domain, options.apiKey);
    }
    return aiVisibilityCommand(domain, options);
  });

program.parse();
