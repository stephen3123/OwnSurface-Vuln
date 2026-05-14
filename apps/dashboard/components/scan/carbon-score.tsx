"use client";

import { Leaf, Zap, Globe, TrendingDown, Award, Building2, Wrench, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarbonScoreData {
 co2_grams_per_visit: number;
 energy_kwh_per_visit: number;
 is_green_hosted: boolean;
 hosting_provider: string | null;
 sustainability_grade: string;
 page_weight_bytes: number;
 cleaner_than_percent: number;
 annual_co2_kg: number;
 estimated_monthly_visits: number;
 recommendations: string[];
}

interface CarbonScoreProps {
 carbon: CarbonScoreData;
}

function getGradeColor(grade: string) {
 if (grade === "A+" || grade === "A") return "text-emerald-600 bg-emerald-50 border-emerald-200";
 if (grade === "B") return "text-teal-600 bg-teal-50 border-teal-200";
 if (grade === "C") return "text-amber-600 bg-amber-50 border-amber-200";
 if (grade === "D") return "text-orange-600 bg-orange-50 border-orange-200";
 return "text-rose-600 bg-rose-50 border-rose-200";
}

function getGradeRingColor(grade: string) {
 if (grade === "A+" || grade === "A") return "stroke-emerald-500";
 if (grade === "B") return "stroke-teal-500";
 if (grade === "C") return "stroke-amber-500";
 if (grade === "D") return "stroke-orange-500";
 return "stroke-rose-500";
}

function gradeToPercent(grade: string): number {
 const map: Record<string, number> = { "A+": 100, A: 88, B: 72, C: 55, D: 35, F: 15 };
 return map[grade] ?? 50;
}

function formatCO2(grams: number): string {
 if (grams < 0.01) return "<0.01g";
 if (grams < 1) return `${grams.toFixed(2)}g`;
 return `${grams.toFixed(1)}g`;
}

function formatWeight(bytes: number): string {
 if (bytes < 1024) return `${bytes}B`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
 return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatAnnualCO2(kg: number): string {
 if (kg < 1) return `${(kg * 1000).toFixed(0)}g`;
 if (kg < 1000) return `${kg.toFixed(1)}kg`;
 return `${(kg / 1000).toFixed(1)} tonnes`;
}

export function CarbonScoreCard({ carbon }: CarbonScoreProps) {
 const percent = gradeToPercent(carbon.sustainability_grade);
 const circumference = 2 * Math.PI * 54;
 const dashOffset = circumference * (1 - percent / 100);
 const gradeColor = getGradeColor(carbon.sustainability_grade);
 const ringColor = getGradeRingColor(carbon.sustainability_grade);

 return (
 <div className="shell-panel space-y-10 rounded-[2rem] p-8 border-border/40 transition-all hover:bg-card/50">
 <div className="flex items-center justify-between px-1">
 <div className="flex items-center gap-2.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
 <Leaf className="h-4.5 w-4.5 text-emerald-500/60" />
 Sustainability Analysis
 </div>
 
 {carbon.is_green_hosted && (
 <span className="teal-pill flex items-center gap-1.5 bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[0.6rem] py-1 px-3">
 <Globe className="h-3 w-3" />
 Green Infrastructure
 </span>
 )}
 </div>

 <div className="grid gap-10 lg:grid-cols-[auto_1fr] px-1">
 {/* Grade gauge */}
 <div className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-card/50 border border-border/40 relative group">
 <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
 <div className="relative h-40 w-40 mb-4 scale-110">
 <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
 <circle
 cx="60"
 cy="60"
 r="54"
 fill="none"
 strokeWidth="6"
 className="stroke-muted/10"
 />
 <circle
 cx="60"
 cy="60"
 r="54"
 fill="none"
 strokeWidth="6"
 strokeLinecap="round"
 strokeDasharray={circumference}
 strokeDashoffset={dashOffset}
 className={cn("transition-all duration-1000 ease-out", ringColor)}
 style={{ strokeDashoffset: dashOffset }}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-[0.62rem] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-1">Grade</span>
 <span className={cn("text-5xl font-black tracking-tighter leading-none", gradeColor.split(" ")[0])}>
 {carbon.sustainability_grade}
 </span>
 </div>
 </div>
 <div className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground/40 text-center max-w-[12rem] leading-relaxed">
 Efficiency rating based on <br/>digital carbon transfer
 </div>
 </div>

 {/* Key metrics grid */}
 <div className="grid gap-4 sm:grid-cols-2">
 <div className="group rounded-[1.5rem] border border-border/40 bg-card/50 p-5 transition-all hover:bg-card/50 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-muted-foreground/40 mb-3">
 <Zap className="h-3.5 w-3.5" />
 <span className="text-[0.62rem] font-bold uppercase tracking-widest">CO₂ per visit</span>
 </div>
 <div className="flex items-baseline gap-1.5">
 <div className="text-3xl font-medium tracking-tighter text-foreground stat-number">
 {formatCO2(carbon.co2_grams_per_visit)}
 </div>
 <span className="text-xs text-muted-foreground/60 font-medium">Equiv.</span>
 </div>
 </div>

 <div className="group rounded-[1.5rem] border border-border/40 bg-card/50 p-5 transition-all hover:bg-card/50 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-muted-foreground/40 mb-3">
 <TrendingDown className="h-3.5 w-3.5 text-emerald-500/40" />
 <span className="text-[0.62rem] font-bold uppercase tracking-widest">Efficiency Ranking</span>
 </div>
 <div className="flex items-baseline gap-1.5">
 <div className="text-3xl font-medium tracking-tighter text-emerald-600/80 stat-number">
 {carbon.cleaner_than_percent}%
 </div>
 <span className="text-xs text-muted-foreground/60 font-medium tracking-tight">Top-tier verified</span>
 </div>
 </div>

 <div className="group rounded-[1.5rem] border border-border/40 bg-card/50 p-5 transition-all hover:bg-card/50 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-muted-foreground/40 mb-3">
 <Globe className="h-3.5 w-3.5 text-blue-500/40" />
 <span className="text-[0.62rem] font-bold uppercase tracking-widest">Annual baseline</span>
 </div>
 <div className="flex items-baseline gap-1.5">
 <div className="text-3xl font-medium tracking-tighter text-foreground stat-number">
 {formatAnnualCO2(carbon.annual_co2_kg)}
 </div>
 </div>
 </div>

 <div className="group rounded-[1.5rem] border border-border/40 bg-card/50 p-5 transition-all hover:bg-card/50 hover:scale-[1.02]">
 <div className="flex items-center gap-2 text-muted-foreground/40 mb-3">
 <Award className="h-3.5 w-3.5 text-amber-500/40" />
 <span className="text-[0.62rem] font-bold uppercase tracking-widest">Payload weight</span>
 </div>
 <div className="flex items-baseline gap-1.5">
 <div className="text-3xl font-medium tracking-tighter text-foreground stat-number">
 {formatWeight(carbon.page_weight_bytes)}
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Hosting & Recommendations Section */}
 <div className="grid gap-6 px-1">
 {carbon.hosting_provider && (
 <div className={cn(
 "flex items-center gap-5 rounded-2xl border p-5 transition-all ",
 carbon.is_green_hosted 
 ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" 
 : "border-border/40 bg-card/50 hover:bg-card/50"
 )}>
 <div className={cn(
 "flex h-12 w-12 items-center justify-center rounded-2xl ",
 carbon.is_green_hosted ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/40 text-muted-foreground/60"
 )}>
 <Building2 className="h-6 w-6" />
 </div>
 <div>
 <div className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">Infrastructure Provider</div>
 <div className="text-sm font-semibold text-foreground/90 tracking-tight">
 {carbon.hosting_provider}
 </div>
 <p className="text-[0.75rem] text-muted-foreground/70 font-light mt-0.5">
 {carbon.is_green_hosted
 ? "Verified green infrastructure utilizing renewable energy certifications."
 : "Standard infrastructure with no public renewable energy verification found."}
 </p>
 </div>
 </div>
 )}

 {carbon.recommendations.length > 0 && (
 <div className="space-y-4">
 <h4 className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">
 <Wrench className="h-3.5 w-3.5" />
 Optimization Roadmap
 </h4>
 <div className="grid gap-3 sm:grid-cols-2">
 {carbon.recommendations.map((rec, i) => (
 <div key={i} className="flex gap-3 rounded-2xl border border-border/40 bg-card/50 p-4 transition-all hover:bg-card/50 group">
 <div className="h-8 w-8 rounded-lg bg-teal-500/5 flex items-center justify-center shrink-0 border border-teal-500/10 group-hover:bg-teal-500/10 transition-colors">
 <Check className="h-3.5 w-3.5 text-teal-600/60 group-hover:text-teal-600" />
 </div>
 <p className="text-[0.82rem] leading-relaxed text-muted-foreground/80 font-light">{rec}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
