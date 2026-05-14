import chalk from "chalk";

const SEVERITY_COLORS: Record<string, (s: string) => string> = {
  critical: chalk.bgRed.white.bold,
  high: chalk.red.bold,
  medium: chalk.yellow,
  low: chalk.blue,
  info: chalk.gray,
};

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function formatScanResult(result: any): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(chalk.bold.cyan(`  Scan Results: ${result.url || "unknown"}`));
  lines.push(chalk.dim("  " + "─".repeat(60)));

  // Security grade
  if (result.security) {
    const grade = result.security.grade || "?";
    const gradeColor = grade.startsWith("A") ? chalk.green : grade === "B" ? chalk.yellow : chalk.red;
    lines.push(`  Security Grade: ${gradeColor(grade)} (${result.security.score}/100)`);
  }

  // Tech stack summary
  if (result.tech_stack?.length > 0) {
    const techs = result.tech_stack.slice(0, 10).map((t: any) => t.name).join(", ");
    lines.push(`  Tech Stack: ${techs}`);
  }

  // Vulnerability summary
  if (result.vulnerability) {
    const v = result.vulnerability;
    const issues: string[] = [];
    if (v.sensitive_files?.exposed_files?.length > 0)
      issues.push(`${v.sensitive_files.exposed_files.length} exposed files`);
    if (v.cve_matches?.total_found > 0)
      issues.push(`${v.cve_matches.total_found} CVEs`);
    if (issues.length > 0) {
      lines.push(`  Vulnerabilities: ${chalk.red(issues.join(", "))}`);
    }
  }

  // Security findings
  if (result.security_findings?.length > 0) {
    lines.push("");
    lines.push(chalk.bold("  Security Findings:"));
    for (const finding of result.security_findings.slice(0, 10)) {
      const colorFn = SEVERITY_COLORS[finding.severity] || chalk.white;
      lines.push(`  ${colorFn(`[${finding.severity.toUpperCase()}]`)} ${finding.title}`);
    }
  }

  // Offensive findings
  if (result.offensive_findings?.length > 0) {
    lines.push("");
    lines.push(chalk.bold("  Offensive Findings:"));
    for (const finding of result.offensive_findings) {
      const colorFn = SEVERITY_COLORS[finding.severity] || chalk.white;
      lines.push(`  ${colorFn(`[${finding.severity.toUpperCase()}]`)} ${finding.title}`);
      if (finding.tool_used) {
        lines.push(`    ${chalk.dim(`Tool: ${finding.tool_used}`)}`);
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function formatFindings(findings: any[]): string {
  const lines: string[] = [];

  // Summary counts
  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] || 0) + 1;
  }

  lines.push("");
  lines.push(chalk.bold("  Findings Summary:"));
  const summary = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([sev, count]) => {
      const colorFn = SEVERITY_COLORS[sev] || chalk.white;
      return colorFn(`${count} ${sev}`);
    })
    .join("  ");
  lines.push(`  ${summary}`);
  lines.push("");

  // Detailed findings
  const sorted = [...findings].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] || 4) - (SEVERITY_ORDER[b.severity] || 4)
  );

  for (const finding of sorted) {
    const colorFn = SEVERITY_COLORS[finding.severity] || chalk.white;
    lines.push(`  ${colorFn(`[${finding.severity.toUpperCase()}]`)} ${finding.title}`);
    if (finding.description) {
      lines.push(`    ${chalk.dim(finding.description.slice(0, 120))}`);
    }
    if (finding.remediation) {
      lines.push(`    ${chalk.green("Fix:")} ${finding.remediation.slice(0, 120)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

const CWE_HELP_URLS: Record<string, string> = {
  "CWE-79": "https://cwe.mitre.org/data/definitions/79.html",
  "CWE-89": "https://cwe.mitre.org/data/definitions/89.html",
  "CWE-352": "https://cwe.mitre.org/data/definitions/352.html",
  "CWE-918": "https://cwe.mitre.org/data/definitions/918.html",
  "CWE-22": "https://cwe.mitre.org/data/definitions/22.html",
  "CWE-601": "https://cwe.mitre.org/data/definitions/601.html",
  "CWE-639": "https://cwe.mitre.org/data/definitions/639.html",
  "CWE-307": "https://cwe.mitre.org/data/definitions/307.html",
  "CWE-203": "https://cwe.mitre.org/data/definitions/203.html",
  "CWE-345": "https://cwe.mitre.org/data/definitions/345.html",
  "CWE-613": "https://cwe.mitre.org/data/definitions/613.html",
  "CWE-306": "https://cwe.mitre.org/data/definitions/306.html",
  "CWE-290": "https://cwe.mitre.org/data/definitions/290.html",
  "CWE-200": "https://cwe.mitre.org/data/definitions/200.html",
  "CWE-284": "https://cwe.mitre.org/data/definitions/284.html",
  "CWE-798": "https://cwe.mitre.org/data/definitions/798.html",
  "CWE-614": "https://cwe.mitre.org/data/definitions/614.html",
  "CWE-1004": "https://cwe.mitre.org/data/definitions/1004.html",
  "CWE-330": "https://cwe.mitre.org/data/definitions/330.html",
  "CWE-650": "https://cwe.mitre.org/data/definitions/650.html",
  "CWE-20": "https://cwe.mitre.org/data/definitions/20.html",
};

function sarifLevel(severity: string): "error" | "warning" | "note" {
  return severity === "critical" || severity === "high" ? "error" : severity === "medium" ? "warning" : "note";
}

export function toSarif(findings: any[], url: string): object {
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "OwnSurface Xray",
            version: "1.0.0",
            informationUri: "https://ownsurface.com",
            rules: findings.map((f) => ({
              id: f.id || `xray-${findings.indexOf(f)}`,
              shortDescription: { text: f.title || "Security Finding" },
              fullDescription: { text: f.description || f.title || "" },
              helpUri: f.cwe_id ? (CWE_HELP_URLS[f.cwe_id] || `https://cwe.mitre.org/data/definitions/${f.cwe_id.replace("CWE-", "")}.html`) : "https://owasp.org/www-project-web-security-testing-guide/",
              help: {
                text: f.remediation || "Review and remediate this finding.",
                markdown: f.remediation ? `**Remediation:** ${f.remediation}` : undefined,
              },
              defaultConfiguration: {
                level: sarifLevel(f.severity),
              },
              properties: {
                severity: f.severity,
                ...(f.cvss_score ? { "security-severity": String(f.cvss_score) } : {}),
                ...(f.cwe_id ? { tags: [f.cwe_id] } : {}),
              },
            })),
          },
        },
        results: findings.map((f) => ({
          ruleId: f.id || `xray-${findings.indexOf(f)}`,
          level: sarifLevel(f.severity),
          message: {
            text: f.description || f.title || "Security finding detected",
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.affected_asset || url },
              },
            },
          ],
          ...(f.proof_of_concept ? {
            fixes: [{
              description: { text: f.remediation || "Apply the recommended fix" },
            }],
          } : {}),
        })),
      },
    ],
  };
}

export function shouldFail(findings: any[], failOn: string): boolean {
  const validSeverities = ["critical", "high", "medium", "low", "info"];
  if (!validSeverities.includes(failOn)) {
    console.error(`Invalid --fail-on value: "${failOn}". Must be one of: ${validSeverities.join(", ")}`);
    process.exit(2);
  }
  const threshold = SEVERITY_ORDER[failOn];
  return findings.some((f) => (SEVERITY_ORDER[f.severity] ?? 4) <= threshold);
}
