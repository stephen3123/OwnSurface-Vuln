import type { ScanResult } from "@/lib/api-client";
import { regulations, countryRegulations, type Regulation, type ComplianceCheck } from "./regulations";

export interface ComplianceResult {
  regulation: Regulation;
  status: "compliant" | "non_compliant" | "partial" | "unknown";
  score: number;
  checks: { check: ComplianceCheck; result: "pass" | "fail" | "unknown" }[];
  passCount: number;
  failCount: number;
}

export interface CountryComplianceResult {
  countryCode: string;
  regulations: ComplianceResult[];
  overallStatus: "compliant" | "non_compliant" | "partial" | "unknown";
}

export function evaluateRegulation(scan: ScanResult, regulation: Regulation): ComplianceResult {
  const checks = regulation.checks.map((check) => ({
    check,
    result: check.evaluate(scan),
  }));

  const passCount = checks.filter((c) => c.result === "pass").length;
  const failCount = checks.filter((c) => c.result === "fail").length;
  const unknownCount = checks.filter((c) => c.result === "unknown").length;
  const total = checks.length;

  let status: ComplianceResult["status"];
  if (unknownCount === total) {
    status = "unknown";
  } else if (failCount === 0 && unknownCount === 0) {
    status = "compliant";
  } else if (passCount === 0 && unknownCount === 0) {
    status = "non_compliant";
  } else {
    status = "partial";
  }

  const evaluatedCount = total - unknownCount;
  const score = evaluatedCount > 0 ? Math.round((passCount / evaluatedCount) * 100) : 0;

  return { regulation, status, score, checks, passCount, failCount };
}

export function evaluateAllRegulations(scan: ScanResult): ComplianceResult[] {
  return regulations.map((reg) => evaluateRegulation(scan, reg));
}

export function evaluateByCountry(scan: ScanResult): CountryComplianceResult[] {
  const allResults = evaluateAllRegulations(scan);
  const resultMap = new Map<string, ComplianceResult>();
  for (const r of allResults) {
    resultMap.set(r.regulation.id, r);
  }

  const countries: CountryComplianceResult[] = [];

  for (const [countryCode, regIds] of Object.entries(countryRegulations)) {
    const countryRegs = regIds
      .map((id) => resultMap.get(id))
      .filter(Boolean) as ComplianceResult[];

    if (countryRegs.length === 0) continue;

    let overallStatus: CountryComplianceResult["overallStatus"];
    const statuses = countryRegs.map((r) => r.status);

    if (statuses.every((s) => s === "unknown")) {
      overallStatus = "unknown";
    } else if (statuses.every((s) => s === "compliant")) {
      overallStatus = "compliant";
    } else if (statuses.some((s) => s === "non_compliant")) {
      overallStatus = "non_compliant";
    } else {
      overallStatus = "partial";
    }

    countries.push({ countryCode, regulations: countryRegs, overallStatus });
  }

  return countries;
}

export function getPriorityFixes(results: ComplianceResult[]): { fix: string; unlocks: string[] }[] {
  const fixMap = new Map<string, Set<string>>();

  for (const result of results) {
    if (result.status === "compliant" || result.status === "unknown") continue;

    for (const { check, result: checkResult } of result.checks) {
      if (checkResult !== "fail") continue;

      const fixKey = check.title;
      if (!fixMap.has(fixKey)) {
        fixMap.set(fixKey, new Set());
      }
      fixMap.get(fixKey)!.add(result.regulation.name);
    }
  }

  return Array.from(fixMap.entries())
    .map(([fix, regs]) => ({ fix, unlocks: Array.from(regs) }))
    .sort((a, b) => b.unlocks.length - a.unlocks.length);
}
