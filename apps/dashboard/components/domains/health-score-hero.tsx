"use client";

import type { HealthScore } from "@/lib/health-score";

interface HealthScoreHeroProps {
 score: HealthScore;
}

function getGrade(score: number): string {
 if (score >= 95) return "A+";
 if (score >= 85) return "A";
 if (score >= 75) return "B";
 if (score >= 60) return "C";
 if (score >= 40) return "D";
 return "F";
}

function getScoreColor(score: number): string {
 if (score >= 80) return "#10b981";
 if (score >= 60) return "#f59e0b";
 if (score >= 40) return "#f97316";
 return "#ef4444";
}

function getScoreTextClass(score: number): string {
 if (score >= 80) return "text-emerald-400";
 if (score >= 60) return "text-amber-400";
 if (score >= 40) return "text-orange-400";
 return "text-red-400";
}

function getSeverityClass(severity: string): string {
 switch (severity) {
 case "critical": return "bg-red-500/10 text-red-400 border-red-500/20";
 case "high": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
 case "medium": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
 case "low": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
 default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
 }
}

const CATEGORIES = [
 { key: "security" as const, label: "Security", weight: "35%" },
 { key: "performance" as const, label: "Performance", weight: "30%" },
 { key: "seo" as const, label: "SEO", weight: "20%" },
 { key: "availability" as const, label: "Availability", weight: "15%" },
];

export function HealthScoreHero({ score }: HealthScoreHeroProps) {
 const radius = 70;
 const circumference = 2 * Math.PI * radius;
 const progress = (score.overall / 100) * circumference;
 const strokeColor = getScoreColor(score.overall);
 const grade = getGrade(score.overall);
 const topIssues = score.issues.slice(0, 3);

 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 <p className="section-kicker mb-4">Health Score</p>

 <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
 {/* Circular gauge */}
 <div className="relative shrink-0">
 <svg width="180" height="180" viewBox="0 0 180 180">
 <circle
 cx="90"
 cy="90"
 r={radius}
 fill="none"
 stroke="currentColor"
 className="text-white/5"
 strokeWidth="12"
 />
 <circle
 cx="90"
 cy="90"
 r={radius}
 fill="none"
 stroke={strokeColor}
 strokeWidth="12"
 strokeLinecap="round"
 strokeDasharray={`${progress} ${circumference - progress}`}
 strokeDashoffset={circumference / 4}
 style={{ transition: "stroke-dasharray 0.6s ease" }}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className={`text-4xl font-bold ${getScoreTextClass(score.overall)}`}>{grade}</span>
 <span className="text-sm text-muted-foreground">{score.overall}/100</span>
 </div>
 </div>

 {/* Sub-score bars */}
 <div className="flex-1 w-full space-y-3">
 {CATEGORIES.map(({ key, label, weight }) => {
 const value = score[key];
 const color = getScoreColor(value);
 return (
 <div key={key}>
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium">{label}</span>
 <div className="flex items-center gap-2">
 <span className="text-xs text-muted-foreground">{weight}</span>
 <span className={`text-sm font-semibold ${getScoreTextClass(value)}`}>{value}</span>
 </div>
 </div>
 <div className="h-2 rounded-full bg-white/5 overflow-hidden">
 <div
 className="h-full rounded-full transition-all duration-500"
 style={{ width: `${value}%`, backgroundColor: color }}
 />
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Top issues */}
 {topIssues.length > 0 && (
 <div className="mt-6">
 <p className="text-sm font-medium mb-3 text-muted-foreground">What&apos;s dragging you down</p>
 <div className="space-y-2">
 {topIssues.map((issue, i) => (
 <div
 key={i}
 className={`flex items-center justify-between px-3 py-2 rounded-lg border ${getSeverityClass(issue.severity)}`}
 >
 <div className="flex items-center gap-2 min-w-0">
 <span className="text-xs uppercase font-semibold opacity-70 shrink-0">{issue.severity}</span>
 <span className="text-sm truncate">{issue.title}</span>
 </div>
 <span className="text-xs whitespace-nowrap ml-3 opacity-70">−{issue.impact} pts</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
