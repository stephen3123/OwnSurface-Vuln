import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface MonitorUptimeOptions {
  interval?: string;
  json?: boolean;
  apiKey?: string;
}

export async function monitorUptimeCommand(domain: string, options: MonitorUptimeOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const interval = options.interval ? parseInt(options.interval, 10) : 300;

  const spinner = ora(`Creating uptime monitor for ${domain}...`).start();

  try {
    const result = await client.createUptimeMonitor(domain, interval);
    spinner.succeed("Uptime monitor created");

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const monitor = result.monitor || result;
      console.log("");
      console.log(`  Domain:   ${chalk.white(domain)}`);
      console.log(`  Interval: every ${chalk.cyan(String(interval))} seconds`);
      if (monitor.id) console.log(`  ID:       ${chalk.dim(monitor.id)}`);
      console.log("");
    }
  } catch (error) {
    spinner.fail(`Failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

interface MonitorSslOptions {
  alertDays?: string;
  json?: boolean;
  apiKey?: string;
}

export async function monitorSslCommand(domain: string, options: MonitorSslOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const alertDays = options.alertDays ? parseInt(options.alertDays, 10) : 30;

  const spinner = ora(`Creating SSL monitor for ${domain}...`).start();

  try {
    const result = await client.createSslMonitor(domain, alertDays);
    spinner.succeed("SSL monitor created");

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const monitor = result.monitor || result;
      console.log("");
      console.log(`  Domain:     ${chalk.white(domain)}`);
      console.log(`  Alert when: ${chalk.cyan(String(alertDays))} days before expiry`);
      if (monitor.id) console.log(`  ID:         ${chalk.dim(monitor.id)}`);
      console.log("");
    }
  } catch (error) {
    spinner.fail(`Failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

interface MonitorStatusOptions {
  json?: boolean;
  apiKey?: string;
}

export async function monitorStatusCommand(options: MonitorStatusOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  try {
    const [summary, uptime, ssl, alerts] = await Promise.all([
      client.getMonitoringSummary().catch(() => null),
      client.listUptimeMonitors().catch(() => ({ monitors: [] })),
      client.listSslMonitors().catch(() => ({ monitors: [] })),
      client.getMonitoringAlerts().catch(() => ({ alerts: [] })),
    ]);

    if (options.json) {
      console.log(JSON.stringify({ summary, uptime, ssl, alerts }, null, 2));
      return;
    }

    const uptimeMonitors = uptime.monitors || uptime || [];
    const sslMonitors = ssl.monitors || ssl || [];
    const recentAlerts = alerts.alerts || alerts || [];

    console.log("");
    console.log(chalk.bold("  Monitoring Status"));
    console.log(chalk.dim("  " + "─".repeat(50)));

    // Uptime monitors
    console.log("");
    console.log(chalk.bold(`  Uptime Monitors (${uptimeMonitors.length})`));
    if (uptimeMonitors.length === 0) {
      console.log(chalk.dim("  None. Create one: ownsurface monitor uptime <domain>"));
    } else {
      for (const m of uptimeMonitors) {
        const status = m.is_up === false ? chalk.red("DOWN") : chalk.green("UP");
        console.log(`  ${status}  ${m.domain}  ${chalk.dim(`${m.check_interval_seconds || 300}s interval`)}`);
      }
    }

    // SSL monitors
    console.log("");
    console.log(chalk.bold(`  SSL Monitors (${sslMonitors.length})`));
    if (sslMonitors.length === 0) {
      console.log(chalk.dim("  None. Create one: ownsurface monitor ssl <domain>"));
    } else {
      for (const m of sslMonitors) {
        const days = m.days_remaining;
        const color = days < 7 ? chalk.red : days < 30 ? chalk.yellow : chalk.green;
        console.log(`  ${color(`${days}d`)} remaining  ${m.domain}  ${chalk.dim(m.issuer || "")}`);
      }
    }

    // Recent alerts
    if (recentAlerts.length > 0) {
      console.log("");
      console.log(chalk.bold(`  Recent Alerts (${recentAlerts.length})`));
      for (const a of recentAlerts.slice(0, 5)) {
        const date = new Date(a.created_at).toLocaleDateString();
        console.log(`  ${chalk.yellow("!")}  ${a.message || a.type}  ${chalk.dim(date)}`);
      }
    }

    console.log("");
  } catch (error) {
    console.error(chalk.red(`  Failed: ${(error as Error).message}`));
    process.exit(1);
  }
}
