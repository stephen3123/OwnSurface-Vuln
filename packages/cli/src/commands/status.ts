import chalk from "chalk";
import { loadConfig, readStoredConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";
import { handleError } from "../core/errors.js";

interface StatusOptions {
  json?: boolean;
  apiKey?: string;
}

export async function statusCommand(options: StatusOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);
  const stored = readStoredConfig();

  try {
    // Fetch everything in parallel
    const [me, domains, uptime, ssl, alerts] = await Promise.all([
      client.getMe().catch(() => null),
      client.listDomains().catch(() => ({ domains: [] })),
      client.listUptimeMonitors().catch(() => ({ monitors: [] })),
      client.listSslMonitors().catch(() => ({ monitors: [] })),
      client.getMonitoringAlerts().catch(() => ({ alerts: [] })),
    ]);

    if (options.json) {
      console.log(JSON.stringify({ account: me, domains, uptime, ssl, alerts }, null, 2));
      return;
    }

    const user = me?.user || me;
    const domainList: any[] = (domains as any).domains || domains || [];
    const verified = domainList.filter((d: any) => d.verified !== false);
    const uptimeMonitors: any[] = (uptime as any).monitors || uptime || [];
    const sslMonitors: any[] = (ssl as any).monitors || ssl || [];
    const recentAlerts: any[] = (alerts as any).alerts || alerts || [];

    console.log("");
    console.log(chalk.bold("  OwnSurface Status"));
    console.log(chalk.dim("  " + "─".repeat(50)));

    // Account
    console.log("");
    const email = user?.email || stored?.email || "unknown";
    const plan = user?.plan || "free";
    const planColor = plan === "pro" ? chalk.cyan : chalk.dim;
    console.log(`  Account:  ${chalk.white(email)} (${planColor(plan)} plan)`);

    // Domains
    console.log(`  Domains:  ${chalk.white(String(verified.length))} verified`);
    if (verified.length > 0) {
      const names = verified.slice(0, 5).map((d: any) => d.domain).join(", ");
      const extra = verified.length > 5 ? ` +${verified.length - 5} more` : "";
      console.log(`            ${chalk.dim(names + extra)}`);
    }

    // Uptime monitors
    console.log("");
    if (uptimeMonitors.length > 0) {
      const up = uptimeMonitors.filter((m: any) => m.is_up !== false).length;
      const down = uptimeMonitors.length - up;
      const uptimeStatus = down > 0
        ? chalk.red(`${down} DOWN`) + chalk.dim(`, ${up} up`)
        : chalk.green(`${up} all UP`);
      console.log(`  Uptime:   ${uptimeMonitors.length} monitors — ${uptimeStatus}`);
    } else {
      console.log(`  Uptime:   ${chalk.dim("no monitors")}`);
    }

    // SSL monitors
    if (sslMonitors.length > 0) {
      const expiringSoon = sslMonitors.filter((m: any) => m.days_remaining < 30);
      const sslStatus = expiringSoon.length > 0
        ? chalk.yellow(`${expiringSoon.length} expiring soon`)
        : chalk.green("all OK");
      console.log(`  SSL:      ${sslMonitors.length} monitors — ${sslStatus}`);
    } else {
      console.log(`  SSL:      ${chalk.dim("no monitors")}`);
    }

    // Alerts
    if (recentAlerts.length > 0) {
      console.log("");
      console.log(chalk.bold(`  Recent Alerts (${recentAlerts.length})`));
      for (const a of recentAlerts.slice(0, 3)) {
        const date = new Date(a.created_at).toLocaleDateString();
        console.log(`  ${chalk.yellow("!")}  ${a.message || a.type}  ${chalk.dim(date)}`);
      }
    }

    console.log("");
  } catch (error) {
    handleError(error);
  }
}
