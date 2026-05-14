import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function getSecurityGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function getSecurityColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function getSecurityBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-400/10 border-emerald-400/20";
  if (score >= 60) return "bg-yellow-400/10 border-yellow-400/20";
  if (score >= 40) return "bg-orange-400/10 border-orange-400/20";
  return "bg-red-400/10 border-red-400/20";
}

export function truncateUrl(url: string, maxLen = 50): string {
  const clean = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen) + "...";
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "****" + key.slice(-4);
  return key.slice(0, 4) + "****" + key.slice(-4);
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    frontend: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    backend: "bg-green-500/10 text-green-400 border-green-500/20",
    cms: "bg-teal-500/10 text-teal-700 border-teal-500/20",
    analytics: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    hosting: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    cdn: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    security: "bg-red-500/10 text-red-400 border-red-500/20",
    ecommerce: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    framework: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
    database: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return colors[category.toLowerCase()] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
}
