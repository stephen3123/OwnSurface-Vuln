"use client";

import { type DeepScanInfo } from "@/lib/api-client";
import type { ActivityTerminalEntry, ActivityTerminalStat } from "@/components/shared/activity-terminal";

export interface DeepScanPageSummary {
 url: string;
 status: string;
 scan_result?: {
 security?: { score?: number; grade?: string };
 tech_stack?: Array<{ name: string }>;
 technologies?: Array<{ name: string }>;
 };
}

export function isDeepScanActive(status: string): boolean {
 return status === "running" || status === "scanning" || status === "pending";
}

export function getDeepScanProgress(scan: DeepScanInfo | null): number {
 const status = scan?.status || "pending";
 const pagesScanned = scan?.pages_scanned || 0;
 const pagesFound = scan?.pages_found || 0;
 const effectiveTarget = pagesFound > 0 ? pagesFound : Math.max(pagesScanned, 1);

 if (status === "complete" || status === "failed") {
 return 100;
 }

 if ((status === "scanning" || status === "running") && effectiveTarget > 0) {
 return Math.min(95, 5 + Math.round((pagesScanned / effectiveTarget) * 90));
 }

 if (status === "pending") {
 return 8;
 }

 return 0;
}

export function getDeepScanEntries(scan: DeepScanInfo | null, domain: string): ActivityTerminalEntry[] {
 const status = scan?.status || "pending";
 const pagesScanned = scan?.pages_scanned || 0;
 const pagesFound = scan?.pages_found || 0;
 const results = Array.isArray(scan?.results) ? (scan?.results as DeepScanPageSummary[]) : [];
 const successfulPages = results.filter((page) => page.status === "success").length;
 const entries: ActivityTerminalEntry[] = [];

 if (status === "pending") {
 entries.push({
 id: "queued",
 label: "Queue",
 message: `Deep scan queued for ${domain}.`,
 detail: "Waiting for crawler capacity and sitemap discovery.",
 tone: "muted",
 });
 return entries;
 }

 entries.push({
 id: "session",
 label: "Session",
 message: `Crawler session active for ${domain}.`,
 detail: "Discovering URLs and analyzing page structures.",
 tone: status === "failed" ? "danger" : status === "complete" ? "success" : "accent",
 });

 if (pagesFound > 0) {
 entries.push({
 id: "discovery",
 label: "Coverage",
 message: `Discovered ${pagesFound} crawlable ${pagesFound === 1 ? "page" : "pages"}.`,
 tone: "accent",
 });
 } else if (status === "running" || status === "scanning") {
 entries.push({
 id: "discovery-pending",
 label: "Coverage",
 message: "Discovery in progress.",
 detail: "Crawl window is still expanding.",
 tone: "muted",
 });
 }

 if (pagesScanned > 0) {
 entries.push({
 id: "analysis",
 label: "Analysis",
 message: `Analyzed ${pagesScanned}${pagesFound > 0 ? ` of ${pagesFound}` : ""} ${pagesScanned === 1 ? "page" : "pages"}.`,
 detail: pagesFound > pagesScanned
 ? `${pagesFound - pagesScanned} ${pagesFound - pagesScanned === 1 ? "page remains" : "pages remain"}.`
 : "All found pages analyzed.",
 tone: "default",
 });
 }

 if (status === "complete") {
 entries.push({
 id: "complete",
 label: "Result",
 message: `Deep scan completed.`,
 detail: `${successfulPages} page ${successfulPages === 1 ? "result" : "results"} stored.`,
 tone: "success",
 });
 }

 if (status === "failed") {
 entries.push({
 id: "failed",
 label: "Result",
 message: "Deep scan stopped before completion.",
 detail: "The current session did not finish cleanly. Review the latest status and rerun if needed.",
 tone: "danger",
 });
 }

 return entries;
}

export function getDeepScanStats(scan: DeepScanInfo | null): ActivityTerminalStat[] {
 const status = scan?.status || "pending";
 const results = Array.isArray(scan?.results) ? (scan?.results as DeepScanPageSummary[]) : [];
 const successfulPages = results.filter((page) => page.status === "success").length;
 const pagesFound = scan?.pages_found || 0;
 const pagesScanned = scan?.pages_scanned || 0;

 return [
 {
 label: "Discovered",
 value: `${pagesFound}`,
 meta: "crawlable pages",
 },
 {
 label: "Analyzed",
 value: `${pagesScanned}`,
 meta: pagesFound > 0 ? `of ${pagesFound} discovered` : "awaiting discovery",
 tone: "accent",
 },
 {
 label: status === "complete" ? "Results" : "Status",
 value: status === "complete" ? `${successfulPages}` : formatDeepScanStatus(status),
 meta: status === "complete" ? "successful pages" : "current state",
 tone: status === "complete" ? "success" : status === "failed" ? "danger" : "accent",
 },
 ];
}

function formatDeepScanStatus(status: string): string {
 if (status === "complete") return "Complete";
 if (status === "failed") return "Failed";
 if (status === "scanning") return "Scanning";
 if (status === "running") return "Running";
 return "Pending";
}
